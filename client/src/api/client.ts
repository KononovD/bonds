import axios from 'axios';
import { Bond, Purchase, MonthlyTarget, TargetProgress } from '../types';

const api = axios.create({
  baseURL: '/api'
});

export const getBonds = () => api.get<Bond[]>('/bonds').then(res => res.data);

export interface CatalogBond {
  isin: string;
  bondNumber: string;
  name: string;
  currency: string;
  faceValue: number;
  couponRateAnnual: number;
  maturityDate: string;
  issueDate?: string;
  payments: { date: string; amount: number; type: 'coupon' | 'redemption' }[];
}

export const getBondsCatalog = () => api.get<CatalogBond[]>('/bonds/catalog').then(res => res.data);
export const getBond = (id: string) => api.get<Bond>(`/bonds/${id}`).then(res => res.data);
export const createBond = (bond: Partial<Bond>) => api.post<Bond>('/bonds', bond).then(res => res.data);
export const updateBond = (id: string, bond: Partial<Bond>) => api.put<Bond>(`/bonds/${id}`, bond).then(res => res.data);
export const deleteBond = (id: string) => api.delete(`/bonds/${id}`).then(res => res.data);

export const getPurchases = () => api.get<Purchase[]>('/purchases').then(res => res.data);
export const createPurchase = (purchase: Partial<Purchase>) => api.post<Purchase>('/purchases', purchase).then(res => res.data);
export const updatePurchase = (id: string, purchase: Partial<Purchase>) => api.put<Purchase>(`/purchases/${id}`, purchase).then(res => res.data);
export const deletePurchase = (id: string) => api.delete(`/purchases/${id}`).then(res => res.data);

export const getTarget = (year: number, month: number) => api.get<MonthlyTarget>(`/targets?year=${year}&month=${month}`).then(res => res.data);
export const saveTarget = (target: MonthlyTarget) => api.post<MonthlyTarget>('/targets', target).then(res => res.data);
export const getTargetProgress = (year: number, month: number) => api.get<TargetProgress>(`/targets/progress?year=${year}&month=${month}`).then(res => res.data);
