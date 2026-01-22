export interface Payment {
  id?: string;
  date: string;
  amount: number;
  type: 'coupon' | 'redemption';
  received: boolean;
  note?: string;
}

export interface Bond {
  id: string;
  name: string;
  currency: string;
  faceValue: number;
  couponRateAnnual: number;
  couponFrequencyPerYear: number;
  maturityDate: string;
  notes?: string;
  payments: Payment[];
}

export interface Purchase {
  id: string;
  bondId: string;
  date: string;
  quantity: number;
  pricePerBond: number;
  commission: number;
}
