import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Bond, Purchase } from '../types';
import { getBondMetrics } from '../utils/bondAnalytics';
import { Card, Input, Table, Td, Th, Title } from './styled';

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
}

export function BondYieldAnalytics({
  bond,
  purchases = [],
  title = 'Аналитика доходности',
}: BondYieldAnalyticsProps) {
  const [comparePrice, setComparePrice] = useState('');

  const comparePriceCents = useMemo(() => {
    const parsed = parseFloat(comparePrice.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    return Math.round(parsed * 100);
  }, [comparePrice]);

  if (!bond) return null;

  const metrics = getBondMetrics(bond, purchases, comparePriceCents);

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
    </Card>
  );
}
