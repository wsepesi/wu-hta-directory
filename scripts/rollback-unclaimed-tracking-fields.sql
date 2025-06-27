-- Rollback: Remove tracking fields for unclaimed profiles
-- Purpose: Rollback the changes made by add-unclaimed-tracking-fields.sql

-- Drop indexes first
DROP INDEX IF EXISTS idx_users_unclaimed_by_recorder;
DROP INDEX IF EXISTS idx_users_unclaimed_no_invitation;
DROP INDEX IF EXISTS idx_users_recorded_at;
DROP INDEX IF EXISTS idx_users_recorded_by;
DROP INDEX IF EXISTS idx_users_invitation_sent;

-- Drop foreign key constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS fk_users_recorded_by;

-- Drop columns
ALTER TABLE users 
DROP COLUMN IF EXISTS invitation_sent,
DROP COLUMN IF EXISTS recorded_by,
DROP COLUMN IF EXISTS recorded_at;