import { Injectable, NotFoundException } from '@nestjs/common';
import { DataService, Purchase } from '../data/data.service';
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto/purchase.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PurchasesService {
  constructor(private readonly dataService: DataService) {}

  findAll() {
    return this.dataService.purchases;
  }

  findOne(id: string) {
    const purchase = this.dataService.purchases.find(p => p.id === id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async create(createPurchaseDto: CreatePurchaseDto) {
    // Validate bond exists? 
    const bond = this.dataService.bonds.find(b => b.id === createPurchaseDto.bondId);
    if (!bond) throw new NotFoundException('Bond not found');

    const newPurchase: Purchase = {
      id: uuidv4(),
      ...createPurchaseDto
    };
    const purchases = [...this.dataService.purchases, newPurchase];
    await this.dataService.updatePurchases(purchases);
    return newPurchase;
  }

  async update(id: string, updatePurchaseDto: UpdatePurchaseDto) {
    const purchases = this.dataService.purchases;
    const index = purchases.findIndex(p => p.id === id);
    if (index === -1) throw new NotFoundException('Purchase not found');

    const updatedPurchase: Purchase = {
      ...purchases[index],
      ...updatePurchaseDto
    };

    purchases[index] = updatedPurchase;
    await this.dataService.updatePurchases(purchases);
    return updatedPurchase;
  }

  async remove(id: string) {
    const purchases = this.dataService.purchases.filter(p => p.id !== id);
    if (purchases.length === this.dataService.purchases.length) throw new NotFoundException('Purchase not found');
    
    await this.dataService.updatePurchases(purchases);
    return { deleted: true };
  }
}
