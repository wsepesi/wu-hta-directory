-- Add missing columns for unclaimed profile tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invitation_sent timestamp without time zone NULL,
ADD COLUMN IF NOT EXISTS recorded_by uuid NULL,
ADD COLUMN IF NOT EXISTS recorded_at timestamp without time zone NULL;

-- Add foreign key constraint for recorded_by
ALTER TABLE users
ADD CONSTRAINT users_recorded_by_fkey 
FOREIGN KEY (recorded_by) REFERENCES users(id);

-- Add index for recorded_by for better query performance
CREATE INDEX IF NOT EXISTS idx_users_recorded_by 
ON users(recorded_by);