# Database Migrations Guide

This document lists all database migration files that must be run in your Supabase project for the application to work correctly.

## ⚠️ CRITICAL: Run These Migrations

After running the main `supabase_schema.sql`, you **MUST** run all migration files in the order listed below. Skipping any of these will cause the application to fail with "Column not found" or "Table not found" errors.

## Migration Files (Run in Order)

### 1. create_financing_selections_table.sql
**Purpose**: Creates the `financing_selections` table for storing student financing choices.

**Location**: `backend/db/migrations/create_financing_selections_table.sql`

**What it does**:
- Creates table to store financing plan selections
- Links to enrollment records
- Stores selected payment plan details

### 2. add_next_of_kin_to_family_info.sql
**Purpose**: Adds next of kin fields to the family information table.

**Location**: `backend/db/migrations/add_next_of_kin_to_family_info.sql`

**What it does**:
- Adds `next_of_kin_name` column
- Adds `next_of_kin_relationship` column
- Adds `next_of_kin_contact` column

### 3. add_next_of_kin_to_financing_selections.sql
**Purpose**: Adds next of kin fields to the financing selections table.

**Location**: `backend/db/migrations/add_next_of_kin_to_financing_selections.sql`

**What it does**:
- Adds `next_of_kin_name` column
- Adds `next_of_kin_relationship` column
- Adds `next_of_kin_contact` column

### 4. add_updated_at_to_fee_responsibility.sql
**Purpose**: Adds timestamp tracking to fee responsibility records.

**Location**: `backend/db/migrations/add_updated_at_to_fee_responsibility.sql`

**What it does**:
- Adds `updated_at` column with automatic timestamp updates
- Enables better audit trail for fee changes

### 5. supabase_rls_policies.sql
**Purpose**: Sets up Row Level Security (RLS) policies for data protection.

**Location**: `backend/db/migrations/supabase_rls_policies.sql`

**What it does**:
- Enables RLS on all tables
- Creates policies for authenticated users
- Ensures users can only access their own data

### 6. add_indexes.sql
**Purpose**: Adds database indexes for performance optimization.

**Location**: `backend/db/migrations/add_indexes.sql`

**What it does**:
- Creates indexes on frequently queried columns
- Improves query performance
- Optimizes foreign key lookups

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open each migration file in order
4. Copy the SQL content
5. Paste into the SQL Editor
6. Click "Run" to execute
7. Verify success before moving to the next file

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or run individual files
psql $DATABASE_URL < backend/db/migrations/create_financing_selections_table.sql
psql $DATABASE_URL < backend/db/migrations/add_next_of_kin_to_family_info.sql
# ... continue for all files
```

## Verification

After running all migrations, verify they were applied successfully:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check if specific columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'family_information' 
  AND column_name LIKE 'next_of_kin%';
```

## Troubleshooting

### "Column does not exist" errors
- **Cause**: Migration files were not run
- **Solution**: Run the missing migration file(s)

### "Table already exists" errors
- **Cause**: Trying to run a migration twice
- **Solution**: Skip that migration or use `IF NOT EXISTS` clauses

### "Permission denied" errors
- **Cause**: Insufficient database permissions
- **Solution**: Ensure you're using the service role key or have admin access

## Important Notes

1. **Order Matters**: Always run migrations in the order listed above
2. **Backup First**: Take a database backup before running migrations in production
3. **Test First**: Run migrations in a development/staging environment first
4. **One-Way**: These migrations are designed to be run once; running them multiple times may cause errors
5. **RLS Policies**: The RLS policies migration is critical for security - do not skip it

## Need Help?

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify your database connection and permissions
3. Ensure you're running migrations in the correct order
4. Review the SQL content of each migration file for any conflicts
