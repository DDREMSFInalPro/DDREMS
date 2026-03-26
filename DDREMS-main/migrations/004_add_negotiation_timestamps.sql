-- Migration: Add timestamp fields for negotiation events
-- This allows tracking when each counter-offer was made

-- Increase status column size to accommodate longer status names
ALTER TABLE agreements ALTER COLUMN status TYPE VARCHAR(30);

-- Add timestamp for when owner made counter-offer
ALTER TABLE agreements 
ADD COLUMN IF NOT EXISTS owner_counter_at TIMESTAMP;

-- Add timestamp for when buyer responded to counter-offer
ALTER TABLE agreements 
ADD COLUMN IF NOT EXISTS buyer_counter_at TIMESTAMP;

-- Add timestamp for when admin forwarded to owner
ALTER TABLE agreements 
ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMP;

-- Add timestamp for when owner approved/rejected
ALTER TABLE agreements 
ADD COLUMN IF NOT EXISTS owner_response_at TIMESTAMP;

-- Update existing records to use updated_at as fallback
UPDATE agreements 
SET owner_counter_at = updated_at 
WHERE counter_offer_price IS NOT NULL AND owner_counter_at IS NULL;

UPDATE agreements 
SET buyer_counter_at = updated_at 
WHERE buyer_counter_price IS NOT NULL AND buyer_counter_at IS NULL;

-- Add new status: buyer_counter_forwarded (when admin forwards buyer's counter to owner)
ALTER TABLE agreements DROP CONSTRAINT IF EXISTS agreements_status_check;
ALTER TABLE agreements ADD CONSTRAINT agreements_status_check 
CHECK (status IN (
  'pending', 
  'forwarded_to_owner', 
  'counter_offer', 
  'counter_offer_sent', 
  'buyer_accepted_counter', 
  'buyer_rejected_counter', 
  'buyer_counter_offer', 
  'buyer_counter_forwarded',
  'owner_approved', 
  'owner_rejected', 
  'completed'
));
