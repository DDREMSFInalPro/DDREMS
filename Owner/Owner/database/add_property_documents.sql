-- ============================================================
-- Migration: Add property_documents table for ownership certificates
-- ============================================================

CREATE TABLE IF NOT EXISTS property_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size_bytes BIGINT,
    access_key VARCHAR(32) NOT NULL UNIQUE,
    is_locked BOOLEAN DEFAULT true,
    description VARCHAR(255) DEFAULT 'Ownership Certificate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_documents_property ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_access_key ON property_documents(access_key);
