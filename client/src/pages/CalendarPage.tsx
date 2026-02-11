import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getBonds, getPurchases } from '../api/client';
import { Bond, Purchase } from '../types';
import { Card, Title, PageTransition, Table, Th, Td } from '../components/styled';
import { formatDate, toDateOnlyString } from '../utils/date';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';

const CalendarContainer = styled.div`
  display: flex;
  gap: 30px;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    flex-direction: column;
  }

  .react-calendar {
    width: 100%;
    max-width: 500px;
    background: white;
    border: none;
    border-radius: 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    padding: 20px;
    font-family: inherit;
  }

  .react-calendar__tile {
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 10px;
    border-radius: 12px;
  }

  .react-calendar__tile--now {
    background: #eff6ff;
    color: #3b82f6;
  }

  .react-calendar__tile--active {
    background: #3b82f6 !important;
    color: white !important;
  }

  .react-calendar__navigation button {
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

const EventsList = styled(Card)`
  flex: 1;
  min-width: 300px;
`;

const DotContainer = styled.div`
  display: flex;
  gap: 2px;
  margin-top: 4px;
`;

const Dot = styled.div<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${props => props.$color};
`;

const EmptyState = styled.div`
  text-align: center;
  color: #6b7280;
  padding: 40px;
  font-size: 1.1rem;
`;

interface ExtendedPayment {
  id?: string;
  date: string;
  amount: number;
  type: 'coupon' | 'redemption';
  received: boolean;
  bondName: string;
  bondId: string;
  totalAmount: number;
}

export default function CalendarPage() {
  const [value, onChange] = useState<any>(new Date());
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<ExtendedPayment[]>([]);

  useEffect(() => {
    Promise.all([getBonds(), getPurchases()]).then(([b, p]) => {
      setBonds(b);
      setPurchases(p);
    });
  }, []);

  const getPaymentsForDate = (date: Date) => {
    const dateStr = toDateOnlyString(date);

    // Bond quantities map
    const bondQuantities = purchases.reduce((acc, p) => {
        acc[p.bondId] = (acc[p.bondId] || 0) + p.quantity;
        return acc;
    }, {} as Record<string, number>);

    // Flatten all payments
    const allPayments: ExtendedPayment[] = bonds.flatMap(b => {
      const quantity = bondQuantities[b.id] || 0;
      return b.payments.map(p => ({
        ...p,
        bondName: b.name,
        bondId: b.id,
        // Calculate amount relative to portfolio
        totalAmount: quantity > 0 
            ? new BigNumber(p.amount).multipliedBy(quantity).dividedBy(100).toNumber() 
            : new BigNumber(p.amount).dividedBy(100).toNumber()
      }));
    });

    return allPayments.filter(p => toDateOnlyString(p.date) === dateStr);
  };

  useEffect(() => {
    if (value instanceof Date) {
      setSelectedDateEvents(getPaymentsForDate(value));
    }
  }, [value, bonds, purchases]);

  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const payments = getPaymentsForDate(date);
      if (payments.length > 0) {
        return (
          <DotContainer>
            {payments.slice(0, 3).map((p, i) => (
              <Dot key={i} $color={p.received ? '#10b981' : p.type === 'redemption' ? '#ef4444' : '#3b82f6'} />
            ))}
            {payments.length > 3 && <Dot $color="#9ca3af" />}
          </DotContainer>
        );
      }
    }
    return null;
  };

  return (
    <PageTransition>
      <Title>Календарь выплат</Title>
      <CalendarContainer>
        <div>
            <Calendar 
                onChange={onChange} 
                value={value} 
                tileContent={tileContent}
                locale="ru-RU"
            />
        </div>

        <EventsList>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
            События на {value instanceof Date ? formatDate(value.toISOString()) : ''}
          </h3>
          
          {selectedDateEvents.length === 0 ? (
            <EmptyState>Нет выплат в этот день</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
                <Table>
                <thead>
                    <tr>
                    <Th>Облигация</Th>
                    <Th>Тип</Th>
                    <Th>Статус</Th>
                    <Th>Сумма</Th>
                    </tr>
                </thead>
                <tbody>
                    {selectedDateEvents.map((p, i) => (
                    <tr key={i}>
                        <Td>{p.bondName}</Td>
                        <Td>{p.type === 'coupon' ? 'Купон' : 'Погашение'}</Td>
                        <Td>
                            <span style={{ 
                                padding: '4px 8px', 
                                borderRadius: '6px', 
                                background: p.received ? '#d1fae5' : '#eff6ff',
                                color: p.received ? '#065f46' : '#1e40af',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}>
                                {p.received ? 'Получено' : 'Ожидается'}
                            </span>
                        </Td>
                        <Td style={{ fontWeight: 600 }}>{p.totalAmount.toFixed(2)}</Td>
                    </tr>
                    ))}
                </tbody>
                </Table>
            </div>
          )}
        </EventsList>
      </CalendarContainer>
    </PageTransition>
  );
}
