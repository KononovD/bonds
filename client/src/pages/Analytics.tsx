import { useEffect, useState } from 'react';
import { getBonds, getPurchases } from '../api/client';
import { Bond, Purchase } from '../types';
import { getAllBondMetrics } from '../utils/bondAnalytics';
import { Card, Title, Table, Th, Td, Input, Label, PageTransition } from '../components/styled';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import styled from 'styled-components';

const Section = styled(Card)`
  margin-bottom: 30px;
`;

const ChartWrap = styled.div`
  width: 100%;
  height: 360px;
  margin-top: 20px;
`;

const CompareInput = styled(Input)`
  max-width: 120px;
  margin-bottom: 0;
`;

const Hint = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 8px;
  margin-bottom: 20px;
`;

const YieldGood = styled.span<{ $value: number }>`
  color: ${p => (p.$value >= 0 ? '#059669' : '#dc2626')};
  font-weight: 600;
`;

const HowToBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
`;

const HowToTitle = styled.strong`
  display: block;
  color: #1e40af;
  font-size: 0.95rem;
  margin-bottom: 8px;
`;

const HowToSteps = styled.ol`
  margin: 0;
  padding-left: 20px;
  color: #1e3a8a;
  font-size: 0.9rem;
  line-height: 1.6;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  margin-bottom: 16px;
`;

const FilterLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  margin-right: 8px;
`;

const FilterCheckbox = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
  user-select: none;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #3b82f6;
  }
`;

const FilterButtons = styled.span`
  display: inline-flex;
  gap: 8px;
  margin-left: 8px;
`;

const FilterButton = styled.button`
  font-size: 0.8rem;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #4b5563;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatPercent(decimal: number): string {
  return (decimal * 100).toFixed(2) + '%';
}

export default function Analytics() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  /** Цена для сравнения по bondId (в копейках), ввод пользователя в «гривнах» — храним как копейки */
  const [comparePrices, setComparePrices] = useState<Record<string, string>>({});
  /** Выбранные облигации для графика выплат (null = ещё не инициализировано) */
  const [selectedBondIdsForChart, setSelectedBondIdsForChart] = useState<Set<string> | null>(null);

  useEffect(() => {
    Promise.all([getBonds(), getPurchases()]).then(([b, p]) => {
      setBonds(b);
      setPurchases(p);
    });
  }, []);

  // Список облигаций в портфеле (есть покупки)
  const bondQuantities = purchases.reduce((acc, p) => {
    acc[p.bondId] = (acc[p.bondId] || 0) + p.quantity;
    return acc;
  }, {} as Record<string, number>);

  const bondsInPortfolio = bonds.filter(b => (bondQuantities[b.id] || 0) > 0);

  // По умолчанию в графике участвуют все облигации из портфеля
  useEffect(() => {
    if (bondsInPortfolio.length === 0 || selectedBondIdsForChart !== null) return;
    setSelectedBondIdsForChart(new Set(bondsInPortfolio.map(b => b.id)));
  }, [bonds.length, purchases.length]);

  const toggleBondInChart = (bondId: string) => {
    setSelectedBondIdsForChart(prev => {
      const next = new Set(prev ?? bondsInPortfolio.map(b => b.id));
      if (next.has(bondId)) next.delete(bondId);
      else next.add(bondId);
      return next;
    });
  };

  const selectAllBondsInChart = () => {
    setSelectedBondIdsForChart(new Set(bondsInPortfolio.map(b => b.id)));
  };

  const deselectAllBondsInChart = () => {
    setSelectedBondIdsForChart(new Set());
  };

  const chartSelectedIds = selectedBondIdsForChart ?? new Set(bondsInPortfolio.map(b => b.id));
  const bondsForCashFlow =
    chartSelectedIds.size === 0
      ? []
      : bondsInPortfolio.filter(b => chartSelectedIds.has(b.id));

  const updateComparePrice = (bondId: string, value: string) => {
    setComparePrices(prev => ({ ...prev, [bondId]: value }));
  };

  const comparePricesCents: Record<string, number> = {};
  Object.entries(comparePrices).forEach(([id, str]) => {
    const num = parseFloat(str.replace(',', '.'));
    if (!Number.isNaN(num) && num > 0) comparePricesCents[id] = Math.round(num * 100);
  });

  const metrics = getAllBondMetrics(bonds, purchases, comparePricesCents);

  const chartData = metrics.map(m => {
    const yieldDisplay = m.effectiveYieldAnnual ?? m.yieldAtPrice ?? m.couponRateAnnual;
    return {
      name: m.bondName.length > 18 ? m.bondName.slice(0, 18) + '…' : m.bondName,
      fullName: m.bondName,
      yieldPct: yieldDisplay * 100,
      couponPct: m.couponRateAnnual * 100,
      effectivePct: m.effectiveYieldAnnual != null ? m.effectiveYieldAnnual * 100 : null,
      atPricePct: m.yieldAtPrice != null ? m.yieldAtPrice * 100 : null,
    };
  });

  // Ожидаемые выплаты по месяцам (только выбранные облигации из портфеля, только будущие)
  const now = new Date();
  const paymentsByMonth: Record<string, number> = {};
  const monthsSet = new Set<string>();

  bondsForCashFlow.forEach(bond => {
    const qty = bondQuantities[bond.id] || 0;
    bond.payments.forEach(p => {
      const date = new Date(p.date);
      if (date < now) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(key);
      paymentsByMonth[key] = (paymentsByMonth[key] || 0) + p.amount * qty;
    });
  });

  const cashFlowData = Array.from(monthsSet)
    .sort()
    .slice(0, 24)
    .map(key => ({
      month: key,
      display: key.slice(0, 7),
      sum: (paymentsByMonth[key] || 0) / 100,
    }));

  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <PageTransition>
      <Section>
        <Title>Аналитика облигаций</Title>

        <HowToBox>
          <HowToTitle>Как оценить новую облигацию с рынка</HowToTitle>
          <HowToSteps>
            <li>Добавьте облигацию в разделе <strong>Облигации</strong> — укажите номинал, купонную ставку, дату погашения и график выплат (купоны и погашение). Покупку оформлять не нужно.</li>
            <li>Здесь в таблице найдите эту облигацию и в колонке <strong>«Цена для сравнения»</strong> введите текущую рыночную цену за одну штуку (в гривнах).</li>
            <li>В колонке <strong>«Доходность при цене»</strong> появится расчётная доходность к погашению в % годовых — так вы поймёте, выгодно ли покупать по этой цене.</li>
            <li>Сравните с другими бумагами: у уже купленных облигаций смотрите <strong>«Доходность (факт.)»</strong>, у новых — вводите их цены и сравнивайте значения в «Доходность при цене».</li>
          </HowToSteps>
        </HowToBox>

        <Hint>
          Если по облигации есть покупки — показывается эффективная доходность к погашению. Для облигаций без покупок введите цену в «Цена для сравнения», чтобы увидеть доходность.
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
              {metrics.length === 0 ? (
                <tr>
                  <Td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                    Нет облигаций. Добавьте облигации в разделе «Облигации».
                  </Td>
                </tr>
              ) : (
                metrics.map(m => (
                  <tr key={m.bondId}>
                    <Td style={{ fontWeight: 600 }}>{m.bondName}</Td>
                    <Td>{formatPercent(m.couponRateAnnual)}</Td>
                    <Td>{m.paymentCount}</Td>
                    <Td>{formatMoney(m.totalCoupons)}</Td>
                    <Td>{formatMoney(m.redemption)}</Td>
                    <Td>
                      {m.avgPurchasePrice != null
                        ? formatMoney(m.avgPurchasePrice)
                        : '—'}
                    </Td>
                    <Td>
                      {m.effectiveYieldAnnual != null ? (
                        <YieldGood $value={m.effectiveYieldAnnual}>
                          {formatPercent(m.effectiveYieldAnnual)}
                        </YieldGood>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td>
                      <CompareInput
                        type="text"
                        inputMode="decimal"
                        placeholder="цена"
                        value={comparePrices[m.bondId] ?? ''}
                        onChange={e => updateComparePrice(m.bondId, e.target.value)}
                      />
                    </Td>
                    <Td>
                      {m.yieldAtPrice != null ? (
                        <YieldGood $value={m.yieldAtPrice}>
                          {formatPercent(m.yieldAtPrice)}
                        </YieldGood>
                      ) : (
                        '—'
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Section>

      {chartData.length > 0 && (
        <Section>
          <Title>Сравнение доходности</Title>
          <Hint>
            Столбцы: купонная ставка и/или рассчитанная доходность к погашению (если есть покупки или
            указана цена для сравнения).
          </Hint>
          <ChartWrap>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={v => `${v}%`}
                  label={{ value: 'Доходность %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    value != null ? [`${value.toFixed(2)}%`, 'Доходность'] : null
                  }
                  labelFormatter={label => {
                    const row = chartData.find(d => d.name === label || d.fullName === label);
                    return row?.fullName ?? label;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="yieldPct"
                  name="Доходность (купон или к погашению)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartWrap>
        </Section>
      )}

      {bondsInPortfolio.length > 0 && (
        <Section>
          <Title>Ожидаемые выплаты по месяцам</Title>
          <Hint>
            Столбец показывается только в те месяцы, когда по выбранным облигациям реально приходит
            выплата (купон или погашение). В остальные месяцы выплат нет — на графике они не отображаются.
          </Hint>

          <FilterRow>
            <FilterLabel>Показать в графике:</FilterLabel>
            {bondsInPortfolio.map(bond => (
              <FilterCheckbox key={bond.id}>
                <input
                  type="checkbox"
                  checked={chartSelectedIds.has(bond.id)}
                  onChange={() => toggleBondInChart(bond.id)}
                />
                {bond.name}
              </FilterCheckbox>
            ))}
            <FilterButtons>
              <FilterButton type="button" onClick={selectAllBondsInChart}>
                Выбрать все
              </FilterButton>
              <FilterButton type="button" onClick={deselectAllBondsInChart}>
                Снять все
              </FilterButton>
            </FilterButtons>
          </FilterRow>

          {cashFlowData.length > 0 ? (
          <ChartWrap>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cashFlowData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="display"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  label={{ value: 'Месяц выплаты', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  tickFormatter={v => `${v}`}
                  label={{
                    value: 'Сумма',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    value != null ? [value.toFixed(2), 'Выплата'] : null
                  }
                  labelFormatter={label => `Месяц: ${label}`}
                />
                <Bar
                  dataKey="sum"
                  name="Выплата"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrap>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: 16 }}>
              {chartSelectedIds.size === 0
                ? 'Выберите облигации для отображения в графике.'
                : 'По выбранным облигациям нет будущих выплат в ближайшие 24 месяца.'}
            </p>
          )}
        </Section>
      )}
    </PageTransition>
  );
}
