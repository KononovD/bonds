import axios from 'axios';
import { Bond, Purchase } from '../types';

const api = axios.create({
  baseURL: '/api'
});

export const getBonds = () => api.get<Bond[]>('/bonds').then(res => res.data);
export const getBond = (id: string) => api.get<Bond>(`/bonds/${id}`).then(res => res.data);
export const createBond = (bond: Partial<Bond>) => api.post<Bond>('/bonds', bond).then(res => res.data);
export const updateBond = (id: string, bond: Partial<Bond>) => api.put<Bond>(`/bonds/${id}`, bond).then(res => res.data);
export const deleteBond = (id: string) => api.delete(`/bonds/${id}`).then(res => res.data);

export const getPurchases = () => api.get<Purchase[]>('/purchases').then(res => res.data);
export const createPurchase = (purchase: Partial<Purchase>) => api.post<Purchase>('/purchases', purchase).then(res => res.data);
export const updatePurchase = (id: string, purchase: Partial<Purchase>) => api.put<Purchase>(`/purchases/${id}`, purchase).then(res => res.data);
export const deletePurchase = (id: string) => api.delete(`/purchases/${id}`).then(res => res.data);
