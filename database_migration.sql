-- ==========================================
-- Herland Laundry System - Schema Update
-- Goal: Align database with implemented features
-- ==========================================

-- 1. Update Profile Roles
-- Ensure all application roles exist in the user_role enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Customer', 'Staff', 'Rider', 'Admin');
    ELSE
        -- Add missing values if the type already exists
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Customer';
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Staff';
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Rider';
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Admin';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- 2. Enhance Bookings Table
-- Add tracking for riders, declinations, and customer feedback
ALTER TABLE IF EXISTS bookings 
ADD COLUMN IF NOT EXISTS rider_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS declined_by JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS feedback JSONB;

-- 3. Standardize Service Items
-- Ensure service_items is the primary table for pricing (used by Admin & Guest view)
CREATE TABLE IF NOT EXISTS service_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('wash', 'dry', 'fold', 'addon')),
    name TEXT NOT NULL,
    current_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    previous_price NUMERIC(10,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. Shop Schedule
CREATE TABLE IF NOT EXISTS shop_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opens TEXT NOT NULL DEFAULT '08:00',
    closes TEXT NOT NULL DEFAULT '18:00',
    previous_opens TEXT,
    previous_closes TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 5. Row Level Security (RLS) & Public Access
-- Enable RLS on all tables
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PUBLIC POLICIES (For Guest View)
CREATE POLICY "Allow public read access to services" 
ON service_items FOR SELECT USING (true);

CREATE POLICY "Allow public read access to shop schedule" 
ON shop_schedule FOR SELECT USING (true);

-- USER POLICIES (For Bookings)
CREATE POLICY "Users can view their own bookings" 
ON bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- STAFF/RIDER ACCESS
CREATE POLICY "Staff and Riders can view all bookings" 
ON bookings FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Staff', 'Rider', 'Admin')
));

CREATE POLICY "Staff and Riders can update bookings" 
ON bookings FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Staff', 'Rider', 'Admin')
));

-- 6. Seed Initial Data (Optional - if tables are empty)
INSERT INTO service_items (type, name, current_price, sort_order)
VALUES 
    ('wash', 'Wash Only', 60.00, 1),
    ('dry', 'Dry Only', 65.00, 2),
    ('fold', 'Fold Only', 30.00, 3),
    ('addon', 'Comforter', 150.00, 4)
ON CONFLICT DO NOTHING;

INSERT INTO shop_schedule (opens, closes) 
VALUES ('08:00', '18:00')
ON CONFLICT DO NOTHING;
