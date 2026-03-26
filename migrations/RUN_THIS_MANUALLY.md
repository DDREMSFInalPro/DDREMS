# Database Migration Instructions

To enable buyer counter-offer functionality, you need to add two new columns to the `agreements` table.

## Option 1: Using pgAdmin or any PostgreSQL GUI

1. Connect to your `ddrems` database
2. Run the following SQL:

```sql
-- Add buyer_counter_price column if it doesn't exist
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS buyer_counter_price DECIMAL(15, 2);

-- Add buyer_notes column if it doesn't exist
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS buyer_notes TEXT;
```

## Option 2: Using psql command line

Open Command Prompt or PowerShell and run:

```bash
psql -U postgres -d ddrems
```

Then paste and execute:

```sql
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS buyer_counter_price DECIMAL(15, 2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS buyer_notes TEXT;
```

Type `\q` to exit psql.

## Option 3: Find psql.exe and run the migration file

1. Find your PostgreSQL installation (usually in `C:\Program Files\PostgreSQL\<version>\bin\`)
2. Open Command Prompt in that directory
3. Run:

```bash
psql.exe -U postgres -d ddrems -f "C:\Users\DABC\Desktop\DDREMS_Integrated\DDREMS-main\migrations\003_buyer_counter_offer.sql"
```

## Verify the migration

After running the SQL, verify the columns were added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'agreements'
AND column_name IN ('buyer_counter_price', 'buyer_notes');
```

You should see both columns listed.
