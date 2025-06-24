-- Seed data for Head TA Directory development

-- Clear existing data
DELETE FROM ta_assignments;
DELETE FROM course_offerings;
DELETE FROM professors;
DELETE FROM courses;
DELETE FROM invitations;
DELETE FROM sessions;
DELETE FROM users;

-- Insert sample users (passwords are hashed versions of 'password123')
INSERT INTO users (id, email, password_hash, first_name, last_name, grad_year, degree_program, current_role, location, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', '$2a$10$K8ZpdrjQQMHvF3n0fYKvQeR0j0R9rZ7xtWHa1xDmKzHJUvdKqKvW6', 'Admin', 'User', NULL, NULL, 'System Administrator', 'Boston, MA', 'admin'),
('550e8400-e29b-41d4-a716-446655440002', 'john.doe@example.com', '$2a$10$K8ZpdrjQQMHvF3n0fYKvQeR0j0R9rZ7xtWHa1xDmKzHJUvdKqKvW6', 'John', 'Doe', 2023, 'Computer Science', 'Software Engineer at Google', 'San Francisco, CA', 'head_ta'),
('550e8400-e29b-41d4-a716-446655440003', 'jane.smith@example.com', '$2a$10$K8ZpdrjQQMHvF3n0fYKvQeR0j0R9rZ7xtWHa1xDmKzHJUvdKqKvW6', 'Jane', 'Smith', 2024, 'Applied Mathematics', 'PhD Student at MIT', 'Cambridge, MA', 'head_ta'),
('550e8400-e29b-41d4-a716-446655440004', 'bob.johnson@example.com', '$2a$10$K8ZpdrjQQMHvF3n0fYKvQeR0j0R9rZ7xtWHa1xDmKzHJUvdKqKvW6', 'Bob', 'Johnson', 2022, 'Economics', 'Data Analyst at McKinsey', 'New York, NY', 'head_ta'),
('550e8400-e29b-41d4-a716-446655440005', 'alice.williams@example.com', '$2a$10$K8ZpdrjQQMHvF3n0fYKvQeR0j0R9rZ7xtWHa1xDmKzHJUvdKqKvW6', 'Alice', 'Williams', 2025, 'Psychology', 'Research Assistant', 'Providence, RI', 'head_ta');

-- Update invited_by relationships
UPDATE users SET invited_by = '550e8400-e29b-41d4-a716-446655440001' WHERE id IN ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003');
UPDATE users SET invited_by = '550e8400-e29b-41d4-a716-446655440002' WHERE id = '550e8400-e29b-41d4-a716-446655440004';
UPDATE users SET invited_by = '550e8400-e29b-41d4-a716-446655440003' WHERE id = '550e8400-e29b-41d4-a716-446655440005';

-- Insert sample professors
INSERT INTO professors (id, first_name, last_name, email) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Robert', 'Anderson', 'robert.anderson@university.edu'),
('650e8400-e29b-41d4-a716-446655440002', 'Sarah', 'Chen', 'sarah.chen@university.edu'),
('650e8400-e29b-41d4-a716-446655440003', 'Michael', 'Davis', 'michael.davis@university.edu'),
('650e8400-e29b-41d4-a716-446655440004', 'Emily', 'Wilson', 'emily.wilson@university.edu'),
('650e8400-e29b-41d4-a716-446655440005', 'David', 'Martinez', 'david.martinez@university.edu');

-- Insert sample courses
INSERT INTO courses (id, course_number, course_name, offering_pattern) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'CS 15', 'Data Structures', 'both'),
('750e8400-e29b-41d4-a716-446655440002', 'CS 40', 'Machine Structure and Assembly Language', 'both'),
('750e8400-e29b-41d4-a716-446655440003', 'CS 170', 'Computation Theory', 'fall_only'),
('750e8400-e29b-41d4-a716-446655440004', 'CS 135', 'Introduction to Machine Learning', 'spring_only'),
('750e8400-e29b-41d4-a716-446655440005', 'MATH 70', 'Linear Algebra', 'both'),
('750e8400-e29b-41d4-a716-446655440006', 'ECON 11', 'Intermediate Microeconomics', 'both'),
('750e8400-e29b-41d4-a716-446655440007', 'PSY 1', 'Introduction to Psychology', 'both');

-- Insert sample course offerings
INSERT INTO course_offerings (id, course_id, professor_id, semester, year, season) VALUES
-- Fall 2023
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Fall 2023', 2023, 'Fall'),
('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Fall 2023', 2023, 'Fall'),
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'Fall 2023', 2023, 'Fall'),
('850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440004', 'Fall 2023', 2023, 'Fall'),
-- Spring 2024
('850e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Spring 2024', 2024, 'Spring'),
('850e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Spring 2024', 2024, 'Spring'),
('850e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440005', 'Spring 2024', 2024, 'Spring'),
('850e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440004', 'Spring 2024', 2024, 'Spring'),
-- Fall 2024 (current semester with missing TAs)
('850e8400-e29b-41d4-a716-446655440009', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Fall 2024', 2024, 'Fall'),
('850e8400-e29b-41d4-a716-446655440010', '750e8400-e29b-41d4-a716-446655440002', NULL, 'Fall 2024', 2024, 'Fall'), -- Missing professor
('850e8400-e29b-41d4-a716-446655440011', '750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'Fall 2024', 2024, 'Fall'),
('850e8400-e29b-41d4-a716-446655440012', '750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440005', 'Fall 2024', 2024, 'Fall'),
('850e8400-e29b-41d4-a716-446655440013', '750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440004', 'Fall 2024', 2024, 'Fall');

-- Insert sample TA assignments
INSERT INTO ta_assignments (user_id, course_offering_id, hours_per_week, responsibilities) VALUES
-- Past assignments
('550e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440001', 10, 'Lab sections, office hours, grading'),
('550e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440002', 15, 'Recitation sections, assignment design'),
('550e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440004', 12, 'Office hours, exam grading'),
('550e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440005', 10, 'Lab sections, office hours'),
('550e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440006', 15, 'Recitation sections, grading'),
('550e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440007', 8, 'Grading, office hours'),
-- Current assignments (note some courses have no TAs assigned)
('550e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440009', 10, 'Lab sections, office hours'),
('550e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440013', 12, 'Discussion sections, grading');
-- Note: course_offerings 10, 11, and 12 have no TAs assigned (missing TAs)

-- Insert sample invitations
INSERT INTO invitations (email, invited_by, token, expires_at, used_at) VALUES
('newta@example.com', '550e8400-e29b-41d4-a716-446655440001', 'token_123456789', NOW() + INTERVAL '7 days', NULL),
('expiredta@example.com', '550e8400-e29b-41d4-a716-446655440002', 'token_987654321', NOW() - INTERVAL '1 day', NULL),
('usedta@example.com', '550e8400-e29b-41d4-a716-446655440003', 'token_555555555', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days');