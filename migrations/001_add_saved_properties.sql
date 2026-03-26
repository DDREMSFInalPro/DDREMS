-- ============================================
-- DDREMS - Saved Properties Table Migration
-- Created for Buyer Module functionality
-- ============================================
-- Run this after schema.sql has been applied

CREATE TABLE IF NOT EXISTS saved_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT saved_properties_unique UNIQUE(user_id, property_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);

-- Add admin_note column to agreements if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agreements' AND column_name = 'admin_note'
    ) THEN
        ALTER TABLE agreements ADD COLUMN admin_note TEXT;
    END IF;
END $$;
