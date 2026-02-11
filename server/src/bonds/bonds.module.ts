import { Module } from '@nestjs/common';
import { BondsService } from './bonds.service';
import { BondsController } from './bonds.controller';
import { BondsCatalogService } from './bonds-catalog.service';

@Module({
  controllers: [BondsController],
  providers: [BondsService, BondsCatalogService],
})
export class BondsModule {}
