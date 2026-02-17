import { Bond, Purchase } from '../types';

/**
 * Агрегирует количество выплат портфеля по месяцам.
 * В портфель попадают облигации, по которым есть покупки (quantity > 0).
 */
export function buildPortfolioPaymentsByMonth(
  bonds: Bond[],
  purchases: Purchase[],
  fromDate: Date = new Date()
): Record<string, number> {
  const quantitiesByBond = purchases.reduce((acc, p) => {
    acc[p.bondId] = (acc[p.bondId] || 0) + p.quantity;
    return acc;
  }, {} as Record<string, number>);

  const byMonth: Record<string, number> = {};
  bonds.forEach(bond => {
    const qty = quantitiesByBond[bond.id] || 0;
    if (qty <= 0) return;

    bond.payments.forEach(payment => {
      const date = new Date(payment.date);
      if (date < fromDate) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
  });

  return byMonth;
}
