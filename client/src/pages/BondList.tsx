import { useEffect, useState } from 'react';
import { getBonds, getPurchases, deleteBond } from '../api/client';
import { Bond, Purchase } from '../types';
import { Link } from 'react-router-dom';
import { Card, Table, Th, Td, Button, Title, PageTransition } from '../components/styled';
import { formatDate } from '../utils/date';

export default function BondList() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [nameFilter, setNameFilter] = useState('');

  useEffect(() => {
    loadBonds();
  }, []);

  const loadBonds = () => {
    Promise.all([getBonds(), getPurchases()]).then(([bondsData, purchasesData]) => {
      const sortedBonds = [...bondsData].sort((a, b) => a.couponRateAnnual - b.couponRateAnnual);
      setBonds(sortedBonds);
      setPurchases(purchasesData);
    });
  };

  const purchasedQuantities = purchases.reduce((acc, purchase) => {
    acc[purchase.bondId] = (acc[purchase.bondId] || 0) + purchase.quantity;
    return acc;
  }, {} as Record<string, number>);

  const normalizedFilter = nameFilter.trim().toLowerCase();
  const filteredBonds = normalizedFilter
    ? bonds.filter((bond) => bond.name.toLowerCase().includes(normalizedFilter))
    : bonds;

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены?')) {
      await deleteBond(id);
      loadBonds();
    }
  };

  return (
    <PageTransition>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title style={{ margin: 0 }}>Облигации</Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Фильтр по названию"
              style={{
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                minWidth: '220px'
              }}
            />
            <Link to="/bonds/new" style={{ textDecoration: 'none' }}>
              <Button $variant="primary">Добавить облигацию</Button>
            </Link>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <Th>Название</Th>
                <Th>Валюта</Th>
                <Th>Номинал</Th>
                <Th>Куплено, шт.</Th>
                <Th>Купон</Th>
                <Th>Выплат</Th>
                <Th>Погашение</Th>
                <Th>Действия</Th>
              </tr>
            </thead>
            <tbody>
              {filteredBonds.length === 0 ? (
                <tr><Td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Список облигаций пуст</Td></tr>
              ) : filteredBonds.map(bond => {
                const couponPayment = bond.payments.find(p => p.type === 'coupon');
                const couponAmount = couponPayment ? (couponPayment.amount / 100).toFixed(2) : '-';
                return (
                  <tr key={bond.id}>
                    <Td>
                      <Link to={`/bonds/${bond.id}`} style={{ fontWeight: 600, color: '#3b82f6', textDecoration: 'none' }}>
                        {bond.name}
                      </Link>
                    </Td>
                    <Td>{bond.currency}</Td>
                    <Td>{(bond.faceValue / 100).toFixed(2)}</Td>
                    <Td>{purchasedQuantities[bond.id] || 0}</Td>
                    <Td>{couponAmount}</Td>
                    <Td>{bond.payments.length}</Td>
                    <Td>{formatDate(bond.maturityDate)}</Td>
                    <Td>
                      <Link to={`/bonds/${bond.id}/edit`}>
                        <Button $variant="secondary">Ред.</Button>
                      </Link>
                      <Button $variant="danger" onClick={() => handleDelete(bond.id)}>Удалить</Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card>
    </PageTransition>
  );
}