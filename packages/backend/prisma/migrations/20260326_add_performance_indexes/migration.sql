-- Add performance indexes for faster queries

-- Product indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS "products_is_published_category_id_idx" ON "products"("is_published", "category_id");
CREATE INDEX IF NOT EXISTS "products_is_published_created_at_idx" ON "products"("is_published", "created_at");

-- Media indexes for faster image loading
CREATE INDEX IF NOT EXISTS "media_is_cover_idx" ON "media"("is_cover");
CREATE INDEX IF NOT EXISTS "media_product_id_is_cover_idx" ON "media"("product_id", "is_cover");

-- ProductStyleTag indexes for filtering by style
CREATE INDEX IF NOT EXISTS "product_style_tags_product_id_idx" ON "product_style_tags"("product_id");
CREATE INDEX IF NOT EXISTS "product_style_tags_style_id_idx" ON "product_style_tags"("style_id");

-- ProductSpaceTag indexes for filtering by space
CREATE INDEX IF NOT EXISTS "product_space_tags_product_id_idx" ON "product_space_tags"("product_id");
CREATE INDEX IF NOT EXISTS "product_space_tags_space_id_idx" ON "product_space_tags"("space_id");
