-- Add buyer counter-offer fields to agreements table
-- This enables buyers to respond to owner counter-offers

DO $$
BEGIN
    -- Add buyer_counter_price column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agreements' AND column_name = 'buyer_counter_price'
    ) THEN
        ALTER TABLE agreements ADD COLUMN buyer_counter_price DECIMAL(15, 2);
    END IF;

    -- Add buyer_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agreements' AND column_name = 'buyer_notes'
    ) THEN
        ALTER TABLE agreements ADD COLUMN buyer_notes TEXT;
    END IF;
END $$;

-- Update the status check constraint to include new statuses
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
    'owner_approved', 
    'owner_rejected', 
    'completed'
));
