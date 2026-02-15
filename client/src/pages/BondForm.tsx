import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactSelect from 'react-select';
import { getBond, createBond, updateBond, getBondsCatalog, CatalogBond } from '../api/client';
import { Bond, Payment } from '../types';
import { Card, Title, Input, Label, FormGroup, Button, Table, Th, Td, PageTransition } from '../components/styled';
import { Modal } from '../components/Modal';
import { NumberInput } from '../components/NumberInput';
import { BondYieldAnalytics } from '../components/BondYieldAnalytics';
import {
  formatDate,
  toDateTimeLocalValue,
  fromDateTimeLocalToISO,
  ensureDateTime,
} from '../utils/date';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';

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
    padding: '2px',
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

const paymentTypeOptions = [
  { value: 'coupon', label: 'Купон' },
  { value: 'redemption', label: 'Погашение' }
];

export default function BondForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Bond>>({
    name: '',
    currency: 'UAH',
    faceValue: 1000, 
    couponRateAnnual: 5, 
    maturityDate: '',
    notes: '',
    payments: []
  });

  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    date: '',
    amount: 0,
    type: 'coupon',
    received: false
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [catalog, setCatalog] = useState<CatalogBond[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setCatalogLoading(true);
      getBondsCatalog({ onlyActive: true })
        .then(setCatalog)
        .catch(() => setCatalog([]))
        .finally(() => setCatalogLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      getBond(id).then(data => {
          setFormData({
              ...data,
              faceValue: new BigNumber(data.faceValue).dividedBy(100).toNumber(),
              couponRateAnnual: new BigNumber(data.couponRateAnnual).multipliedBy(100).toNumber(),
              maturityDate: ensureDateTime(data.maturityDate),
              payments: data.payments.map(p => ({
                  ...p,
                  date: ensureDateTime(p.date),
                  amount: new BigNumber(p.amount).dividedBy(100).toNumber()
              }))
          });
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert back to backend format using BigNumber
      // couponFrequencyPerYear is calculated as the count of payments
      const dataToSend = {
          ...formData,
          faceValue: new BigNumber(formData.faceValue || 0).multipliedBy(100).toNumber(),
          couponRateAnnual: new BigNumber(formData.couponRateAnnual || 0).dividedBy(100).toNumber(),
          couponFrequencyPerYear: formData.payments?.length || 0,
          payments: formData.payments?.map(p => ({
              ...p,
              amount: new BigNumber(p.amount).multipliedBy(100).toNumber()
          }))
      };

      if (id) {
        await updateBond(id, dataToSend);
      } else {
        await createBond(dataToSend);
      }
      navigate('/bonds');
    } catch (err) {
      setModalMessage('Ошибка при сохранении');
      setModalOpen(true);
      console.error(err);
    }
  };

  const handleAddPayment = () => {
    if (!newPayment.date || !newPayment.amount) return;
    const dateIso = fromDateTimeLocalToISO(newPayment.date) || newPayment.date;
    setFormData(prev => ({
      ...prev,
      payments: [...(prev.payments || []), { ...newPayment, date: dateIso } as Payment].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    }));
    setNewPayment({ date: '', amount: newPayment.amount, type: 'coupon', received: false });
  };

  const removePayment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      payments: prev.payments?.filter((_, i) => i !== index)
    }));
  };
  
  const handlePaymentTypeChange = (option: any) => {
    const type = option.value;
    let amount = newPayment.amount || 0;
    let date = '';
    
    if (type === 'redemption') {
        const faceVal = formData.faceValue || 0;
        const couponVal = formData?.payments?.[0]?.amount || amount;
        amount = new BigNumber(faceVal).plus(couponVal).toNumber();
        date = formData?.maturityDate || '';
      }
    setNewPayment({ ...newPayment, type, amount, date });
  };

  const handleSelectFromCatalog = (option: { value: CatalogBond; label: string } | null) => {
    if (!option?.value) return;
    const b = option.value;
    setFormData({
      name: b.name,
      currency: b.currency,
      faceValue: b.faceValue,
      couponRateAnnual: b.couponRateAnnual,
      maturityDate: b.maturityDate,
      notes: b.isin ? `ISIN: ${b.isin}` : '',
      payments: b.payments.map((p) => ({
        date: p.date,
        amount: p.amount,
        type: p.type,
        received: false,
      })),
    });
  };

  const catalogOptions = catalog.map((b) => ({
    value: b,
    label: `${b.bondNumber} — ${b.name} (${b.isin})`,
  }));

  const analyticsBond = useMemo<Bond | null>(() => {
    if (!formData.name || !formData.currency || !formData.maturityDate) return null;

    const faceValue = Number(formData.faceValue);
    const couponRateAnnualPercent = Number(formData.couponRateAnnual);
    if (!Number.isFinite(faceValue) || faceValue <= 0) return null;
    if (!Number.isFinite(couponRateAnnualPercent) || couponRateAnnualPercent < 0) return null;

    const payments = (formData.payments || [])
      .filter(p => Boolean(p.date) && Number(p.amount) > 0)
      .map(p => ({
        ...p,
        amount: Math.round(Number(p.amount) * 100),
        type: p.type,
        received: Boolean(p.received),
      })) as Payment[];

    if (payments.length === 0) return null;

    return {
      id: id || '__draft__',
      name: formData.name,
      currency: formData.currency,
      faceValue: Math.round(faceValue * 100),
      couponRateAnnual: couponRateAnnualPercent / 100,
      couponFrequencyPerYear: payments.filter(p => p.type === 'coupon').length,
      maturityDate: formData.maturityDate,
      notes: formData.notes,
      payments,
    };
  }, [formData, id]);

  return (
    <PageTransition>
      <Card>
        <Title>{id ? 'Редактировать облигацию' : 'Новая облигация'}</Title>
        <form onSubmit={handleSubmit}>
          {!id && (
            <FormGroup style={{ marginBottom: 24 }}>
              <Label>Выбрать из каталога НБУ</Label>
              <ReactSelect
                styles={selectStyles}
                options={catalogOptions}
                isLoading={catalogLoading}
                isSearchable
                isClearable
                onChange={handleSelectFromCatalog}
                placeholder="Поиск по номеру или ISIN..."
                noOptionsMessage={() => (catalogLoading ? 'Загрузка...' : 'Ничего не найдено')}
              />
            </FormGroup>
          )}
          <Grid>
            <FormGroup>
              <Label>Название</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </FormGroup>
            <FormGroup>
              <Label>Валюта</Label>
              <Input value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} required />
            </FormGroup>
            <FormGroup>
              <Label>Номинал</Label>
              <NumberInput 
                value={formData.faceValue || 0} 
                onValueChange={val => setFormData({...formData, faceValue: val})} 
                required 
              />
            </FormGroup>
            <FormGroup>
              <Label>Купонная ставка (%)</Label>
              <NumberInput 
                value={formData.couponRateAnnual || 0} 
                onValueChange={val => setFormData({...formData, couponRateAnnual: val})} 
                required 
              />
            </FormGroup>
            <FormGroup>
              <Label>Дата и время погашения</Label>
              <Input
                type="datetime-local"
                value={toDateTimeLocalValue(formData.maturityDate || '')}
                onChange={e => setFormData({ ...formData, maturityDate: fromDateTimeLocalToISO(e.target.value) })}
                required
              />
            </FormGroup>
          </Grid>

          <Title style={{ marginTop: '40px', fontSize: '1.25rem' }}>График выплат</Title>
          <Grid style={{ alignItems: 'end', marginBottom: '20px', gridTemplateColumns: '2fr 2fr 2fr 1fr' }}>
            <div>
              <Label>Дата и время</Label>
              <Input
                style={{ marginBottom: 0 }}
                type="datetime-local"
                value={toDateTimeLocalValue(newPayment.date || '')}
                onChange={e => setNewPayment({ ...newPayment, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Сумма</Label>
              <NumberInput 
                style={{ marginBottom: 0 }} 
                value={newPayment.amount || 0} 
                onValueChange={val => setNewPayment({...newPayment, amount: val})} 
              />
            </div>
            <div>
              <Label>Тип</Label>
              <ReactSelect 
                styles={selectStyles}
                value={paymentTypeOptions.find(o => o.value === newPayment.type)}
                onChange={handlePaymentTypeChange}
                options={paymentTypeOptions}
                placeholder="Тип..."
              />
            </div>
            <Button type="button" $variant="secondary" onClick={handleAddPayment} style={{ width: '100%', height: '46px' }}>Добавить</Button>
          </Grid>

          <div style={{ overflowX: 'auto' }}>
            <Table>
              <thead>
                <tr>
                  <Th>Дата</Th>
                  <Th>Сумма</Th>
                  <Th>Тип</Th>
                  <Th>Действие</Th>
                </tr>
              </thead>
              <tbody>
                {formData.payments?.length === 0 ? (
                   <tr><Td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Нет выплат</Td></tr>
                ) : formData.payments?.map((p, i) => (
                  <tr key={i}>
                    <Td>{formatDate(p.date)}</Td>
                    <Td>{p.amount.toFixed(2)}</Td> 
                    <Td>{p.type === 'coupon' ? 'Купон' : 'Погашение'}</Td>
                    <Td><Button type="button" $variant="danger" onClick={() => removePayment(i)}>X</Button></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <FormFooter>
            <Button type="submit" $variant="primary">Сохранить</Button>
            <Button type="button" onClick={() => navigate('/bonds')}>Отмена</Button>
          </FormFooter>
        </form>
      </Card>

      <BondYieldAnalytics
        bond={analyticsBond}
        title="Аналитика доходности (предпросмотр бонда)"
      />
      
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Сообщение">
        {modalMessage}
      </Modal>
    </PageTransition>
  );
}