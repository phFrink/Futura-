-- =====================================================
-- Check Foreign Key Relationships
-- =====================================================

-- Check if the foreign key constraint exists
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'buyer_home_owner_tbl'
    AND kcu.column_name = 'property_id';

-- =====================================================
-- If relationship doesn't exist or is named differently,
-- use this simpler query without explicit foreign key name
-- =====================================================

-- Simple query that will work regardless of constraint name:
/*
SELECT
    h.*,
    json_build_object(
        'property_id', p.property_id,
        'property_title', p.property_title,
        'lot_tbl', json_build_object(
            'lot_number', l.lot_number
        ),
        'property_detail_tbl', json_build_object(
            'property_name', pd.property_name
        )
    ) as property_info
FROM buyer_home_owner_tbl h
LEFT JOIN property_info_tbl p ON h.property_id = p.property_id
LEFT JOIN lot_tbl l ON p.property_lot_id = l.lot_id
LEFT JOIN property_detail_tbl pd ON p.property_details_id = pd.detail_id
ORDER BY h.full_name;
*/
