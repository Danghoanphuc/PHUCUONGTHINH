export class StockLevelDto {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  updated_at: Date;
  warehouse?: {
    id: string;
    name: string;
    location: string | null;
    is_active: boolean;
  };
}

export class InternalProductResponseDto {
  id: string;
  product_id: string;
  cost_price: number | null;
  supplier_name: string | null;
  supplier_contact: string | null;
  internal_notes: string | null;
  created_at: Date;
  updated_at: Date;
  stock_levels: StockLevelDto[];
}
