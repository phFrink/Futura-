-- =====================================================
-- CREATE VIEW: homeowners_with_property_info
-- Purpose: Join homeowners with property_info_tbl and related tables
-- =====================================================

CREATE OR REPLACE VIEW homeowners_with_property_info AS
SELECT
    -- Homeowner fields
    h.id AS homeowner_id,
    h.full_name,
    h.email,
    h.phone,
    h.status,
    h.unit_number,
    h.property_id,
    h.monthly_dues,
    h.move_in_date,
    h.emergency_contact_name,
    h.emergency_contact_phone,
    h.total_property_price,
    h.down_payment,
    h.interest_rate,
    h.remaining_balance,
    h.monthly_interest,
    h.created_at AS homeowner_created_at,
    h.updated_at AS homeowner_updated_at,

    -- Property info fields
    p.property_id AS prop_property_id,
    p.property_title,
    p.property_lot_id,
    p.property_details_id,
    p.property_availability,
    p.property_photo,
    p.amenities,

    -- Lot fields
    l.lot_id,
    l.lot_number,
    l.lot_area,
    l.lot_status,

    -- Property detail fields
    pd.detail_id,
    pd.property_name,
    pd.property_area,
    pd.property_type,
    pd.bedrooms,
    pd.bathrooms,
    pd.total_area,

    -- Computed/helpful fields
    CONCAT(p.property_title, ' - Lot ', l.lot_number) AS property_display_name,
    CASE
        WHEN p.property_availability = 'available' THEN 'Available'
        WHEN p.property_availability = 'occupied' THEN 'Occupied'
        WHEN p.property_availability = 'reserved' THEN 'Reserved'
        ELSE 'Unknown'
    END AS availability_label

FROM
    homeowners h
LEFT JOIN
    property_info_tbl p ON h.property_id = p.property_id
LEFT JOIN
    lot_tbl l ON p.property_lot_id = l.lot_id
LEFT JOIN
    property_detail_tbl pd ON p.property_details_id = pd.detail_id

ORDER BY
    h.full_name ASC;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- 1. Get all homeowners with complete property information
-- SELECT * FROM homeowners_with_property_info;

-- 2. Get homeowners by property status
-- SELECT * FROM homeowners_with_property_info WHERE property_availability = 'occupied';

-- 3. Get homeowners with specific lot numbers
-- SELECT * FROM homeowners_with_property_info WHERE lot_number = 'L001';

-- 4. Search homeowners by name or property
-- SELECT * FROM homeowners_with_property_info
-- WHERE full_name ILIKE '%john%' OR property_title ILIKE '%villa%';

-- 5. Get financial summary
-- SELECT
--     full_name,
--     property_display_name,
--     total_property_price,
--     down_payment,
--     remaining_balance,
--     monthly_interest,
--     monthly_dues
-- FROM homeowners_with_property_info
-- WHERE remaining_balance > 0;

-- =====================================================
-- GRANT PERMISSIONS (adjust as needed)
-- =====================================================

-- Grant SELECT permission to authenticated users
-- GRANT SELECT ON homeowners_with_property_info TO authenticated;
-- GRANT SELECT ON homeowners_with_property_info TO anon;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This view uses LEFT JOINs so homeowners without properties still appear
-- 2. The property_display_name field provides a user-friendly property label
-- 3. All related data from lot_tbl and property_detail_tbl is included
-- 4. You can add more computed fields as needed (e.g., payment calculations)
-- 5. To drop this view: DROP VIEW IF EXISTS homeowners_with_property_info;
