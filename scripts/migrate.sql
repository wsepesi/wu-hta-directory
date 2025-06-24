-- Create database tables for Head TA Directory

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS ta_assignments CASCADE;
DROP TABLE IF EXISTS course_offerings CASCADE;
DROP TABLE IF EXISTS professors CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    grad_year INTEGER,
    degree_program VARCHAR(255),
    current_role VARCHAR(255),
    linkedin_url TEXT,
    personal_site TEXT,
    location VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'head_ta' CHECK (role IN ('head_ta', 'admin')),
    invited_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create courses table
CREATE TABLE courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_number VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    offering_pattern VARCHAR(20) NOT NULL DEFAULT 'both' 
        CHECK (offering_pattern IN ('both', 'fall_only', 'spring_only', 'sparse')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create professors table
CREATE TABLE professors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create course_offerings table
CREATE TABLE course_offerings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id),
    professor_id UUID REFERENCES professors(id),
    semester VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    season VARCHAR(10) NOT NULL CHECK (season IN ('Fall', 'Spring')),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create ta_assignments table
CREATE TABLE ta_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id),
    hours_per_week INTEGER,
    responsibilities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create invitations table
CREATE TABLE invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    invited_by UUID REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create sessions table for NextAuth
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id),
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_grad_year ON users(grad_year);
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_courses_course_number ON courses(course_number);
CREATE INDEX idx_course_offerings_semester ON course_offerings(semester, year);
CREATE INDEX idx_course_offerings_course_id ON course_offerings(course_id);
CREATE INDEX idx_ta_assignments_user_id ON ta_assignments(user_id);
CREATE INDEX idx_ta_assignments_course_offering_id ON ta_assignments(course_offering_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();