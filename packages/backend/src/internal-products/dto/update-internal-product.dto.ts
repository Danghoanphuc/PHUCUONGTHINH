import { IsOptional, IsNumber, IsString, IsInt, Min } from 'class-validator';

export class UpdateInternalProductDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_retail?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_wholesale?: number;

  @IsOptional()
  @IsString()
  wholesale_discount_tiers?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_dealer?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_promo?: number;

  @IsOptional()
  @IsString()
  promo_start_date?: string;

  @IsOptional()
  @IsString()
  promo_end_date?: string;

  @IsOptional()
  @IsString()
  promo_note?: string;

  @IsOptional()
  @IsString()
  warehouse_location?: string;

  @IsOptional()
  @IsString()
  stock_status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_quantity?: number;

  @IsOptional()
  @IsString()
  supplier_name?: string;

  @IsOptional()
  @IsString()
  supplier_phone?: string;

  @IsOptional()
  @IsString()
  internal_notes?: string;
}
