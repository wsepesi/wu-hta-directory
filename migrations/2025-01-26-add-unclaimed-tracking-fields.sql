-- Add unclaimed profile tracking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invitation_sent TIMESTAMP,
ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMP;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_users_invitation_sent ON users(invitation_sent);
CREATE INDEX IF NOT EXISTS idx_users_recorded_by ON users(recorded_by);
CREATE INDEX IF NOT EXISTS idx_users_recorded_at ON users(recorded_at);

-- Add composite index for finding unclaimed profiles without invitations
CREATE INDEX IF NOT EXISTS idx_users_unclaimed_no_invitation 
ON users(is_unclaimed, invitation_sent) 
WHERE is_unclaimed = true AND invitation_sent IS NULL;

-- Add composite index for finding unclaimed profiles by recorder
CREATE INDEX IF NOT EXISTS idx_users_unclaimed_by_recorder 
ON users(is_unclaimed, recorded_by) 
WHERE is_unclaimed = true;