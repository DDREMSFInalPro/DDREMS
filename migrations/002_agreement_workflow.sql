-- Add forwarded_to_owner to agreement status
-- The status column is VARCHAR(20), not an ENUM type, so we just need to update the check constraint if any

-- If it's stored as a simple string column, no migration needed for the DB itself.
-- The validation is done at the application level (Sequelize model).
-- But let's make sure the column can hold the value:
DO $$
BEGIN
    -- Ensure admin_note column exists (might be admin_notes)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agreements' AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE agreements ADD COLUMN admin_notes TEXT;
    END IF;
END $$;
