-- Migration: Add unclaimed profile fields to users table
-- Purpose: Enable tracking of unclaimed profiles that can later be claimed and merged into real user accounts

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN is_unclaimed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN claimed_by UUID,
ADD COLUMN claimed_at TIMESTAMP,
ADD COLUMN original_unclaimed_id UUID;

-- Add foreign key constraint for claimed_by
ALTER TABLE users
ADD CONSTRAINT fk_users_claimed_by 
FOREIGN KEY (claimed_by) REFERENCES users(id);

-- Add indexes for better query performance
CREATE INDEX idx_users_is_unclaimed ON users(is_unclaimed);
CREATE INDEX idx_users_claimed_by ON users(claimed_by);
CREATE INDEX idx_users_original_unclaimed_id ON users(original_unclaimed_id);

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN users.is_unclaimed IS 'Indicates if this profile was created without user authentication';
COMMENT ON COLUMN users.claimed_by IS 'References the user who claimed this unclaimed profile';
COMMENT ON COLUMN users.claimed_at IS 'Timestamp when the unclaimed profile was claimed';
COMMENT ON COLUMN users.original_unclaimed_id IS 'Tracks the original ID of an unclaimed profile after merge';