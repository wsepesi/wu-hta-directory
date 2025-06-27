-- Migration to remove offering_pattern column from courses table
-- Date: 2025-01-26

-- Drop the index on offering_pattern first
DROP INDEX IF EXISTS idx_courses_offering_pattern;

-- Remove the offering_pattern column from courses table
ALTER TABLE courses DROP COLUMN IF EXISTS offering_pattern;