import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import ReactSelect from 'react-select';
import { getBonds, getPurchases, getTarget, getTargetProgress, saveTarget } from '../api/client';
import { Bond, TargetProgress, Distribution, Purchase } from '../types';
import { NumberInput } from '../components/NumberInput';

const Container = styled.div`
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin: 0;
`;

const MonthNavigator = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NavButton = styled.button`
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const Section = styled.div`
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: 500;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #0056b3;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #6b7280;

  &:hover {
    background-color: #4b5563;
  }
`;

const BuyButton = styled.button`
  padding: 6px 12px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #218838;
  }
`;

const BondRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
`;

const BondName = styled.span`
  flex: 1;
`;

const BondLink = styled(Link)`
  color: #2563eb;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

// PercentInput removed, using NumberInput with style

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  
  th, td {
    padding: 10px;
    border-bottom: 1px solid #eee;
    text-align: left;
  }
  
  th {
    font-weight: 600;
    color: #555;
  }
`;

const ProgressBar = styled.div<{ percent: number }>`
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 5px;

  &::after {
    content: '';
    display: block;
    width: ${props => Math.min(100, props.percent)}%;
    height: 100%;
    background-color: ${props => props.percent >= 100 ? '#4caf50' : '#2196f3'};
    transition: width 0.3s ease;
  }
`;

const MonthlyTargetPage: React.FC = () => {
  const navigate = useNavigate();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [amount, setAmount] = useState<number>(0); // Base target without received income
  const [incomeAmount, setIncomeAmount] = useState<number>(0);
  const [distributions, setDistributions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [carryLoading, setCarryLoading] = useState(false);
  const [progress, setProgress] = useState<TargetProgress | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    try {
      const [bondsData, purchasesData, targetData, progressData] = await Promise.all([
        getBonds(),
        getPurchases(),
        getTarget(year, month).catch(() => null),
        getTargetProgress(year, month)
      ]);
      setBonds(bondsData);
      setPurchases(purchasesData);
      setProgress(progressData);

      const baseAmountCents = targetData?.amount || 0;
      const effectiveAmountCents = progressData.target?.amount || baseAmountCents;
      const receivedIncomeCents = Math.max(0, effectiveAmountCents - baseAmountCents);

      setAmount(baseAmountCents / 100);
      setIncomeAmount(receivedIncomeCents / 100);

      if (targetData) {
        const distMap: Record<string, number> = {};
        targetData.distributions.forEach(d => {
          distMap[d.bondId] = d.percent;
        });
        // Ensure all bonds have entries
        bondsData.forEach(b => {
          if (distMap[b.id] === undefined) distMap[b.id] = 0;
        });
        setDistributions(distMap);
      } else {
        const distMap: Record<string, number> = {};
        bondsData.forEach(b => distMap[b.id] = 0);
        setDistributions(distMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    finally {
      setLoading(false);
    }
  };

  const handleDistributionChange = (bondId: string, value: number) => {
    setDistributions(prev => ({
      ...prev,
      [bondId]: value
    }));
  };

  const handleSave = async () => {
    const distArray: Distribution[] = Object.entries(distributions)
      .filter(([_, percent]) => percent > 0)
      .map(([bondId, percent]) => ({ bondId, percent }));

    try {
      await saveTarget({
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        amount: Math.round(amount * 100),
        distributions: distArray
      });
      fetchData(); // Refresh progress
      alert('Target saved successfully!');
    } catch (error) {
      console.error('Error saving target:', error);
      alert('Failed to save target');
    }
  };

  const handleCarryFromPreviousMonth = async () => {
    setCarryLoading(true);
    const previousMonthDate = new Date(selectedDate);
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

    try {
      const prevYear = previousMonthDate.getFullYear();
      const prevMonth = previousMonthDate.getMonth() + 1;
      const previousTarget = await getTarget(prevYear, prevMonth);

      if (!previousTarget) {
        alert('За прошлый месяц цель не найдена');
        return;
      }

      const currentBondIds = new Set(bonds.map(b => b.id));
      const distributionsToCarry: Distribution[] = previousTarget.distributions
        .filter(d => currentBondIds.has(d.bondId))
        .map(d => ({ bondId: d.bondId, percent: d.percent }));

      await saveTarget({
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        amount: previousTarget.amount,
        distributions: distributionsToCarry
      });

      await fetchData();
      alert('Цель перенесена с прошлого месяца');
    } catch (error) {
      console.error('Error carrying target from previous month:', error);
      alert('Не удалось перенести цель');
    } finally {
      setCarryLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(amount / 100);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const handleMonthSelect = (option: any) => {
      if (option) {
          const [year, month] = option.value.split('-');
          const newDate = new Date();
          newDate.setFullYear(parseInt(year));
          newDate.setMonth(parseInt(month) - 1);
          setSelectedDate(newDate);
      }
  }
  
  const monthOptions = [];
  const startYear = 2026;
  const endYear = new Date().getFullYear() + 1;
  
  for(let y = startYear; y <= endYear; y++) {
      for(let m = 1; m <= 12; m++) {
          monthOptions.push({
              value: `${y}-${m}`,
              label: `${m.toString().padStart(2, '0')}/${y}`
          });
      }
  }

  const currentOption = {
      value: `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}`,
      label: `${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`
  };
  const totalAmount = amount + incomeAmount;

  if (loading && !progress) return <div>Loading...</div>;

  return (
    <Container>
      <HeaderRow>
          <Title>Цель на месяц</Title>
          <MonthNavigator>
              <NavButton onClick={() => changeMonth(-1)}>&lt;</NavButton>
              <div style={{ width: '150px' }}>
                <ReactSelect 
                    value={currentOption}
                    options={monthOptions}
                    onChange={handleMonthSelect}
                    menuPlacement="auto"
                />
              </div>
              <NavButton onClick={() => changeMonth(1)}>&gt;</NavButton>
          </MonthNavigator>
      </HeaderRow>

      <Section>
        <h3>Настройка ({currentOption.label})</h3>
        <FormGroup>
          <Label>
            Общая сумма ({amount.toFixed(2)} таргет + {incomeAmount.toFixed(2)} доход) = {totalAmount.toFixed(2)} UAH
          </Label>
          <NumberInput 
            value={amount} 
            onValueChange={setAmount} 
            placeholder="Введите таргет в грн"
          />
          <small>Вводится базовый таргет, доход от полученных купонов добавляется автоматически</small>
        </FormGroup>

        <Label>Распределение (%)</Label>
        {bonds
          .slice()
          .sort((a, b) => b.couponRateAnnual - a.couponRateAnnual)
          .map(bond => (
          <BondRow key={bond.id}>
            <BondName><BondLink to={`/bonds/${bond.id}`}>{bond.name}</BondLink></BondName>
            <NumberInput 
              value={distributions[bond.id] || 0} 
              onValueChange={(val) => handleDistributionChange(bond.id, val)}
              placeholder="0"
              style={{ width: '80px', padding: '5px' }}
            />
            <span>%</span>
          </BondRow>
        ))}
        <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
            Всего: {Object.values(distributions).reduce((a, b) => a + b, 0).toFixed(1)}%
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
          <Button onClick={handleSave}>Сохранить цель</Button>
          <SecondaryButton onClick={handleCarryFromPreviousMonth} disabled={carryLoading}>
            {carryLoading ? 'Перенос...' : 'Перенести с прошлого месяца'}
          </SecondaryButton>
        </div>
      </Section>

      {progress && (
        <Section>
          <h3>Прогресс</h3>
          <p>Цель: <b>{formatCurrency(progress.target?.amount || 0)}</b></p>
          <p>Потрачено: <b>{formatCurrency(progress.totalSpent)}</b></p>
          <p>Осталось: <b>{formatCurrency((progress.target?.amount || 0) - progress.totalSpent)}</b></p>
          <ProgressBar percent={progress.target ? (progress.totalSpent / progress.target.amount) * 100 : 0} />
          
          <Table>
            <thead>
              <tr>
                <th>Облигация</th>
                <th>%</th>
                <th>Цель</th>
                <th>Потрачено</th>
                <th>Осталось</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {progress.bonds
                .slice()
                .sort((a, b) => {
                    const bondA = bonds.find(bond => bond.id === a.bondId);
                    const bondB = bonds.find(bond => bond.id === b.bondId);
                    const rateA = bondA ? bondA.couponRateAnnual : 0;
                    const rateB = bondB ? bondB.couponRateAnnual : 0;
                    return rateB - rateA;
                })
                .map(bondProgress => (
                <tr key={bondProgress.bondId}>
                  <td>
                    <BondLink to={`/bonds/${bondProgress.bondId}`}>{bondProgress.bondName}</BondLink>
                  </td>
                  <td>{bondProgress.percent}%</td>
                  <td>{formatCurrency(bondProgress.targetAmount)}</td>
                  <td>{formatCurrency(bondProgress.spentAmount)}</td>
                  <td style={{ color: bondProgress.remainingAmount > 0 ? '#d32f2f' : '#388e3c', fontWeight: 'bold' }}>
                    {formatCurrency(bondProgress.remainingAmount)}
                  </td>
                  <td>
                    <BuyButton onClick={() => navigate(`/purchases/new?bondId=${bondProgress.bondId}`)}>
                        Купить
                    </BuyButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Section>
      )}
    </Container>
  );
};

export default MonthlyTargetPage;