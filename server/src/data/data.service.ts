import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Payment {
  id: string;
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
  faceValue: number; // in cents
  couponRateAnnual: number; // 0.15 for 15%
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
  pricePerBond: number; // in cents
  commission: number; // in cents
}

export interface MonthlyTarget {
  year: number;
  month: number; // 1-12
  amount: number; // in cents
  distributions: {
    bondId: string;
    percent: number; // 0-100
  }[];
}

export interface AppData {
  bonds: Bond[];
  purchases: Purchase[];
  payments?: Payment[];
  monthlyTargets?: MonthlyTarget[];
}

@Injectable()
export class DataService implements OnModuleInit {
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'data.json');
  private data: AppData = { bonds: [], purchases: [], payments: [], monthlyTargets: [] };

  async onModuleInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const fileContent = await fs.readFile(this.dataFilePath, 'utf-8');
      this.data = JSON.parse(fileContent);
      if (!this.data.bonds) this.data.bonds = [];
      if (!this.data.purchases) this.data.purchases = [];
      if (!this.data.payments) this.data.payments = [];
      if (!this.data.monthlyTargets) this.data.monthlyTargets = [];
    } catch (error) {
      console.log('Data file not found or empty, using default empty state.');
      await this.saveData();
    }
  }

  async saveData() {
    await fs.mkdir(path.dirname(this.dataFilePath), { recursive: true });
    const tempPath = this.dataFilePath + '.tmp';
    await fs.writeFile(tempPath, JSON.stringify(this.data, null, 2));
    await fs.rename(tempPath, this.dataFilePath);
  }

  get bonds() { return this.data.bonds; }
  get purchases() { return this.data.purchases; }
  get monthlyTargets() { return this.data.monthlyTargets || []; }

  async updateBonds(bonds: Bond[]) {
    this.data.bonds = bonds;
    await this.saveData();
  }

  async updatePurchases(purchases: Purchase[]) {
    this.data.purchases = purchases;
    await this.saveData();
  }

  async updateMonthlyTargets(targets: MonthlyTarget[]) {
    this.data.monthlyTargets = targets;
    await this.saveData();
  }

  // Generic getter/setter if needed, but specific ones are safer
  getData(): AppData {
    return this.data;
  }

  async updateData(newData: AppData) {
    this.data = newData;
    await this.saveData();
  }
}
