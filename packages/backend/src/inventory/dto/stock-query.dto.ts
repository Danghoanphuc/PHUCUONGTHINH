import { IsOptional, IsString } from 'class-validator';

export class StockQueryDto {
  @IsOptional()
  @IsString()
  warehouse_id?: string;
}
