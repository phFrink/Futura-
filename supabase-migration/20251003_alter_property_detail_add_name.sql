-- Add property_name column to property_detail_tbl
ALTER TABLE property_detail_tbl
ADD COLUMN property_name VARCHAR(50) NOT NULL DEFAULT 'Unnamed Property';

-- Remove the default after adding the column (for future inserts to require the name)
ALTER TABLE property_detail_tbl
ALTER COLUMN property_name DROP DEFAULT;

-- Create index on property_name for faster searches
CREATE INDEX idx_property_name ON property_detail_tbl(property_name);

-- Add unique constraint to prevent duplicate property names
ALTER TABLE property_detail_tbl
ADD CONSTRAINT unique_property_name UNIQUE (property_name);
