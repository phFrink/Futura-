-- Alter property_area column from TEXT[] to JSONB
-- This allows storing array of objects like [{name:'bedroom', type:'unit', value:'2'}]

ALTER TABLE property_detail_tbl
ALTER COLUMN property_area TYPE JSONB USING property_area::text::jsonb;

-- Add a comment to document the expected structure
COMMENT ON COLUMN property_detail_tbl.property_area IS 'Array of specification objects with structure: [{name: string, type: string, value: string}]';
