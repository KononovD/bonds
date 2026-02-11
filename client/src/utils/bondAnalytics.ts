import { Bond, Purchase } from '../types';

/** Все суммы в копейках (как в API). Для отображения делить на 100. */

export interface BondMetrics {
  bondId: string;
  bondName: string;
  /** Сумма всех купонных выплат на 1 облигацию (копейки) */
  totalCoupons: number;
  /** Сумма погашения на 1 облигацию (копейки) */
  redemption: number;
  /** Всего доход на 1 облигацию: купоны + погашение */
  totalReturnPerBond: number;
  /** Количество выплат (купонов + погашение) */
  paymentCount: number;
  /** Купонная ставка годовых (0.15 = 15%) */
  couponRateAnnual: number;
  /** Номинал (копейки) */
  faceValue: number;
  /** Лет до погашения от сегодня */
  yearsToMaturity: number;
  /** Средняя цена покупки по сделкам (копейки), если есть покупки */
  avgPurchasePrice: number | null;
  /** Эффективная доходность к погашению в год (десятичная, 0.12 = 12%), если есть цена покупки */
  effectiveYieldAnnual: number | null;
  /** Доходность при заданной цене (для сравнения рыночной цены) — десятичная */
  yieldAtPrice: number | null;
}

/**
 * Сумма купонных выплат на 1 облигацию (копейки).
 */
export function getTotalCoupons(bond: Bond): number {
  return bond.payments
    .filter(p => p.type === 'coupon')
    .reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Сумма выплаты погашения на 1 облигацию (копейки).
 * Обычно одна выплата type === 'redemption'.
 */
export function getRedemption(bond: Bond): number {
  const redemptionPayment = bond.payments.find(p => p.type === 'redemption');
  return redemptionPayment ? redemptionPayment.amount : bond.faceValue;
}

/**
 * Полный доход на 1 облигацию до погашения: купоны + погашение (копейки).
 */
export function getTotalReturnPerBond(bond: Bond): number {
  return getTotalCoupons(bond) + getRedemption(bond);
}

/**
 * Лет до погашения от указанной даты (по умолчанию сегодня).
 */
export function getYearsToMaturity(bond: Bond, fromDate: Date = new Date()): number {
  const maturity = new Date(bond.maturityDate);
  const diffMs = maturity.getTime() - fromDate.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 365.25));
}

/**
 * Средняя цена покупки по сделкам для данной облигации (копейки), или null.
 */
export function getAvgPurchasePrice(bondId: string, purchases: Purchase[]): number | null {
  const bondPurchases = purchases.filter(p => p.bondId === bondId);
  if (bondPurchases.length === 0) return null;
  const totalSpent = bondPurchases.reduce((s, p) => s + p.quantity * p.pricePerBond, 0);
  const totalQty = bondPurchases.reduce((s, p) => s + p.quantity, 0);
  return totalSpent / totalQty;
}

/**
 * Упрощённая эффективная доходность в год (десятичная): (totalReturn - price) / price / years.
 * Если years <= 0, возвращаем null.
 */
export function effectiveYieldAnnual(
  totalReturnPerBond: number,
  purchasePrice: number,
  yearsToMaturity: number
): number | null {
  if (yearsToMaturity <= 0 || purchasePrice <= 0) return null;
  const profit = totalReturnPerBond - purchasePrice;
  return profit / purchasePrice / yearsToMaturity;
}

/**
 * Доходность при заданной текущей цене (для «что если куплю по этой цене»).
 */
export function yieldAtPrice(
  totalReturnPerBond: number,
  currentPrice: number,
  yearsToMaturity: number
): number | null {
  return effectiveYieldAnnual(totalReturnPerBond, currentPrice, yearsToMaturity);
}

/**
 * Собрать метрики по одной облигации (и опционально «цену для сравнения»).
 */
export function getBondMetrics(
  bond: Bond,
  purchases: Purchase[],
  comparePriceCents: number | null = null
): BondMetrics {
  const totalCoupons = getTotalCoupons(bond);
  const redemption = getRedemption(bond);
  const totalReturnPerBond = totalCoupons + redemption;
  const years = getYearsToMaturity(bond);
  const avgPrice = getAvgPurchasePrice(bond.id, purchases);

  let effectiveYieldAnnualVal: number | null = null;
  if (avgPrice != null && avgPrice > 0 && years > 0) {
    effectiveYieldAnnualVal = effectiveYieldAnnual(totalReturnPerBond, avgPrice, years);
  }

  let yieldAtPriceVal: number | null = null;
  if (comparePriceCents != null && comparePriceCents > 0 && years > 0) {
    yieldAtPriceVal = yieldAtPrice(totalReturnPerBond, comparePriceCents, years);
  }

  return {
    bondId: bond.id,
    bondName: bond.name,
    totalCoupons,
    redemption,
    totalReturnPerBond,
    paymentCount: bond.payments.length,
    couponRateAnnual: bond.couponRateAnnual,
    faceValue: bond.faceValue,
    yearsToMaturity: years,
    avgPurchasePrice: avgPrice,
    effectiveYieldAnnual: effectiveYieldAnnualVal,
    yieldAtPrice: yieldAtPriceVal,
  };
}

/**
 * Метрики по всем облигациям (comparePrices — опциональные «цены для сравнения» по bondId).
 */
export function getAllBondMetrics(
  bonds: Bond[],
  purchases: Purchase[],
  comparePrices: Record<string, number> = {}
): BondMetrics[] {
  return bonds.map(bond =>
    getBondMetrics(bond, purchases, comparePrices[bond.id] ?? null)
  );
}
