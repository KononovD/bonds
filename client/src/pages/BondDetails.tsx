import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBond, updateBond, getPurchases, getBonds } from '../api/client';
import { Bond, Purchase } from '../types';
import { formatDate } from '../utils/date';
import { Card, Title, Table, Th, Td, Button, PageTransition } from '../components/styled';
import { BondYieldAnalytics } from '../components/BondYieldAnalytics';
import { buildPortfolioPaymentsByMonth } from '../utils/portfolioAnalytics';
import styled from 'styled-components';

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 4px;
`;

const Value = styled.span`
  font-size: 1.125rem;
  font-weight: 500;
  color: #1f2937;
`;

const SaveButtonContainer = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
`;

export default function BondDetails() {
  const { id } = useParams();
  const [bond, setBond] = useState<Bond | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [portfolioPaymentsByMonth, setPortfolioPaymentsByMonth] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    Promise.all([getBonds(), getPurchases()]).then(([allBonds, allPurchases]) => {
      setPurchases(allPurchases);
      setPortfolioPaymentsByMonth(buildPortfolioPaymentsByMonth(allBonds, allPurchases));
    });
  }, []);
  useEffect(() => {
    if (id) getBond(id).then(setBond);
  }, [id]);

  const toggleReceived = (paymentIndex: number) => {
    if (!bond) return;
    const payments = [...bond.payments];
    payments[paymentIndex].received = !payments[paymentIndex].received;
    
    // Update local state only
    setBond({ ...bond, payments });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!bond || !id) return;
    try {
      await updateBond(id, bond);
      setHasChanges(false);
      // Optional: Show success notification
    } catch (error) {
      console.error('Failed to save payments status', error);
      alert('Ошибка при сохранении');
    }
  };

  if (!bond) return <div>Загрузка...</div>;

  const expectedProfitPerBond = bond.payments
    .filter((payment) => payment.type === 'coupon')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <PageTransition>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <Title style={{ margin: 0 }}>{bond.name}</Title>
          <Link to={`/bonds/${bond.id}/edit`}>
            <Button $variant="secondary">Редактировать</Button>
          </Link>
        </div>
        
        <DetailGrid>
          <DetailItem>
            <Label>Валюта</Label>
            <Value>{bond.currency}</Value>
          </DetailItem>
          <DetailItem>
            <Label>Номинал</Label>
            <Value>{(bond.faceValue / 100).toFixed(2)}</Value>
          </DetailItem>
          <DetailItem>
            <Label>Погашение</Label>
            <Value>{formatDate(bond.maturityDate)}</Value>
          </DetailItem>
          <DetailItem>
            <Label>Ставка</Label>
            <Value>{(bond.couponRateAnnual * 100).toFixed(2)}%</Value>
          </DetailItem>
          <DetailItem>
            <Label>Ожидаемая прибыль с 1 облигации</Label>
            <Value>{(expectedProfitPerBond / 100).toFixed(2)} {bond.currency}</Value>
          </DetailItem>
        </DetailGrid>
      </Card>

      <BondYieldAnalytics
        bond={bond}
        purchases={purchases}
        portfolioPaymentsByMonth={portfolioPaymentsByMonth}
      />

      <Card>
        <Title>Выплаты</Title>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <Th>Дата</Th>
                <Th>Тип</Th>
                <Th>Сумма</Th>
                <Th>Получено?</Th>
              </tr>
            </thead>
            <tbody>
              {bond.payments.length === 0 ? (
                <tr><Td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Нет выплат</Td></tr>
              ) : bond.payments.map((p, i) => (
                <tr key={i}>
                  <Td>{formatDate(p.date)}</Td>
                  <Td>{p.type === 'coupon' ? 'Купон' : 'Погашение'}</Td>
                  <Td>{(p.amount / 100).toFixed(2)}</Td>
                  <Td>
                    <input 
                      type="checkbox" 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      checked={p.received} 
                      onChange={() => toggleReceived(i)} 
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        
        {hasChanges && (
          <SaveButtonContainer>
            <Button $variant="primary" onClick={handleSave}>Сохранить изменения</Button>
          </SaveButtonContainer>
        )}
      </Card>
    </PageTransition>
  );
}
