import { Module } from '@nestjs/common';
import { DataModule } from './data/data.module';
import { BondsModule } from './bonds/bonds.module';
import { PurchasesModule } from './purchases/purchases.module';

@Module({
  imports: [DataModule, BondsModule, PurchasesModule],
})
export class AppModule {}
