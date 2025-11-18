-- Add updated_at column to fee_responsibility table if it doesn't exist
ALTER TABLE fee_responsibility
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
