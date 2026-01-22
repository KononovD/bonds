import { IsString, IsNumber, IsArray, ValidateNested, IsOptional, IsBoolean, IsDateString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentDto {
  @IsString()
  @IsOptional() // Generated on backend if missing
  id?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(['coupon', 'redemption'])
  type: 'coupon' | 'redemption';

  @IsBoolean()
  received: boolean;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateBondDto {
  @IsString()
  name: string;

  @IsString()
  currency: string;

  @IsNumber()
  @Min(0)
  faceValue: number;

  @IsNumber()
  couponRateAnnual: number;

  @IsNumber()
  couponFrequencyPerYear: number;

  @IsDateString()
  maturityDate: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  @IsOptional()
  payments?: PaymentDto[];
}

export class UpdateBondDto extends CreateBondDto {}
