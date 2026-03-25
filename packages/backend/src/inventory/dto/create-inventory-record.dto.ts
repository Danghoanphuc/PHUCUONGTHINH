import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsInt,
  IsPositive,
  IsOptional,
} from 'class-validator';

export class CreateInventoryRecordDto {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @IsString()
  @IsIn(['in', 'out', 'adjustment'])
  type: 'in' | 'out' | 'adjustment';

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;
}
