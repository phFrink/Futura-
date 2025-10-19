-- Create property_detail_tbl first (referenced by property_info_tbl)
CREATE TABLE property_detail_tbl (
  detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name VARCHAR(50) NOT NULL,
  property_area TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lot_tbl
CREATE TABLE lot_tbl (
  lot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_number VARCHAR(50) NOT NULL,
  is_occupied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create property_info_tbl
CREATE TABLE property_info_tbl (
  property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_title VARCHAR(50) NOT NULL,
  property_photo TEXT,
  property_availability VARCHAR(50),
  amenities TEXT[],
  property_details_id UUID REFERENCES property_detail_tbl(detail_id) ON DELETE SET NULL,
  property_lot_id UUID REFERENCES lot_tbl(lot_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE property_detail_tbl ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_tbl ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_info_tbl ENABLE ROW LEVEL SECURITY;

-- Create indexes for foreign keys
CREATE INDEX idx_property_info_details ON property_info_tbl(property_details_id);
CREATE INDEX idx_lot_number ON lot_tbl(lot_number);

-- Create RLS Policies (adjust based on your authentication needs)
-- Example: Allow authenticated users to read all properties
CREATE POLICY "Allow authenticated users to read property_detail_tbl"
  ON property_detail_tbl
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read lot_tbl"
  ON lot_tbl
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read property_info_tbl"
  ON property_info_tbl
  FOR SELECT
  TO authenticated
  USING (true);

-- Example: Allow authenticated users to insert/update/delete (adjust as needed)
CREATE POLICY "Allow authenticated users to insert property_detail_tbl"
  ON property_detail_tbl
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert lot_tbl"
  ON lot_tbl
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert property_info_tbl"
  ON property_info_tbl
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
