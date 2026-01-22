import { IsNumber, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class DistributionDto {
  @IsUUID()
  bondId: string;

  @IsNumber()
  percent: number;
}

export class SetTargetDto {
  @IsNumber()
  year: number;

  @IsNumber()
  month: number;

  @IsNumber()
  amount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DistributionDto)
  distributions: DistributionDto[];
}
