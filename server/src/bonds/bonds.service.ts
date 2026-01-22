import { Injectable, NotFoundException } from '@nestjs/common';
import { DataService, Bond, Payment } from '../data/data.service';
import { CreateBondDto, UpdateBondDto } from './dto/bond.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BondsService {
  constructor(private readonly dataService: DataService) {}

  findAll() {
    return this.dataService.bonds;
  }

  findOne(id: string) {
    const bond = this.dataService.bonds.find(b => b.id === id);
    if (!bond) throw new NotFoundException('Bond not found');
    return bond;
  }

  async create(createBondDto: CreateBondDto) {
    const newBond: Bond = {
      id: uuidv4(),
      ...createBondDto,
      payments: createBondDto.payments?.map(p => ({
        ...p,
        id: p.id || uuidv4()
      })) || []
    };
    const bonds = [...this.dataService.bonds, newBond];
    await this.dataService.updateBonds(bonds);
    return newBond;
  }

  async update(id: string, updateBondDto: UpdateBondDto) {
    const bonds = this.dataService.bonds;
    const index = bonds.findIndex(b => b.id === id);
    if (index === -1) throw new NotFoundException('Bond not found');

    const updatedBond: Bond = {
      ...bonds[index],
      ...updateBondDto,
      payments: updateBondDto.payments?.map(p => ({
        ...p,
        id: p.id || uuidv4()
      })) || []
    };

    bonds[index] = updatedBond;
    await this.dataService.updateBonds(bonds);
    return updatedBond;
  }

  async remove(id: string) {
    const bonds = this.dataService.bonds.filter(b => b.id !== id);
    if (bonds.length === this.dataService.bonds.length) throw new NotFoundException('Bond not found');
    
    // Also remove associated purchases? 
    // Usually yes, for referential integrity in a simple app.
    const purchases = this.dataService.purchases.filter(p => p.bondId !== id);
    
    await this.dataService.updateBonds(bonds);
    await this.dataService.updatePurchases(purchases);
    return { deleted: true };
  }
}
