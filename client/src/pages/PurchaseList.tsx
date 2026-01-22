import { useEffect, useState } from 'react';
import { getPurchases, getBonds, deletePurchase } from '../api/client';
import { Purchase } from '../types';
import { Link } from 'react-router-dom';
import { Card, Table, Th, Td, Button, Title, PageTransition } from '../components/styled';

export default function PurchaseList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bonds, setBonds] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [p, b] = await Promise.all([getPurchases(), getBonds()]);
    
    const sortedPurchases = [...p].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setPurchases(sortedPurchases);
    const bondMap: Record<string, string> = {};
    b.forEach(bond => bondMap[bond.id] = bond.name);
    setBonds(bondMap);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены?')) {
      await deletePurchase(id);
      loadData();
    }
  };

  return (
    <PageTransition>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title style={{ margin: 0 }}>Покупки</Title>
          <Link to="/purchases/new">
            <Button $variant="primary">Добавить покупку</Button>
          </Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <Th>Дата</Th>
                <Th>Облигация</Th>
                <Th>Кол-во</Th>
                <Th>Цена</Th>
                <Th>Комиссия</Th>
                <Th>Всего</Th>
                <Th>Действия</Th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr><Td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Список покупок пуст</Td></tr>
              ) : purchases.map(p => (
                <tr key={p.id}>
                  <Td>{p.date}</Td>
                  <Td>{bonds[p.bondId] || p.bondId}</Td>
                  <Td>{p.quantity}</Td>
                  <Td>{(p.pricePerBond / 100).toFixed(2)}</Td>
                  <Td>{(p.commission / 100).toFixed(2)}</Td>
                  <Td>{((p.quantity * p.pricePerBond + p.commission) / 100).toFixed(2)}</Td>
                  <Td>
                    <Link to={`/purchases/${p.id}/edit`}>
                      <Button $variant="secondary">Ред.</Button>
                    </Link>
                    <Button $variant="danger" onClick={() => handleDelete(p.id)}>Удалить</Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </PageTransition>
  );
}