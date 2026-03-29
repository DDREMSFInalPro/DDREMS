-- Migration 008: Chapa payment integration + owner wallet + commission tracking

-- Add Chapa fields to payments table
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS chapa_tx_ref       VARCHAR(200),
  ADD COLUMN IF NOT EXISTS chapa_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS commission_amount  DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owner_net_amount   DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_rate    DECIMAL(5,2)  DEFAULT 15.00;

-- Owner wallet table
CREATE TABLE IF NOT EXISTS owner_wallets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance       DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_earned  DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_withdrawn DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          DECIMAL(15,2) NOT NULL,
  bank_name       VARCHAR(100),
  account_number  VARCHAR(50),
  account_name    VARCHAR(100),
  status          VARCHAR(30) NOT NULL DEFAULT 'pending',  -- pending, approved, rejected, paid
  admin_note      TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_chapa_tx_ref ON payments(chapa_tx_ref);
CREATE INDEX IF NOT EXISTS idx_withdrawal_owner ON withdrawal_requests(owner_id);
