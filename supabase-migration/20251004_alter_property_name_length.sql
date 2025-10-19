-- Increase property_name length from VARCHAR(50) to VARCHAR(255)
-- This allows longer property type names

ALTER TABLE property_detail_tbl
ALTER COLUMN property_name TYPE VARCHAR(255);

-- Add a comment
COMMENT ON COLUMN property_detail_tbl.property_name IS 'Property type name (max 255 characters)';
