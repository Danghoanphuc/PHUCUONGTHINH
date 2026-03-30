-- Add new columns to product_internals table
ALTER TABLE product_internals ADD COLUMN price_retail REAL;
ALTER TABLE product_internals ADD COLUMN price_wholesale REAL;
ALTER TABLE product_internals ADD COLUMN wholesale_discount_tiers TEXT;
ALTER TABLE product_internals ADD COLUMN price_dealer REAL;
ALTER TABLE product_internals ADD COLUMN price_promo REAL;
ALTER TABLE product_internals ADD COLUMN promo_start_date TEXT;
ALTER TABLE product_internals ADD COLUMN promo_end_date TEXT;
ALTER TABLE product_internals ADD COLUMN promo_note TEXT;
ALTER TABLE product_internals ADD COLUMN warehouse_location TEXT;
ALTER TABLE product_internals ADD COLUMN stock_status TEXT;
ALTER TABLE product_internals ADD COLUMN stock_quantity INTEGER;
ALTER TABLE product_internals ADD COLUMN supplier_phone TEXT;

-- Rename supplier_contact to match new schema (if needed)
-- Note: SQLite doesn't support RENAME COLUMN directly in older versions
-- You may need to keep supplier_contact or manually migrate data
