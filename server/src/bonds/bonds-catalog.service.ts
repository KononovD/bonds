import { Injectable } from '@nestjs/common';

const NBU_DEPO_SECURITIES_URL = 'https://bank.gov.ua/depo_securities?json';

interface NBUSecurity {
  cpcode: string;
  nominal: number;
  auk_proc: number;
  pgs_date: string;
  razm_date: string;
  val_code: string;
  pay_period: number;
  payments?: Array<{ pay_date: string; pay_type: string; pay_val: number }>;
}

export interface CatalogBond {
  isin: string;
  bondNumber: string; // короткий номер для поиска (238281)
  name: string;
  currency: string;
  faceValue: number;
  couponRateAnnual: number;
  maturityDate: string;
  issueDate?: string;
  payments: { date: string; amount: number; type: 'coupon' | 'redemption' }[];
}

@Injectable()
export class BondsCatalogService {
  async getCatalog(): Promise<CatalogBond[]> {
    const res = await fetch(NBU_DEPO_SECURITIES_URL);
    if (!res.ok) {
      throw new Error(`NBU API error: ${res.status} ${res.statusText}`);
    }
    const data: NBUSecurity[] = await res.json();
    if (!Array.isArray(data)) return [];

    const now = new Date();
    return data
      .filter((s) => s.val_code === 'UAH')
      .filter((s) => new Date(s.pgs_date) > now)
      .map((s) => this.mapToCatalogBond(s));
  }

  private mapToCatalogBond(s: NBUSecurity): CatalogBond {
    const bondNumber = s.cpcode?.replace(/^UA4000/, '') ?? s.cpcode;
    const nominal = s.nominal ?? 1000;

    const payments = (s.payments ?? [])
      .sort((a, b) => new Date(a.pay_date).getTime() - new Date(b.pay_date).getTime())
      .map((p) => ({
        date: p.pay_date,
        amount: p.pay_val,
        type: (p.pay_type === '2' ? 'redemption' : 'coupon') as 'coupon' | 'redemption',
      }));

    return {
      isin: s.cpcode,
      bondNumber,
      name: `${bondNumber} ${(s.auk_proc ?? 0).toFixed(1)}%`,
      currency: 'UAH',
      faceValue: nominal,
      couponRateAnnual: s.auk_proc ?? 0,
      maturityDate: s.pgs_date,
      issueDate: s.razm_date,
      payments,
    };
  }
}
