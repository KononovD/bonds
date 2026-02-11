import { useEffect, useState } from 'react';
import { getBonds, getPurchases } from '../api/client';
import { Bond, Purchase } from '../types';
import { Card, Title, Table, Th, Td, PageTransition } from '../components/styled';
import { formatDate } from '../utils/date';
import styled from 'styled-components';

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-top: 10px;
`;

const PaymentRow = styled.tr<{ $isInactive?: boolean }>`
  color: ${props => props.$isInactive ? '#9ca3af' : 'inherit'};
  
  ${Td} {
     color: ${props => props.$isInactive ? '#9ca3af' : 'inherit'};
  }
`;

export default function Dashboard() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    Promise.all([getBonds(), getPurchases()]).then(([b, p]) => {
      setBonds(b);
      setPurchases(p);
    });
  }, []);

  const totalInvested = purchases.reduce((sum, p) => sum + (p.quantity * p.pricePerBond + p.commission), 0) / 100;

  // Calculate total quantity for each bond in portfolio
  const bondQuantities = purchases.reduce((acc, p) => {
    acc[p.bondId] = (acc[p.bondId] || 0) + p.quantity;
    return acc;
  }, {} as Record<string, number>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPayments = bonds.flatMap(b => {
    const quantity = bondQuantities[b.id] || 0;
    return b.payments.map(p => ({ 
      ...p, 
      bondName: b.name, 
      bondId: b.id,
      quantity,
      hasInPortfolio: quantity > 0,
      // Total amount for all bonds in portfolio, or just for 1 if not in portfolio (for reference)
      totalAmount: quantity > 0 ? p.amount * quantity : p.amount
    }));
  });
  
  // Received income should also account for quantity at the time of payment?
  // Since we don't have historical quantity, we use current quantity as an approximation
  // or assume p.amount in data.json was already total? (No, usually it's per bond).
  // For simplicity and based on user request, we use quantity-adjusted amounts.
  const receivedIncome = allPayments.filter(p => p.received).reduce((sum, p) => sum + p.totalAmount, 0) / 100;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingPayments = allPayments
    .filter(p => !p.received && new Date(p.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const getDaysUntil = (dateStr: string) => {
    const paymentDate = new Date(dateStr);
    paymentDate.setHours(0, 0, 0, 0);
    const diffTime = paymentDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <PageTransition>
      <StatGrid>
        <Card>
          <Title>Вложено</Title>
          <StatValue>{totalInvested.toFixed(2)}</StatValue>
        </Card>
        <Card>
          <Title>Полученный доход</Title>
          <StatValue>{receivedIncome.toFixed(2)}</StatValue>
        </Card>
      </StatGrid>

      <Card>
        <Title>Ближайшие выплаты</Title>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <Th>Дата</Th>
                <Th>Дней</Th>
                <Th>Облигация</Th>
                <Th>Тип</Th>
                <Th>Сумма</Th>
              </tr>
            </thead>
            <tbody>
              {upcomingPayments.length === 0 ? (
                <tr><Td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Нет предстоящих выплат</Td></tr>
              ) : upcomingPayments.map((p, i) => (
                <PaymentRow key={i} $isInactive={!p.hasInPortfolio}>
                  <Td>{formatDate(p.date)}</Td>
                  <Td>{getDaysUntil(p.date)}</Td>
                  <Td>{p.bondName} {p.hasInPortfolio ? `(${p.quantity} шт.)` : ''}</Td>
                  <Td>{p.type === 'coupon' ? 'Купон' : 'Погашение'}</Td>
                  <Td>{(p.totalAmount / 100).toFixed(2)}</Td>
                </PaymentRow>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </PageTransition>
  );
}