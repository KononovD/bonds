import { Module } from '@nestjs/common';
import { DataModule } from './data/data.module';
import { BondsModule } from './bonds/bonds.module';
import { PurchasesModule } from './purchases/purchases.module';
import { TargetsModule } from './targets/targets.module';

@Module({
  imports: [DataModule, BondsModule, PurchasesModule, TargetsModule],
})
export class AppModule {}
