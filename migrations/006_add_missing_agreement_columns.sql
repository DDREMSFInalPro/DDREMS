-- Fix: Add all missing columns to agreements table

ALTER TABLE agreements ADD COLUMN IF NOT EXISTS counter_offer_price DECIMAL(15, 2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS owner_notes TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS buyer_counter_price DECIMAL(15, 2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS buyer_notes TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS owner_counter_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS buyer_counter_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS owner_response_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);

-- Ensure status column is wide enough
ALTER TABLE agreements ALTER COLUMN status TYPE VARCHAR(30);

-- Update status constraint
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
