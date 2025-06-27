-- Add indexes for performance optimization
-- These indexes will speed up common queries in the application

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_grad_year ON users(grad_year);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(first_name, last_name);

-- Courses table indexes
CREATE INDEX IF NOT EXISTS idx_courses_course_number ON courses(course_number);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(course_name);

-- Professors table indexes
CREATE INDEX IF NOT EXISTS idx_professors_email ON professors(email);
CREATE INDEX IF NOT EXISTS idx_professors_name ON professors(first_name, last_name);

-- Course Offerings table indexes
CREATE INDEX IF NOT EXISTS idx_course_offerings_course_id ON course_offerings(course_id);
CREATE INDEX IF NOT EXISTS idx_course_offerings_professor_id ON course_offerings(professor_id);
CREATE INDEX IF NOT EXISTS idx_course_offerings_semester ON course_offerings(semester, year, season);
CREATE INDEX IF NOT EXISTS idx_course_offerings_year_season ON course_offerings(year, season);

-- TA Assignments table indexes
CREATE INDEX IF NOT EXISTS idx_ta_assignments_user_id ON ta_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ta_assignments_course_offering_id ON ta_assignments(course_offering_id);
CREATE INDEX IF NOT EXISTS idx_ta_assignments_created_at ON ta_assignments(created_at DESC);

-- Invitations table indexes
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- Password Reset Tokens table indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires);

-- Audit Logs table indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- User Privacy Settings table indexes
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON user_privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_appear_in_directory ON user_privacy_settings(appear_in_directory);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ta_assignments_user_course ON ta_assignments(user_id, course_offering_id);
CREATE INDEX IF NOT EXISTS idx_course_offerings_composite ON course_offerings(course_id, year, season);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);

-- Full text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(current_role, '')));
CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING gin(to_tsvector('english', course_number || ' ' || course_name));
CREATE INDEX IF NOT EXISTS idx_professors_search ON professors USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- Partial indexes for specific queries
CREATE INDEX IF NOT EXISTS idx_users_active_tas ON users(id) WHERE role = 'head_ta';
CREATE INDEX IF NOT EXISTS idx_invitations_unused ON invitations(token, expires_at) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_password_reset_unused ON password_reset_tokens(token, expires) WHERE used = false;

-- Analyze tables to update query planner statistics
ANALYZE users;
ANALYZE courses;
ANALYZE professors;
ANALYZE course_offerings;
ANALYZE ta_assignments;
ANALYZE invitations;
ANALYZE sessions;
ANALYZE password_reset_tokens;
ANALYZE audit_logs;
ANALYZE user_privacy_settings;