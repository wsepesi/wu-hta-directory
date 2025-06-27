-- Add unclaimed profile columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_unclaimed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS original_unclaimed_id UUID;

-- Add missing tables from schema
-- Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id),
    expires TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Audit Logs table for admin activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    metadata TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User Privacy Settings table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    show_email BOOLEAN NOT NULL DEFAULT false,
    show_grad_year BOOLEAN NOT NULL DEFAULT true,
    show_location BOOLEAN NOT NULL DEFAULT true,
    show_linkedin BOOLEAN NOT NULL DEFAULT true,
    show_personal_site BOOLEAN NOT NULL DEFAULT true,
    show_courses BOOLEAN NOT NULL DEFAULT true,
    appear_in_directory BOOLEAN NOT NULL DEFAULT true,
    allow_contact BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_is_unclaimed ON users(is_unclaimed);
CREATE INDEX IF NOT EXISTS idx_users_claimed_by ON users(claimed_by);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON user_privacy_settings(user_id);

-- Add trigger for user_privacy_settings updated_at
CREATE TRIGGER update_user_privacy_settings_updated_at BEFORE UPDATE ON user_privacy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();