import { Module } from '@nestjs/common';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';
import { DataModule } from '../data/data.module';

@Module({
  imports: [DataModule],
  controllers: [TargetsController],
  providers: [TargetsService],
})
export class TargetsModule {}
