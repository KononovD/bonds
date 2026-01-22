import { IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class CreatePurchaseDto {
  @IsString()
  bondId: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  pricePerBond: number;

  @IsNumber()
  @Min(0)
  commission: number;
}

export class UpdatePurchaseDto extends CreatePurchaseDto {}
