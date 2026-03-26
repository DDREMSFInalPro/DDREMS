-- Migration: Create negotiation history table to track all offers and counter-offers
-- This allows displaying complete negotiation timeline with multiple rounds

CREATE TABLE IF NOT EXISTS negotiation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  actor_type VARCHAR(10) NOT NULL CHECK (actor_type IN ('buyer', 'owner')),
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('initial_request', 'counter_offer', 'accept', 'reject')),
  price NUMERIC(15, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_negotiation_history_agreement ON negotiation_history(agreement_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_history_created ON negotiation_history(agreement_id, created_at);

-- Migrate existing data to negotiation history
-- Insert initial buyer requests
INSERT INTO negotiation_history (agreement_id, actor_type, action_type, price, notes, created_at)
SELECT 
  id,
  'buyer',
  'initial_request',
  COALESCE(sale_price, monthly_rent),
  terms,
  created_at
FROM agreements
WHERE NOT EXISTS (
  SELECT 1 FROM negotiation_history nh 
  WHERE nh.agreement_id = agreements.id 
  AND nh.action_type = 'initial_request'
);

-- Insert owner counter-offers (if they exist)
INSERT INTO negotiation_history (agreement_id, actor_type, action_type, price, notes, created_at)
SELECT 
  id,
  'owner',
  'counter_offer',
  counter_offer_price,
  owner_notes,
  COALESCE(owner_counter_at, updated_at)
FROM agreements
WHERE counter_offer_price IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM negotiation_history nh 
  WHERE nh.agreement_id = agreements.id 
  AND nh.actor_type = 'owner'
  AND nh.action_type = 'counter_offer'
);

-- Insert buyer counter-offers (if they exist)
INSERT INTO negotiation_history (agreement_id, actor_type, action_type, price, notes, created_at)
SELECT 
  id,
  'buyer',
  'counter_offer',
  buyer_counter_price,
  buyer_notes,
  COALESCE(buyer_counter_at, updated_at)
FROM agreements
WHERE buyer_counter_price IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM negotiation_history nh 
  WHERE nh.agreement_id = agreements.id 
  AND nh.actor_type = 'buyer'
  AND nh.action_type = 'counter_offer'
);
