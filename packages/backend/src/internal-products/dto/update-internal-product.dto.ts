import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class UpdateInternalProductDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost_price?: number;

  @IsOptional()
  @IsString()
  supplier_name?: string;

  @IsOptional()
  @IsString()
  supplier_contact?: string;

  @IsOptional()
  @IsString()
  internal_notes?: string;
}
