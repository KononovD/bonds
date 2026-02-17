import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Bond, Purchase } from '../types';
import { getBondMetrics } from '../utils/bondAnalytics';
import { Card, Input, Table, Td, Th, Title } from './styled';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const Hint = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 8px;
  margin-bottom: 16px;
`;

const CompareInput = styled(Input)`
  max-width: 140px;
  margin-bottom: 0;
`;

const YieldValue = styled.span<{ $value: number }>`
  color: ${p => (p.$value >= 0 ? '#059669' : '#dc2626')};
  font-weight: 600;
`;

const ChartWrap = styled.div`
  width: 100%;
  height: 320px;
  margin-top: 24px;
`;

function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatPercent(decimal: number): string {
  return (decimal * 100).toFixed(2) + '%';
}

interface BondYieldAnalyticsProps {
  bond: Bond | null;
  purchases?: Purchase[];
  title?: string;
  portfolioPaymentsByMonth?: Record<string, number>;
}

export function BondYieldAnalytics({
  bond,
  purchases = [],
  title = 'Аналитика доходности',
  portfolioPaymentsByMonth = {},
}: BondYieldAnalyticsProps) {
  const [comparePrice, setComparePrice] = useState('');

  const comparePriceCents = useMemo(() => {
    const parsed = parseFloat(comparePrice.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    return Math.round(parsed * 100);
  }, [comparePrice]);

  const metrics = useMemo(() => {
    if (!bond) return null;
    return getBondMetrics(bond, purchases, comparePriceCents);
  }, [bond, purchases, comparePriceCents]);

  const monthData = useMemo(() => {
    if (!bond) return [];
    const paymentsByMonth: Record<string, number> = {};
    bond.payments.forEach(payment => {
      const d = new Date(payment.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      paymentsByMonth[key] = (paymentsByMonth[key] || 0) + 1;
    });

    const portfolioMonthKeys = Object.keys(portfolioPaymentsByMonth);
    const bondMonthKeys = Object.keys(paymentsByMonth);
    const allMonthKeys = [...new Set([...bondMonthKeys, ...portfolioMonthKeys])].sort();
    if (allMonthKeys.length === 0) return [];

    const firstMonth = allMonthKeys[0];
    const lastMonth = allMonthKeys[allMonthKeys.length - 1];
    const [firstYear, firstMon] = firstMonth.split('-').map(Number);
    const [lastYear, lastMon] = lastMonth.split('-').map(Number);
    const startMonth = new Date(firstYear, firstMon - 1, 1);
    const endMonth = new Date(lastYear, lastMon - 1, 1);

    const rows: Array<{ month: string; bondCount: number; portfolioCount: number }> = [];
    const current = new Date(startMonth);
    while (current <= endMonth) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      rows.push({
        month: key,
        bondCount: paymentsByMonth[key] || 0,
        portfolioCount: portfolioPaymentsByMonth[key] || 0,
      });
      current.setMonth(current.getMonth() + 1);
    }
    return rows;
  }, [bond, portfolioPaymentsByMonth]);

  if (!bond || !metrics) return null;

  return (
    <Card>
      <Title>{title}</Title>
      <Hint>
        Введите рыночную цену одной облигации в поле «Цена для сравнения», чтобы увидеть расчётную
        доходность к погашению для этого бонда.
      </Hint>

      <div style={{ overflowX: 'auto' }}>
        <Table>
          <thead>
            <tr>
              <Th>Облигация</Th>
              <Th>Купон %</Th>
              <Th>Выплат</Th>
              <Th>Сумма выплат (1 шт)</Th>
              <Th>Погашение (1 шт)</Th>
              <Th>Цена покупки (средн.)</Th>
              <Th>Доходность (факт.)</Th>
              <Th>Цена для сравнения</Th>
              <Th>Доходность при цене</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td style={{ fontWeight: 600 }}>{metrics.bondName}</Td>
              <Td>{formatPercent(metrics.couponRateAnnual)}</Td>
              <Td>{metrics.paymentCount}</Td>
              <Td>{formatMoney(metrics.totalCoupons)}</Td>
              <Td>{formatMoney(metrics.redemption)}</Td>
              <Td>{metrics.avgPurchasePrice != null ? formatMoney(metrics.avgPurchasePrice) : '—'}</Td>
              <Td>
                {metrics.effectiveYieldAnnual != null ? (
                  <YieldValue $value={metrics.effectiveYieldAnnual}>
                    {formatPercent(metrics.effectiveYieldAnnual)}
                  </YieldValue>
                ) : (
                  '—'
                )}
              </Td>
              <Td>
                <CompareInput
                  type="text"
                  inputMode="decimal"
                  placeholder="цена"
                  value={comparePrice}
                  onChange={e => setComparePrice(e.target.value)}
                />
              </Td>
              <Td>
                {metrics.yieldAtPrice != null ? (
                  <YieldValue $value={metrics.yieldAtPrice}>{formatPercent(metrics.yieldAtPrice)}</YieldValue>
                ) : (
                  '—'
                )}
              </Td>
            </tr>
          </tbody>
        </Table>
      </div>

      {monthData.length > 0 && (
        <>
          <Title style={{ marginTop: 24, marginBottom: 8, fontSize: '1.15rem' }}>
            График выплат по месяцам
          </Title>
          <ChartWrap>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData} margin={{ top: 12, right: 24, left: 16, bottom: 52 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  label={{ value: 'Месяц выплаты', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickFormatter={v => `${v}`}
                  label={{ value: 'Количество выплат', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    value != null ? [String(value), 'Выплат'] : null
                  }
                  labelFormatter={label => `Месяц: ${label}`}
                />
                <Bar
                  dataKey="portfolioCount"
                  name="Портфель (голубой)"
                  fill="#38bdf8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="bondCount"
                  name={`${bond.name} (оранжевый)`}
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrap>
        </>
      )}
    </Card>
  );
}
