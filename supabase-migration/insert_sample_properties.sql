-- =====================================================
-- INSERT SAMPLE DATA for property_info_tbl
-- Purpose: Create sample properties to test homeowners dropdown
-- =====================================================

-- NOTE: Before running this, make sure you have:
-- 1. lot_tbl with sample lots
-- 2. property_detail_tbl with sample property details

-- =====================================================
-- Step 1: Insert sample lots (if not exists)
-- =====================================================

INSERT INTO lot_tbl (lot_id, lot_number, lot_area, lot_status)
VALUES
    (gen_random_uuid(), 'L001', 150.5, 'available'),
    (gen_random_uuid(), 'L002', 200.0, 'available'),
    (gen_random_uuid(), 'L003', 175.5, 'available'),
    (gen_random_uuid(), 'L004', 180.0, 'available'),
    (gen_random_uuid(), 'L005', 220.0, 'available')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Step 2: Insert sample property details (if not exists)
-- =====================================================

INSERT INTO property_detail_tbl (
    detail_id,
    property_name,
    property_type,
    property_area,
    bedrooms,
    bathrooms,
    total_area
)
VALUES
    (
        gen_random_uuid(),
        'Single Family Home',
        'residential',
        ARRAY[
            '{"name": "Floor Area", "value": "120", "type": "sqm"}'::jsonb,
            '{"name": "Lot Area", "value": "150", "type": "sqm"}'::jsonb,
            '{"name": "Living Room", "value": "25", "type": "sqm"}'::jsonb,
            '{"name": "Master Bedroom", "value": "20", "type": "sqm"}'::jsonb
        ]::jsonb[],
        3,
        2,
        150.5
    ),
    (
        gen_random_uuid(),
        'Townhouse',
        'residential',
        ARRAY[
            '{"name": "Floor Area", "value": "90", "type": "sqm"}'::jsonb,
            '{"name": "Lot Area", "value": "100", "type": "sqm"}'::jsonb,
            '{"name": "Living Room", "value": "20", "type": "sqm"}'::jsonb
        ]::jsonb[],
        2,
        2,
        100.0
    ),
    (
        gen_random_uuid(),
        'Duplex',
        'residential',
        ARRAY[
            '{"name": "Floor Area", "value": "110", "type": "sqm"}'::jsonb,
            '{"name": "Lot Area", "value": "130", "type": "sqm"}'::jsonb
        ]::jsonb[],
        3,
        2,
        130.0
    )
ON CONFLICT DO NOTHING;

-- =====================================================
-- Step 3: Insert sample properties into property_info_tbl
-- =====================================================

-- First, get the IDs we need (run these queries to get actual UUIDs)
-- SELECT lot_id, lot_number FROM lot_tbl ORDER BY lot_number LIMIT 5;
-- SELECT detail_id, property_name FROM property_detail_tbl LIMIT 3;

-- Replace the UUIDs below with actual ones from your database
-- Or use this dynamic insert:

WITH lot_data AS (
    SELECT lot_id, lot_number, ROW_NUMBER() OVER (ORDER BY lot_number) as rn
    FROM lot_tbl
    LIMIT 5
),
detail_data AS (
    SELECT detail_id, property_name, ROW_NUMBER() OVER (ORDER BY property_name) as rn
    FROM property_detail_tbl
    LIMIT 3
)
INSERT INTO property_info_tbl (
    property_id,
    property_title,
    property_lot_id,
    property_details_id,
    property_availability,
    amenities,
    property_photo
)
SELECT
    gen_random_uuid(),
    CASE rn
        WHEN 1 THEN 'Sunrise Villa'
        WHEN 2 THEN 'Sunset Manor'
        WHEN 3 THEN 'Garden House'
        WHEN 4 THEN 'Ocean View'
        WHEN 5 THEN 'Mountain Peak'
    END,
    l.lot_id,
    d.detail_id,
    'available',
    ARRAY['Living Area', 'Dining Area', 'Kitchen', 'Toilet & Bath', 'Garage', 'Garden']::text[],
    NULL
FROM (
    SELECT 1 as rn UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
) nums
LEFT JOIN lot_data l ON l.rn = nums.rn
LEFT JOIN detail_data d ON d.rn = ((nums.rn - 1) % 3) + 1
WHERE l.lot_id IS NOT NULL;

-- =====================================================
-- Alternative: Manual insert (if dynamic doesn't work)
-- =====================================================

/*
-- Get lot IDs first:
-- DO $$
-- DECLARE
--     lot1_id UUID;
--     lot2_id UUID;
--     lot3_id UUID;
--     detail1_id UUID;
--     detail2_id UUID;
-- BEGIN
--     -- Get lot IDs
--     SELECT lot_id INTO lot1_id FROM lot_tbl WHERE lot_number = 'L001' LIMIT 1;
--     SELECT lot_id INTO lot2_id FROM lot_tbl WHERE lot_number = 'L002' LIMIT 1;
--     SELECT lot_id INTO lot3_id FROM lot_tbl WHERE lot_number = 'L003' LIMIT 1;

--     -- Get detail IDs
--     SELECT detail_id INTO detail1_id FROM property_detail_tbl WHERE property_name = 'Single Family Home' LIMIT 1;
--     SELECT detail_id INTO detail2_id FROM property_detail_tbl WHERE property_name = 'Townhouse' LIMIT 1;

--     -- Insert properties
--     INSERT INTO property_info_tbl (
--         property_id,
--         property_title,
--         property_lot_id,
--         property_details_id,
--         property_availability,
--         amenities
--     ) VALUES
--         (gen_random_uuid(), 'Sunrise Villa', lot1_id, detail1_id, 'available',
--          ARRAY['Living Area', 'Dining Area', 'Kitchen', 'Toilet & Bath', 'Garage', 'Garden']::text[]),
--         (gen_random_uuid(), 'Sunset Manor', lot2_id, detail2_id, 'available',
--          ARRAY['Living Area', 'Dining Area', 'Kitchen', 'Balcony', 'Parking']::text[]),
--         (gen_random_uuid(), 'Garden House', lot3_id, detail1_id, 'available',
--          ARRAY['Living Area', 'Kitchen', 'Garden', 'Terrace']::text[]);
-- END $$;
*/

-- =====================================================
-- Verify the data was inserted
-- =====================================================

SELECT
    p.property_id,
    p.property_title,
    l.lot_number,
    pd.property_name,
    p.property_availability
FROM property_info_tbl p
LEFT JOIN lot_tbl l ON p.property_lot_id = l.lot_id
LEFT JOIN property_detail_tbl pd ON p.property_details_id = pd.detail_id
ORDER BY p.property_title;

-- =====================================================
-- Check if data shows up in the exact format the app expects
-- =====================================================

SELECT
    property_id,
    property_title,
    property_lot_id,
    property_details_id,
    property_availability,
    property_photo,
    json_build_object(
        'lot_id', l.lot_id,
        'lot_number', l.lot_number,
        'lot_area', l.lot_area
    ) as lot_tbl,
    json_build_object(
        'detail_id', pd.detail_id,
        'property_name', pd.property_name,
        'property_area', pd.property_area
    ) as property_detail_tbl
FROM property_info_tbl p
LEFT JOIN lot_tbl l ON p.property_lot_id = l.lot_id
LEFT JOIN property_detail_tbl pd ON p.property_details_id = pd.detail_id
ORDER BY property_title;
