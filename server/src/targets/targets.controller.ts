import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TargetsService } from './targets.service';
import { SetTargetDto } from './dto/target.dto';

@Controller('api/targets')
export class TargetsController {
  constructor(private readonly targetsService: TargetsService) {}

  @Post()
  setTarget(@Body() dto: SetTargetDto) {
    return this.targetsService.setTarget(dto);
  }

  @Get()
  getTarget(@Query('year') year: string, @Query('month') month: string) {
    return this.targetsService.getTarget(parseInt(year), parseInt(month));
  }

  @Get('progress')
  getProgress(@Query('year') year: string, @Query('month') month: string) {
    return this.targetsService.getProgress(parseInt(year), parseInt(month));
  }
}
