import { Injectable } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { SetTargetDto } from './dto/target.dto';

@Injectable()
export class TargetsService {
  constructor(private readonly dataService: DataService) {}

  async setTarget(dto: SetTargetDto) {
    const targets = this.dataService.monthlyTargets;
    const existingIndex = targets.findIndex(t => t.year === dto.year && t.month === dto.month);

    if (existingIndex >= 0) {
      targets[existingIndex] = dto;
    } else {
      targets.push(dto);
    }

    await this.dataService.updateMonthlyTargets(targets);
    return dto;
  }

  async getTarget(year: number, month: number) {
    return this.dataService.monthlyTargets.find(t => t.year === year && t.month === month) || null;
  }

  async getProgress(year: number, month: number) {
    const target = await this.getTarget(year, month);
    const selectedMonthKey = `${year}-${String(month).padStart(2, '0')}`;
    const selectedMonthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
    const now = new Date();
    const purchases = this.dataService.purchases.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    const purchasesSpent = purchases.reduce((sum, p) => sum + (p.quantity * p.pricePerBond) + p.commission, 0);
    const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const isMonthBeforeOrEqual = (key: string, compareTo: string) => key <= compareTo;
    const incrementMonthKey = (key: string) => {
      const [yearStr, monthStr] = key.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      if (m === 12) return `${y + 1}-01`;
      return `${y}-${String(m + 1).padStart(2, '0')}`;
    };

    const getQuantityAtDate = (bondId: string, paymentDate: Date) =>
      this.dataService.purchases
        .filter(p => p.bondId === bondId && new Date(p.date).getTime() <= paymentDate.getTime())
        .reduce((sum, p) => sum + p.quantity, 0);

    const incomeByMonth = this.dataService.bonds.reduce((acc, bond) => {
      bond.payments.forEach(payment => {
        const paymentDate = new Date(payment.date);
        if (
          payment.received &&
          payment.type === 'coupon' &&
          paymentDate.getTime() <= periodEnd.getTime()
        ) {
          const monthKey = toMonthKey(paymentDate);
          const quantityAtDate = getQuantityAtDate(bond.id, paymentDate);
          const totalIncome = payment.amount * quantityAtDate;
          acc[monthKey] = (acc[monthKey] || 0) + totalIncome;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    const purchasesByMonth = this.dataService.purchases
      .filter(p => new Date(p.date).getTime() <= periodEnd.getTime())
      .reduce((acc, p) => {
        const monthKey = toMonthKey(new Date(p.date));
        acc[monthKey] = (acc[monthKey] || 0) + (p.quantity * p.pricePerBond) + p.commission;
        return acc;
      }, {} as Record<string, number>);

    const targetsByMonth = this.dataService.monthlyTargets
      .filter(t => isMonthBeforeOrEqual(`${t.year}-${String(t.month).padStart(2, '0')}`, selectedMonthKey))
      .reduce((acc, t) => {
        const monthKey = `${t.year}-${String(t.month).padStart(2, '0')}`;
        acc[monthKey] = t.amount;
        return acc;
      }, {} as Record<string, number>);

    const monthKeys = new Set<string>([
      ...Object.keys(incomeByMonth),
      ...Object.keys(purchasesByMonth),
      ...Object.keys(targetsByMonth),
      selectedMonthKey,
    ]);

    const firstMonthKey = Array.from(monthKeys).sort()[0] || selectedMonthKey;
    let rollingIncomeBalance = 0;
    let incomeAvailableForSelectedMonth = 0;
    let currentMonthKey = firstMonthKey;

    while (isMonthBeforeOrEqual(currentMonthKey, selectedMonthKey)) {
      const monthIncome = incomeByMonth[currentMonthKey] || 0;
      const monthSpent = purchasesByMonth[currentMonthKey] || 0;
      const monthBaseTarget = targetsByMonth[currentMonthKey] || 0;

      const incomeAvailableThisMonth = rollingIncomeBalance + monthIncome;
      if (currentMonthKey === selectedMonthKey) {
        incomeAvailableForSelectedMonth = incomeAvailableThisMonth;
      }

      const extraSpentAboveBase = Math.max(0, monthSpent - monthBaseTarget);
      const usedIncome = Math.min(incomeAvailableThisMonth, extraSpentAboveBase);
      rollingIncomeBalance = incomeAvailableThisMonth - usedIncome;

      currentMonthKey = incrementMonthKey(currentMonthKey);
    }

    // Include forecasted coupon income for the selected month:
    // - current month: only upcoming (not received yet) coupons
    // - future month: all coupons of that month
    // - past month: no forecast, only actually received coupons are counted
    const isSelectedMonthCurrent =
      selectedMonthStart.getFullYear() === now.getFullYear() &&
      selectedMonthStart.getMonth() === now.getMonth();
    const isSelectedMonthFuture = selectedMonthStart.getTime() > now.getTime();

    const projectedIncomeForSelectedMonth = this.dataService.bonds.reduce((sum, bond) => {
      const bondProjectedIncome = bond.payments.reduce((bondSum, payment) => {
        const paymentDate = new Date(payment.date);
        const isCouponInSelectedMonth =
          payment.type === 'coupon' &&
          paymentDate.getFullYear() === year &&
          paymentDate.getMonth() + 1 === month;

        if (!isCouponInSelectedMonth) return bondSum;

        const shouldIncludeProjection =
          (isSelectedMonthCurrent && !payment.received && paymentDate.getTime() >= now.getTime()) ||
          (isSelectedMonthFuture && !payment.received);

        if (!shouldIncludeProjection) return bondSum;

        const quantityAtDate = getQuantityAtDate(bond.id, paymentDate);
        return bondSum + (payment.amount * quantityAtDate);
      }, 0);

      return sum + bondProjectedIncome;
    }, 0);

    const effectiveTargetAmount = target
      ? target.amount + incomeAvailableForSelectedMonth + projectedIncomeForSelectedMonth
      : 0;
    const totalSpent = purchasesSpent;

    const result = {
      target: target ? { ...target, amount: effectiveTargetAmount } : null,
      totalSpent: totalSpent,
      bonds: [] as any[]
    };

    // If no target, we can still show what we bought
    if (target) {
        // Calculate status per bond
        result.bonds = target.distributions.map(dist => {
            const bond = this.dataService.bonds.find(b => b.id === dist.bondId);
            const bondPurchases = purchases.filter(p => p.bondId === dist.bondId);
            const spentOnBond = bondPurchases.reduce((sum, p) => sum + (p.quantity * p.pricePerBond) + p.commission, 0);
            
            const targetAmountForBond = (effectiveTargetAmount * dist.percent) / 100;
            const remaining = Math.max(0, targetAmountForBond - spentOnBond);

            return {
                bondId: dist.bondId,
                bondName: bond ? bond.name : 'Unknown Bond',
                percent: dist.percent,
                targetAmount: targetAmountForBond,
                spentAmount: spentOnBond,
                remainingAmount: remaining
            };
        });
    } else {
         // Just list what we bought if no target defined
         const uniqueBondIds = [...new Set(purchases.map(p => p.bondId))];
         result.bonds = uniqueBondIds.map(bondId => {
            const bond = this.dataService.bonds.find(b => b.id === bondId);
            const bondPurchases = purchases.filter(p => p.bondId === bondId);
            const spentOnBond = bondPurchases.reduce((sum, p) => sum + (p.quantity * p.pricePerBond) + p.commission, 0);
             return {
                bondId: bondId,
                bondName: bond ? bond.name : 'Unknown Bond',
                percent: 0,
                targetAmount: 0,
                spentAmount: spentOnBond,
                remainingAmount: 0
            };
         });
    }

    return result;
  }
}
