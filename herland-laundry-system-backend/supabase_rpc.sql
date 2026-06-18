-- Run this SQL in your Supabase SQL Editor to create the RPC function
-- This solves the 1000 row truncation limit for your dashboard stats

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json AS $$
DECLARE
    v_total_bookings INT;
    v_completed_bookings INT;
    v_estimated_revenue NUMERIC;
BEGIN
    -- 1. Get total active bookings (not cancelled)
    SELECT COUNT(*) INTO v_total_bookings
    FROM bookings
    WHERE status != 'cancelled';

    -- 2. Get completed bookings
    SELECT COUNT(*) INTO v_completed_bookings
    FROM bookings
    WHERE status IN ('delivered', 'completed');

    -- 3. Calculate estimated revenue from completed bookings
    -- This casts the JSONB totalAmount to a numeric value safely
    SELECT COALESCE(SUM(CAST(payment_details->>'totalAmount' AS NUMERIC)), 0)
    INTO v_estimated_revenue
    FROM bookings
    WHERE status IN ('delivered', 'completed')
    AND payment_details->>'totalAmount' IS NOT NULL;

    -- Return the result as a JSON object
    RETURN json_build_object(
        'total_bookings', v_total_bookings,
        'completed_bookings', v_completed_bookings,
        'estimated_revenue', v_estimated_revenue
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
