-- Rollback Migration: Remove unclaimed profile fields from users table
-- Purpose: Rollback the unclaimed profile fields if needed

-- Drop indexes first
DROP INDEX IF EXISTS idx_users_is_unclaimed;
DROP INDEX IF EXISTS idx_users_claimed_by;
DROP INDEX IF EXISTS idx_users_original_unclaimed_id;

-- Drop foreign key constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS fk_users_claimed_by;

-- Drop columns
ALTER TABLE users 
DROP COLUMN IF EXISTS is_unclaimed,
DROP COLUMN IF EXISTS claimed_by,
DROP COLUMN IF EXISTS claimed_at,
DROP COLUMN IF EXISTS original_unclaimed_id;