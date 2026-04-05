-- Add index on entity_id alone for faster lookups
CREATE INDEX IF NOT EXISTS "document_tags_entity_id_idx" ON "document_tags"("entity_id");
