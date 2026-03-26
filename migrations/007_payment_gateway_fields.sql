-- Add payment gateway fields to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS agreement_id UUID REFERENCES agreements(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(500);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS owner_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS owner_confirmed_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_verified_at TIMESTAMP;

-- Update payment_method enum to include new gateways
ALTER TABLE payments ALTER COLUMN payment_method TYPE VARCHAR(30);

-- Update payment_status to include new statuses
ALTER TABLE payments ALTER COLUMN payment_status TYPE VARCHAR(30);
