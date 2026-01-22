import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactSelect from 'react-select';
import { getBonds, createPurchase, updatePurchase, getPurchases } from '../api/client';
import { Bond, Purchase } from '../types';
import { Card, Title, Input, Label, FormGroup, Button, PageTransition } from '../components/styled';
import { Modal } from '../components/Modal';
import { NumberInput } from '../components/NumberInput';
import styled from 'styled-components';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormFooter = styled.div`
  margin-top: 30px;
  display: flex;
  gap: 10px;
`;

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    padding: '6px',
    borderRadius: '12px',
    border: state.isFocused ? '2px solid #3b82f6' : '2px solid #e5e7eb',
    background: '#f9fafb',
    boxShadow: 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb'
    }
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#1f2937'
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 100
  })
};

export default function PurchaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [formData, setFormData] = useState<Partial<Purchase>>({
    bondId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: 1,
    pricePerBond: 0,
    commission: 0
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    getBonds().then(setBonds);
    if (id) {
       getPurchases().then(purchases => {
         const p = purchases.find(x => x.id === id);
         if(p) {
             setFormData({
                 ...p,
                 pricePerBond: p.pricePerBond / 100,
                 commission: p.commission / 100
             });
         }
       });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
          ...formData,
          pricePerBond: Math.round((formData.pricePerBond || 0) * 100),
          commission: Math.round((formData.commission || 0) * 100)
      };

      if (id) {
        await updatePurchase(id, dataToSend);
      } else {
        await createPurchase(dataToSend);
      }
      navigate('/purchases');
    } catch (err) {
      setModalMessage('Ошибка при сохранении');
      setModalOpen(true);
      console.error(err);
    }
  };
  
  const bondOptions = bonds.map(b => ({ value: b.id, label: b.name }));

  return (
    <PageTransition>
      <Card>
        <Title>{id ? 'Редактировать покупку' : 'Новая покупка'}</Title>
        <form onSubmit={handleSubmit}>
          <Grid>
            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label>Облигация</Label>
              <ReactSelect
                styles={selectStyles}
                value={bondOptions.find(o => o.value === formData.bondId)}
                onChange={(option: any) => setFormData({...formData, bondId: option?.value})}
                options={bondOptions}
                placeholder="Выберите облигацию..."
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Дата</Label>
              <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </FormGroup>
            <FormGroup>
              <Label>Количество</Label>
              <NumberInput 
                value={formData.quantity || 0} 
                onValueChange={val => setFormData({...formData, quantity: val})} 
                required 
              />
            </FormGroup>
            <FormGroup>
              <Label>Цена за шт.</Label>
              <NumberInput 
                value={formData.pricePerBond || 0} 
                onValueChange={val => setFormData({...formData, pricePerBond: val})} 
                required 
              />
            </FormGroup>
            <FormGroup>
              <Label>Комиссия</Label>
              <NumberInput 
                value={formData.commission || 0} 
                onValueChange={val => setFormData({...formData, commission: val})} 
              />
            </FormGroup>
          </Grid>

          <FormFooter>
            <Button type="submit" $variant="primary">Сохранить</Button>
            <Button type="button" onClick={() => navigate('/purchases')}>Отмена</Button>
          </FormFooter>
        </form>
      </Card>
      
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Сообщение">
        {modalMessage}
      </Modal>
    </PageTransition>
  );
}
