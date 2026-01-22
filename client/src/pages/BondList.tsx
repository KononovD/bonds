import { useEffect, useState } from 'react';
import { getBonds, deleteBond } from '../api/client';
import { Bond } from '../types';
import { Link } from 'react-router-dom';
import { Card, Table, Th, Td, Button, Title, PageTransition } from '../components/styled';

export default function BondList() {
  const [bonds, setBonds] = useState<Bond[]>([]);

  useEffect(() => {
    loadBonds();
  }, []);

  const loadBonds = () => {
    getBonds().then(data => {
      const sortedBonds = [...data].sort((a, b) => a.couponRateAnnual - b.couponRateAnnual);
      setBonds(sortedBonds);
    });
  };

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
          <Link to="/bonds/new" style={{ textDecoration: 'none' }}>
            <Button $variant="primary">Добавить облигацию</Button>
          </Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <Th>Название</Th>
                <Th>Валюта</Th>
                <Th>Номинал</Th>
                <Th>Купон</Th>
                <Th>Выплат</Th>
                <Th>Погашение</Th>
                <Th>Действия</Th>
              </tr>
            </thead>
            <tbody>
              {bonds.length === 0 ? (
                <tr><Td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Список облигаций пуст</Td></tr>
              ) : bonds.map(bond => {
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
                    <Td>{couponAmount}</Td>
                    <Td>{bond.payments.length}</Td>
                    <Td>{bond.maturityDate}</Td>
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