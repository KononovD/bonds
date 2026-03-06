import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBonds, getPurchases } from '../api/client';
import { Bond, Purchase } from '../types';
import { Card, Title, Table, Th, Td, PageTransition } from '../components/styled';
import { formatDate } from '../utils/date';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';

const BondLink = styled(Link)`
  color: #2563eb;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

interface HistoryItem {
  date: string;
  bondName: string;
  bondId: string;
  type: 'coupon' | 'redemption';
  amount: number;
}

export default function PaymentHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    Promise.all([getBonds(), getPurchases()]).then(([bonds, purchases]) => {
      // Calculate quantity per bond
      const bondQuantities = purchases.reduce((acc, p) => {
        acc[p.bondId] = (acc[p.bondId] || 0) + p.quantity;
        return acc;
      }, {} as Record<string, number>);

      const allHistory: HistoryItem[] = [];

      bonds.forEach(bond => {
        bond.payments.forEach(payment => {
          if (payment.received) {
            const quantity = bondQuantities[bond.id] || 0;
            // Only show history if we currently own the bond? 
            // Or show it anyway but with quantity adjustment?
            // Assuming "Received" means user marked it, so they likely owned it.
            // Using current quantity as approximation.
            const totalAmount = quantity > 0 
                ? new BigNumber(payment.amount).multipliedBy(quantity).dividedBy(100).toNumber()
                : new BigNumber(payment.amount).dividedBy(100).toNumber();

            allHistory.push({
              date: payment.date,
              bondName: bond.name,
              bondId: bond.id,
              type: payment.type,
              amount: totalAmount
            });
          }
        });
      });

      // Sort by date descending (newest first)
      allHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistory(allHistory);
    });
  }, []);

  return (
    <PageTransition>
      <Card>
        <Title>История полученных выплат</Title>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <Th>Дата</Th>
                <Th>Облигация</Th>
                <Th>Тип</Th>
                <Th>Сумма</Th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><Td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>История пуста</Td></tr>
              ) : history.map((item, i) => (
                <tr key={i}>
                  <Td>{formatDate(item.date)}</Td>
                  <Td>
                    <BondLink to={`/bonds/${item.bondId}`}>{item.bondName}</BondLink>
                  </Td>
                  <Td>{item.type === 'coupon' ? 'Купон' : 'Погашение'}</Td>
                  <Td style={{ color: '#10b981', fontWeight: 600 }}>+{item.amount.toFixed(2)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </PageTransition>
  );
}
