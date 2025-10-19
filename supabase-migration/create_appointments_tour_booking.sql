-- =====================================================
-- APPOINTMENTS / TOUR BOOKING TABLE
-- For managing property tour appointments/bookings
-- =====================================================

-- Drop table if exists (for fresh install)
DROP TABLE IF EXISTS appointments CASCADE;

-- Create appointments table
CREATE TABLE appointments (
    -- Primary key
    appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Property information
    property_id UUID NOT NULL,
    property_title VARCHAR(255),

    -- User/Client information
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),

    -- Appointment details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    message TEXT,

    -- Status tracking (Two-stage approval workflow)
    -- Flow: pending → cs_approved → sales_approved → confirmed
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'cs_approved', 'sales_approved', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show')),

    -- Two-stage approval workflow
    -- Stage 1: Customer Service Approval
    cs_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cs_approved_at TIMESTAMP WITH TIME ZONE,
    cs_approval_notes TEXT,

    -- Stage 2: Sales Representative Approval
    sales_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sales_approved_at TIMESTAMP WITH TIME ZONE,
    sales_approval_notes TEXT,

    -- Rejection (can happen at any stage)
    rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Admin notes
    admin_notes TEXT,
    confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,

    -- Cancellation information
    cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for better query performance
-- =====================================================

-- Index on user_id for quick lookups of user's appointments
CREATE INDEX idx_appointments_user_id ON appointments(user_id);

-- Index on property_id for quick lookups of property appointments
CREATE INDEX idx_appointments_property_id ON appointments(property_id);

-- Index on appointment_date for date-based queries
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Index on status for filtering by appointment status
CREATE INDEX idx_appointments_status ON appointments(status);

-- Composite index for user appointments by status
CREATE INDEX idx_appointments_user_status ON appointments(user_id, status);

-- Composite index for date and status (for admin dashboard)
CREATE INDEX idx_appointments_date_status ON appointments(appointment_date, status);

-- Index on created_at for sorting by newest
CREATE INDEX idx_appointments_created_at ON appointments(created_at DESC);

-- Index on email for quick client lookups
CREATE INDEX idx_appointments_client_email ON appointments(client_email);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own appointments
CREATE POLICY "Users can view own appointments"
    ON appointments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own appointments
CREATE POLICY "Users can create own appointments"
    ON appointments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending appointments (for cancellation)
CREATE POLICY "Users can update own pending appointments"
    ON appointments
    FOR UPDATE
    USING (
        auth.uid() = user_id
        AND status IN ('pending', 'confirmed')
    );

-- Policy: Admins can view all appointments
CREATE POLICY "Admins can view all appointments"
    ON appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' = 'sales representative'
                OR auth.users.raw_user_meta_data->>'role' = 'customer service')
        )
    );

-- Policy: Admins can update all appointments
CREATE POLICY "Admins can update all appointments"
    ON appointments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' = 'sales representative'
                OR auth.users.raw_user_meta_data->>'role' = 'customer service')
        )
    );

-- Policy: Admins can delete appointments
CREATE POLICY "Admins can delete appointments"
    ON appointments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get appointments count by status
CREATE OR REPLACE FUNCTION get_appointments_count_by_status()
RETURNS TABLE (
    status VARCHAR,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.status::VARCHAR,
        COUNT(*)::BIGINT
    FROM appointments a
    GROUP BY a.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming appointments for a user
CREATE OR REPLACE FUNCTION get_user_upcoming_appointments(p_user_id UUID)
RETURNS TABLE (
    appointment_id UUID,
    property_title VARCHAR,
    appointment_date DATE,
    appointment_time TIME,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.appointment_id,
        a.property_title,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.created_at
    FROM appointments a
    WHERE a.user_id = p_user_id
        AND a.appointment_date >= CURRENT_DATE
        AND a.status IN ('pending', 'confirmed')
    ORDER BY a.appointment_date ASC, a.appointment_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get appointments for today
CREATE OR REPLACE FUNCTION get_today_appointments()
RETURNS TABLE (
    appointment_id UUID,
    property_title VARCHAR,
    client_name VARCHAR,
    client_email VARCHAR,
    client_phone VARCHAR,
    appointment_time TIME,
    status VARCHAR,
    message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.appointment_id,
        a.property_title,
        a.client_name,
        a.client_email,
        a.client_phone,
        a.appointment_time,
        a.status,
        a.message
    FROM appointments a
    WHERE a.appointment_date = CURRENT_DATE
    ORDER BY a.appointment_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for Customer Service approval (Stage 1)
CREATE OR REPLACE FUNCTION approve_by_customer_service(
    p_appointment_id UUID,
    p_approver_id UUID,
    p_approval_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_approver_role VARCHAR;
BEGIN
    -- Get approver role
    SELECT raw_user_meta_data->>'role' INTO v_approver_role
    FROM auth.users
    WHERE id = p_approver_id;

    -- Check if user is customer service or admin
    IF v_approver_role NOT IN ('admin', 'customer service') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Only Customer Service or Admin can perform this approval'
        );
    END IF;

    -- Update appointment to cs_approved status
    UPDATE appointments
    SET
        status = 'cs_approved',
        cs_approved_by = p_approver_id,
        cs_approved_at = NOW(),
        cs_approval_notes = p_approval_notes,
        updated_at = NOW()
    WHERE appointment_id = p_appointment_id
        AND status = 'pending';

    -- Check if update was successful
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Appointment approved by Customer Service. Awaiting Sales Representative approval.'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'Appointment not found or already processed'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for Sales Representative approval (Stage 2)
CREATE OR REPLACE FUNCTION approve_by_sales_representative(
    p_appointment_id UUID,
    p_approver_id UUID,
    p_approval_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_approver_role VARCHAR;
    v_current_status VARCHAR;
BEGIN
    -- Get approver role
    SELECT raw_user_meta_data->>'role' INTO v_approver_role
    FROM auth.users
    WHERE id = p_approver_id;

    -- Check if user is sales representative or admin
    IF v_approver_role NOT IN ('admin', 'sales representative') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Only Sales Representative or Admin can perform this approval'
        );
    END IF;

    -- Get current status
    SELECT status INTO v_current_status
    FROM appointments
    WHERE appointment_id = p_appointment_id;

    -- Check if customer service has already approved
    IF v_current_status != 'cs_approved' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Appointment must be approved by Customer Service first'
        );
    END IF;

    -- Update appointment to sales_approved status (both approvals complete)
    UPDATE appointments
    SET
        status = 'sales_approved',
        sales_approved_by = p_approver_id,
        sales_approved_at = NOW(),
        sales_approval_notes = p_approval_notes,
        updated_at = NOW()
    WHERE appointment_id = p_appointment_id
        AND status = 'cs_approved';

    -- Check if update was successful
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Appointment fully approved! Both Customer Service and Sales Representative have approved.'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'Failed to approve appointment'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject an appointment (can be done at any stage)
CREATE OR REPLACE FUNCTION reject_appointment(
    p_appointment_id UUID,
    p_rejector_id UUID,
    p_rejection_reason TEXT
)
RETURNS JSON AS $$
DECLARE
    v_rejector_role VARCHAR;
BEGIN
    -- Get rejector role
    SELECT raw_user_meta_data->>'role' INTO v_rejector_role
    FROM auth.users
    WHERE id = p_rejector_id;

    -- Check if user has permission to reject
    IF v_rejector_role NOT IN ('admin', 'customer service', 'sales representative') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'You do not have permission to reject appointments'
        );
    END IF;

    -- Update appointment (can reject from pending, cs_approved, or sales_approved)
    UPDATE appointments
    SET
        status = 'rejected',
        rejected_by = p_rejector_id,
        rejected_at = NOW(),
        rejection_reason = p_rejection_reason,
        updated_at = NOW()
    WHERE appointment_id = p_appointment_id
        AND status IN ('pending', 'cs_approved', 'sales_approved');

    -- Check if update was successful
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Appointment rejected successfully'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'Appointment not found or already processed'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get appointments pending Customer Service approval
CREATE OR REPLACE FUNCTION get_appointments_pending_cs_approval()
RETURNS TABLE (
    appointment_id UUID,
    property_title VARCHAR,
    client_name VARCHAR,
    client_email VARCHAR,
    client_phone VARCHAR,
    appointment_date DATE,
    appointment_time TIME,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.appointment_id,
        a.property_title,
        a.client_name,
        a.client_email,
        a.client_phone,
        a.appointment_date,
        a.appointment_time,
        a.message,
        a.created_at
    FROM appointments a
    WHERE a.status = 'pending'
        AND a.appointment_date >= CURRENT_DATE
    ORDER BY a.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get appointments pending Sales Representative approval
CREATE OR REPLACE FUNCTION get_appointments_pending_sales_approval()
RETURNS TABLE (
    appointment_id UUID,
    property_title VARCHAR,
    client_name VARCHAR,
    client_email VARCHAR,
    client_phone VARCHAR,
    appointment_date DATE,
    appointment_time TIME,
    message TEXT,
    cs_approved_by UUID,
    cs_approved_at TIMESTAMP WITH TIME ZONE,
    cs_approval_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.appointment_id,
        a.property_title,
        a.client_name,
        a.client_email,
        a.client_phone,
        a.appointment_date,
        a.appointment_time,
        a.message,
        a.cs_approved_by,
        a.cs_approved_at,
        a.cs_approval_notes,
        a.created_at
    FROM appointments a
    WHERE a.status = 'cs_approved'
        AND a.appointment_date >= CURRENT_DATE
    ORDER BY a.cs_approved_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get appointments by status for staff (with two-stage approval info)
CREATE OR REPLACE FUNCTION get_appointments_by_status(p_status VARCHAR)
RETURNS TABLE (
    appointment_id UUID,
    property_title VARCHAR,
    client_name VARCHAR,
    client_email VARCHAR,
    client_phone VARCHAR,
    appointment_date DATE,
    appointment_time TIME,
    status VARCHAR,
    message TEXT,
    cs_approved_by UUID,
    cs_approved_at TIMESTAMP WITH TIME ZONE,
    cs_approval_notes TEXT,
    sales_approved_by UUID,
    sales_approved_at TIMESTAMP WITH TIME ZONE,
    sales_approval_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.appointment_id,
        a.property_title,
        a.client_name,
        a.client_email,
        a.client_phone,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.message,
        a.cs_approved_by,
        a.cs_approved_at,
        a.cs_approval_notes,
        a.sales_approved_by,
        a.sales_approved_at,
        a.sales_approval_notes,
        a.created_at
    FROM appointments a
    WHERE a.status = p_status
    ORDER BY a.appointment_date ASC, a.appointment_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- =====================================================

-- Insert sample appointments (uncomment to use)
/*
INSERT INTO appointments (
    property_id,
    property_title,
    user_id,
    client_name,
    client_email,
    client_phone,
    appointment_date,
    appointment_time,
    message,
    status
) VALUES
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'Modern House in Subdivision A',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::UUID,
        'John Doe',
        'john.doe@example.com',
        '+63 912 345 6789',
        CURRENT_DATE + INTERVAL '2 days',
        '10:00:00',
        'Interested in viewing this property',
        'pending'
    ),
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'Beautiful Villa in Koronadal',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::UUID,
        'Jane Smith',
        'jane.smith@example.com',
        '+63 923 456 7890',
        CURRENT_DATE + INTERVAL '5 days',
        '14:00:00',
        'Would like to schedule a tour',
        'pending'
    );
*/

-- =====================================================
-- GRANTS (for service role and authenticated users)
-- =====================================================

-- Grant usage on the table
GRANT ALL ON appointments TO authenticated;
GRANT ALL ON appointments TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_appointments_count_by_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_upcoming_appointments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_appointments() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_by_customer_service(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_by_sales_representative(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_appointment(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_appointments_pending_cs_approval() TO authenticated;
GRANT EXECUTE ON FUNCTION get_appointments_pending_sales_approval() TO authenticated;
GRANT EXECUTE ON FUNCTION get_appointments_by_status(VARCHAR) TO authenticated;

-- =====================================================
-- COMMENTS for documentation
-- =====================================================

COMMENT ON TABLE appointments IS 'Stores property tour appointments and bookings with two-stage approval workflow';
COMMENT ON COLUMN appointments.appointment_id IS 'Primary key - unique identifier for each appointment';
COMMENT ON COLUMN appointments.property_id IS 'Reference to the property being viewed';
COMMENT ON COLUMN appointments.user_id IS 'Reference to the user who made the appointment';
COMMENT ON COLUMN appointments.status IS 'Current status: pending → cs_approved → sales_approved → confirmed, or rejected/cancelled/completed/no_show';
COMMENT ON COLUMN appointments.cs_approved_by IS 'Customer Service member who approved (Stage 1)';
COMMENT ON COLUMN appointments.cs_approved_at IS 'Timestamp of Customer Service approval';
COMMENT ON COLUMN appointments.sales_approved_by IS 'Sales Representative who approved (Stage 2)';
COMMENT ON COLUMN appointments.sales_approved_at IS 'Timestamp of Sales Representative approval';
COMMENT ON COLUMN appointments.admin_notes IS 'Internal notes visible only to staff';
COMMENT ON COLUMN appointments.confirmed_by IS 'Staff member who confirmed the appointment';
COMMENT ON COLUMN appointments.cancelled_by IS 'User who cancelled (can be client or admin)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Query to verify table creation
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Query to verify indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'appointments';

-- Query to verify RLS policies
SELECT
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'appointments';

-- =====================================================
-- END OF SCRIPT
-- =====================================================
