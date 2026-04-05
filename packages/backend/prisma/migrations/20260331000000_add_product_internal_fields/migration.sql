-- Add missing columns to product_internals table for PostgreSQL
-- This migration adds fields that exist in schema but missing in production

-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add price_retail if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'price_retail'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "price_retail" DOUBLE PRECISION;
    END IF;

    -- Add price_wholesale if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'price_wholesale'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "price_wholesale" DOUBLE PRECISION;
    END IF;

    -- Add wholesale_discount_tiers if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'wholesale_discount_tiers'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "wholesale_discount_tiers" TEXT;
    END IF;

    -- Add price_dealer if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'price_dealer'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "price_dealer" DOUBLE PRECISION;
    END IF;

    -- Add price_promo if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'price_promo'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "price_promo" DOUBLE PRECISION;
    END IF;

    -- Add promo_start_date if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'promo_start_date'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "promo_start_date" TEXT;
    END IF;

    -- Add promo_end_date if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'promo_end_date'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "promo_end_date" TEXT;
    END IF;

    -- Add promo_note if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'promo_note'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "promo_note" TEXT;
    END IF;

    -- Add warehouse_location if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'warehouse_location'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "warehouse_location" TEXT;
    END IF;

    -- Add stock_status if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'stock_status'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "stock_status" TEXT;
    END IF;

    -- Add stock_quantity if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'stock_quantity'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "stock_quantity" INTEGER;
    END IF;

    -- Rename supplier_contact to supplier_phone if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'supplier_contact'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'supplier_phone'
    ) THEN
        ALTER TABLE "product_internals" RENAME COLUMN "supplier_contact" TO "supplier_phone";
    END IF;

    -- Add supplier_phone if not exists and supplier_contact doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'supplier_phone'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_internals' AND column_name = 'supplier_contact'
    ) THEN
        ALTER TABLE "product_internals" ADD COLUMN "supplier_phone" TEXT;
    END IF;

END $$;
