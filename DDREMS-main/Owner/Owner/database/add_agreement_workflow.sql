-- ============================================================
-- Migration: Add agreement workflow columns
-- Supports buyer request → admin forwards → owner approves/rejects → admin generates
-- ============================================================

-- Add status column to track workflow state
ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'owner_approved', 'owner_rejected', 'completed'));

-- Add buyer reference (who requested the agreement)
ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add admin notes
ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_buyer ON agreements(buyer_id);
