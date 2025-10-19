-- =====================================================
-- CREATE TABLE: homeowner_tbl
-- Purpose: Store homeowner information with property references
-- =====================================================

-- Drop table if exists (uncomment if you want to recreate)
-- DROP TABLE IF EXISTS homeowner_tbl CASCADE;

CREATE TABLE IF NOT EXISTS buyer_home_owner_tbl (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),

    -- Property Information
    unit_number VARCHAR(50) NOT NULL,
    property_id UUID REFERENCES property_info_tbl(property_id) ON DELETE SET NULL,
    monthly_dues NUMERIC(15, 2) DEFAULT 0,
    move_in_date DATE,

    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),

    -- Financial Information
    total_property_price NUMERIC(15, 2) DEFAULT 0,
    down_payment NUMERIC(15, 2) DEFAULT 0,
    interest_rate NUMERIC(5, 4) DEFAULT 0.0500, -- Stored as decimal (e.g., 0.0500 = 5%)
    remaining_balance NUMERIC(15, 2) DEFAULT 0,
    monthly_interest NUMERIC(15, 2) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT homeowner_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT homeowner_phone_check CHECK (phone IS NULL OR LENGTH(phone) >= 10),
    CONSTRAINT homeowner_financial_check CHECK (
        total_property_price >= 0 AND
        down_payment >= 0 AND
        remaining_balance >= 0 AND
        monthly_interest >= 0 AND
        interest_rate >= 0
    )
);

-- =====================================================
-- CREATE INDEXES for better query performance
-- =====================================================

-- Index for email lookups (unique constraint already creates an index)
-- CREATE INDEX idx_homeowner_email ON homeowner_tbl(email);

-- Index for property_id lookups
CREATE INDEX IF NOT EXISTS idx_homeowner_property_id ON homeowner_tbl(property_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_homeowner_status ON homeowner_tbl(status);

-- Index for full_name search (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_homeowner_full_name ON homeowner_tbl(LOWER(full_name));

-- Index for unit_number search
CREATE INDEX IF NOT EXISTS idx_homeowner_unit_number ON homeowner_tbl(unit_number);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_homeowner_status_property ON homeowner_tbl(status, property_id);

-- =====================================================
-- CREATE TRIGGER for updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_homeowner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_homeowner_updated_at ON homeowner_tbl;

CREATE TRIGGER trigger_homeowner_updated_at
    BEFORE UPDATE ON homeowner_tbl
    FOR EACH ROW
    EXECUTE FUNCTION update_homeowner_updated_at();

-- =====================================================
-- CREATE FUNCTION to calculate financial fields
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_homeowner_financials()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate remaining balance if total price and down payment are provided
    IF NEW.total_property_price IS NOT NULL AND NEW.down_payment IS NOT NULL THEN
        NEW.remaining_balance = NEW.total_property_price - NEW.down_payment;
    END IF;

    -- Calculate monthly interest if remaining balance and interest rate are provided
    -- Formula: (remaining_balance * interest_rate * monthly_rate_multiplier) / 12
    -- Note: For now using simple calculation. Adjust monthly_rate_multiplier as needed.
    IF NEW.remaining_balance IS NOT NULL AND NEW.interest_rate IS NOT NULL THEN
        -- Simple monthly interest calculation
        -- You can enhance this with seasonal rates based on current month
        NEW.monthly_interest = (NEW.remaining_balance * NEW.interest_rate) / 12;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_homeowner_financials ON homeowner_tbl;

CREATE TRIGGER trigger_calculate_homeowner_financials
    BEFORE INSERT OR UPDATE ON homeowner_tbl
    FOR EACH ROW
    EXECUTE FUNCTION calculate_homeowner_financials();

-- =====================================================
-- GRANT PERMISSIONS (adjust as needed for your setup)
-- =====================================================

-- Grant permissions to authenticated users
-- GRANT SELECT, INSERT, UPDATE, DELETE ON homeowner_tbl TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE homeowner_tbl_id_seq TO authenticated;

-- Read-only access for anonymous users (if needed)
-- GRANT SELECT ON homeowner_tbl TO anon;

-- =====================================================
-- SAMPLE DATA (optional - uncomment to insert test data)
-- =====================================================

/*
INSERT INTO homeowner_tbl (
    full_name,
    email,
    phone,
    status,
    unit_number,
    property_id,
    monthly_dues,
    move_in_date,
    emergency_contact_name,
    emergency_contact_phone,
    total_property_price,
    down_payment,
    interest_rate
) VALUES
    (
        'John Doe',
        'john.doe@example.com',
        '+63 912 345 6789',
        'active',
        'A101',
        NULL, -- Replace with actual property_id UUID
        5000.00,
        '2024-01-15',
        'Jane Doe',
        '+63 912 345 6788',
        3500000.00,
        700000.00,
        0.0500
    ),
    (
        'Maria Santos',
        'maria.santos@example.com',
        '+63 923 456 7890',
        'active',
        'B205',
        NULL, -- Replace with actual property_id UUID
        4500.00,
        '2024-02-01',
        'Jose Santos',
        '+63 923 456 7891',
        2800000.00,
        560000.00,
        0.0450
    );
*/

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- 1. Get all active homeowners with their property info
/*
SELECT
    h.*,
    p.property_title,
    l.lot_number,
    pd.property_name
FROM homeowner_tbl h
LEFT JOIN property_info_tbl p ON h.property_id = p.property_id
LEFT JOIN lot_tbl l ON p.property_lot_id = l.lot_id
LEFT JOIN property_detail_tbl pd ON p.property_details_id = pd.detail_id
WHERE h.status = 'active'
ORDER BY h.full_name;
*/

-- 2. Get homeowners with outstanding balance
/*
SELECT
    full_name,
    email,
    unit_number,
    total_property_price,
    down_payment,
    remaining_balance,
    monthly_interest
FROM homeowner_tbl
WHERE remaining_balance > 0
ORDER BY remaining_balance DESC;
*/

-- 3. Count homeowners by status
/*
SELECT
    status,
    COUNT(*) AS homeowner_count
FROM homeowner_tbl
GROUP BY status;
*/

-- 4. Get homeowners who moved in this year
/*
SELECT
    full_name,
    unit_number,
    move_in_date
FROM homeowner_tbl
WHERE EXTRACT(YEAR FROM move_in_date) = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY move_in_date DESC;
*/

-- 5. Calculate total dues collection per month
/*
SELECT
    SUM(monthly_dues) AS total_monthly_dues
FROM homeowner_tbl
WHERE status = 'active';
*/

-- =====================================================
-- NOTES
-- =====================================================
/*
1. The property_id field references property_info_tbl(property_id)
   - Make sure property_info_tbl exists before creating this table
   - ON DELETE SET NULL ensures homeowner records remain if property is deleted

2. Financial calculations are automated via trigger:
   - remaining_balance = total_property_price - down_payment
   - monthly_interest = (remaining_balance * interest_rate) / 12

3. Email validation is enforced via CHECK constraint

4. The updated_at timestamp is automatically updated via trigger

5. Indexes are created for common query patterns:
   - property_id lookups
   - status filtering
   - name and unit number searches

6. All NUMERIC fields use (15, 2) precision for currency
   - Supports up to 999,999,999,999.99 (sufficient for property prices)

7. Interest rate is stored as decimal (e.g., 0.0500 = 5%)
   - Display as percentage in UI: interest_rate * 100

8. To drop this table:
   DROP TABLE IF EXISTS homeowner_tbl CASCADE;
*/
