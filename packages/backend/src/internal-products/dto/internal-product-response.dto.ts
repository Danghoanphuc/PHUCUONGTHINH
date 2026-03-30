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
  price_retail: number | null;
  price_wholesale: number | null;
  wholesale_discount_tiers: string | null;
  price_dealer: number | null;
  price_promo: number | null;
  promo_start_date: string | null;
  promo_end_date: string | null;
  promo_note: string | null;
  warehouse_location: string | null;
  stock_status: string | null;
  stock_quantity: number | null;
  supplier_name: string | null;
  supplier_phone: string | null;
  internal_notes: string | null;
  created_at: Date;
  updated_at: Date;
  stock_levels: StockLevelDto[];
}
