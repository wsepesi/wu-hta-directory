-- Migration: Add tracking fields for unclaimed profiles
-- Purpose: Track who recorded unclaimed profiles and when invitations were sent

-- Add new columns to users table for tracking unclaimed profile management
ALTER TABLE users 
ADD COLUMN invitation_sent TIMESTAMP,
ADD COLUMN recorded_by UUID,
ADD COLUMN recorded_at TIMESTAMP;

-- Add foreign key constraint for recorded_by
ALTER TABLE users
ADD CONSTRAINT fk_users_recorded_by 
FOREIGN KEY (recorded_by) REFERENCES users(id);

-- Add indexes for better query performance
CREATE INDEX idx_users_invitation_sent ON users(invitation_sent);
CREATE INDEX idx_users_recorded_by ON users(recorded_by);
CREATE INDEX idx_users_recorded_at ON users(recorded_at);

-- Add composite index for finding unclaimed profiles without invitations
CREATE INDEX idx_users_unclaimed_no_invitation 
ON users(is_unclaimed, invitation_sent) 
WHERE is_unclaimed = true AND invitation_sent IS NULL;

-- Add composite index for finding unclaimed profiles by recorder
CREATE INDEX idx_users_unclaimed_by_recorder 
ON users(is_unclaimed, recorded_by) 
WHERE is_unclaimed = true;

-- Add comments to document the purpose of these fields
COMMENT ON COLUMN users.invitation_sent IS 'Timestamp when an invitation was sent to claim this unclaimed profile';
COMMENT ON COLUMN users.recorded_by IS 'References the user who recorded/created this unclaimed profile';
COMMENT ON COLUMN users.recorded_at IS 'Timestamp when this unclaimed profile was recorded/created';