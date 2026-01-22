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
    const purchases = this.dataService.purchases.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    const totalSpent = purchases.reduce((sum, p) => sum + (p.quantity * p.pricePerBond) + p.commission, 0);

    const result = {
      target: target,
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
            
            const targetAmountForBond = (target.amount * dist.percent) / 100;
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
