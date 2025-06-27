# Database Schema Design

## Core Tables

### users
Primary user information table for all Head TAs in the system.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  grad_year INTEGER,
  degree_program VARCHAR(100),
  current_role VARCHAR(200), -- Current job/position
  linkedin_url VARCHAR(255),
  personal_site VARCHAR(255),
  location VARCHAR(100),
  role VARCHAR(20) DEFAULT 'head_ta', -- 'head_ta', 'admin'
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### professors
CS faculty members who teach courses.

```sql
CREATE TABLE professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### courses
Course definitions.

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_number VARCHAR(20) NOT NULL, -- e.g., "CS101", "COMP230"
  course_name VARCHAR(200) NOT NULL,
  offering_pattern VARCHAR(20) DEFAULT 'both', -- 'both', 'fall_only', 'spring_only', 'sparse'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### course_offerings
Specific instances of courses taught in particular semesters.

```sql
CREATE TABLE course_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professors(id) ON DELETE SET NULL,
  semester VARCHAR(20) NOT NULL, -- e.g., "Fall 2024", "Spring 2025"
  year INTEGER NOT NULL,
  season VARCHAR(10) NOT NULL, -- "Fall", "Spring"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Head TA who added/updated this
  
  UNIQUE(course_id, year, season)
);
```

### ta_assignments
Junction table connecting Head TAs to course offerings.

```sql
CREATE TABLE ta_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  hours_per_week INTEGER DEFAULT 10,
  responsibilities TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, course_offering_id)
);
```

### invitations
Manage the invitation process for new users.

```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes for Performance

```sql
-- User lookups and search
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_grad_year ON users(grad_year);
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_invited_by ON users(invited_by);
CREATE INDEX idx_users_current_role ON users(current_role);
CREATE INDEX idx_users_name_search ON users(first_name, last_name);

-- Course and semester queries  
CREATE INDEX idx_course_offerings_semester ON course_offerings(year, season);
CREATE INDEX idx_course_offerings_professor ON course_offerings(professor_id);
CREATE INDEX idx_course_offerings_updated_by ON course_offerings(updated_by);
CREATE INDEX idx_courses_offering_pattern ON courses(offering_pattern);
CREATE INDEX idx_courses_search ON courses(course_number, course_name);

-- Professor search
CREATE INDEX idx_professors_name_search ON professors(first_name, last_name);
CREATE INDEX idx_professors_email ON professors(email);

-- TA assignment queries
CREATE INDEX idx_ta_assignments_user ON ta_assignments(user_id);
CREATE INDEX idx_ta_assignments_course ON ta_assignments(course_offering_id);

-- Invitation management
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_expires ON invitations(expires_at);
CREATE INDEX idx_invitations_invited_by ON invitations(invited_by);
```

## Common Queries

### Get Head TAs by Semester
```sql
SELECT u.first_name, u.last_name, u.grad_year, u.degree_program, u.personal_site,
       c.course_number, c.course_name, co.semester
FROM users u
JOIN ta_assignments ta ON u.id = ta.user_id  
JOIN course_offerings co ON ta.course_offering_id = co.id
JOIN courses c ON co.course_id = c.id
WHERE co.year = 2024 
  AND co.season = 'Fall'
ORDER BY c.course_number, u.last_name;
```

### Get Course Family Tree with Missing TAs
```sql
SELECT c.course_number, c.course_name, c.offering_pattern,
       co.year, co.season, co.semester,
       CONCAT(p.first_name, ' ', p.last_name) as professor_name,
       COUNT(ta.user_id) as ta_count,
       CASE 
         WHEN COUNT(ta.user_id) = 0 THEN '???'
         ELSE STRING_AGG(CONCAT(u.first_name, ' ', u.last_name), ', ')
       END as head_tas
FROM courses c
LEFT JOIN course_offerings co ON c.id = co.course_id
LEFT JOIN professors p ON co.professor_id = p.id
LEFT JOIN ta_assignments ta ON co.id = ta.course_offering_id
LEFT JOIN users u ON ta.user_id = u.id
WHERE c.course_number = 'CS101'
GROUP BY c.id, c.course_number, c.course_name, c.offering_pattern, 
         co.year, co.season, co.semester, p.first_name, p.last_name
ORDER BY co.year DESC, co.season;
```

### Get Individual TA History
```sql
SELECT c.course_number, c.course_name, co.semester,
       ta.hours_per_week, ta.responsibilities,
       CONCAT(p.first_name, ' ', p.last_name) as professor_name
FROM ta_assignments ta
JOIN course_offerings co ON ta.course_offering_id = co.id
JOIN courses c ON co.course_id = c.id
LEFT JOIN professors p ON co.professor_id = p.id
WHERE ta.user_id = $1
ORDER BY co.year DESC, co.season;
```

### Get Courses Needing Head TA Assignment
```sql
SELECT c.course_number, c.course_name, co.semester, co.year, co.season,
       CONCAT(p.first_name, ' ', p.last_name) as professor_name
FROM course_offerings co
JOIN courses c ON co.course_id = c.id
LEFT JOIN professors p ON co.professor_id = p.id
LEFT JOIN ta_assignments ta ON co.id = ta.course_offering_id
WHERE ta.id IS NULL
  AND co.year >= EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY co.year, co.season, c.course_number;
```

### Global Search Query
```sql
-- Search across users, courses, and professors
SELECT 'user' as type, id, 
       CONCAT(first_name, ' ', last_name) as name,
       email, grad_year::text as extra_info
FROM users 
WHERE LOWER(first_name || ' ' || last_name) LIKE LOWER('%' || $1 || '%')
   OR LOWER(email) LIKE LOWER('%' || $1 || '%')
   OR LOWER(current_role) LIKE LOWER('%' || $1 || '%')

UNION ALL

SELECT 'course' as type, id,
       CONCAT(course_number, ' - ', course_name) as name,
       course_number as email, offering_pattern as extra_info
FROM courses
WHERE LOWER(course_number) LIKE LOWER('%' || $1 || '%')
   OR LOWER(course_name) LIKE LOWER('%' || $1 || '%')

UNION ALL

SELECT 'professor' as type, id,
       CONCAT(first_name, ' ', last_name) as name,
       email, NULL as extra_info
FROM professors
WHERE LOWER(first_name || ' ' || last_name) LIKE LOWER('%' || $1 || '%')
   OR LOWER(email) LIKE LOWER('%' || $1 || '%')

ORDER BY name;
```

### Public Directory View
```sql
-- Public view excluding sensitive information
SELECT u.id, u.first_name, u.last_name, u.grad_year, u.degree_program, 
       u.current_role, u.location,
       c.course_number, c.course_name, co.semester
FROM users u
JOIN ta_assignments ta ON u.id = ta.user_id
JOIN course_offerings co ON ta.course_offering_id = co.id
JOIN courses c ON co.course_id = c.id
WHERE co.year >= EXTRACT(YEAR FROM CURRENT_DATE) - 2 -- Last 2 years
ORDER BY u.last_name, u.first_name, co.year DESC;
```

### Admin Invitation Tracking
```sql
-- Get invitation tree for admin dashboard
SELECT u.id, 
       CONCAT(u.first_name, ' ', u.last_name) as user_name,
       u.email, u.created_at,
       CONCAT(inviter.first_name, ' ', inviter.last_name) as invited_by_name,
       inviter.email as inviter_email,
       i.created_at as invitation_date
FROM users u
LEFT JOIN users inviter ON u.invited_by = inviter.id
LEFT JOIN invitations i ON i.email = u.email AND i.used_at IS NOT NULL
ORDER BY u.created_at DESC;
```

### Admin User Management
```sql
-- Get user details for admin management
SELECT u.id, u.email, 
       CONCAT(u.first_name, ' ', u.last_name) as name,
       u.grad_year, u.degree_program, u.current_role, u.location,
       u.role, u.created_at,
       COUNT(ta.id) as ta_assignments_count,
       CONCAT(inviter.first_name, ' ', inviter.last_name) as invited_by
FROM users u
LEFT JOIN ta_assignments ta ON u.id = ta.user_id
LEFT JOIN users inviter ON u.invited_by = inviter.id
GROUP BY u.id, u.email, u.first_name, u.last_name, u.grad_year, 
         u.degree_program, u.current_role, u.location, u.role, u.created_at,
         inviter.first_name, inviter.last_name
ORDER BY u.created_at DESC;
```

## Data Validation Rules

- Email addresses must be unique across users and validated format
- Semester format: "{Season} {Year}" (e.g., "Fall 2024")
- Course numbers follow department convention (e.g., "CS###", "COMP###")
- Graduation years must be reasonable (current year - 10 to current year + 6)
- Invitation tokens expire after 7 days
- Users can only be assigned as TA to courses in future or current semester
- Course offering patterns: 'both', 'fall_only', 'spring_only', 'sparse'

## Future Feature Schema Extensions

*Note: These tables are planned for future implementation and should be considered during initial schema design to avoid complex migrations.*

### Email Blast System

```sql
-- Mailing list management
CREATE TABLE mailing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User email preferences
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  general_announcements BOOLEAN DEFAULT true,
  local_meetups BOOLEAN DEFAULT true,
  hiring_opportunities BOOLEAN DEFAULT true,
  alumni_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

-- Email blast history
CREATE TABLE email_blasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mailing_list_id UUID REFERENCES mailing_lists(id) ON DELETE SET NULL
);
```

### "Where Are They Now" System

```sql
-- Extended user profile for alumni tracking
ALTER TABLE users ADD COLUMN current_company VARCHAR(200);
ALTER TABLE users ADD COLUMN current_role VARCHAR(200);
ALTER TABLE users ADD COLUMN current_location VARCHAR(100);
ALTER TABLE users ADD COLUMN willing_to_meet BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN last_updated_profile TIMESTAMP;

-- Meetup interest tracking
CREATE TABLE meetup_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  location VARCHAR(100) NOT NULL, -- City/region for meetups
  interested BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, location)
);
```

### TA Recommendation System

```sql
-- Skills and expertise tracking
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Another user who can vouch
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, skill_name)
);

-- Hiring availability and preferences
CREATE TABLE hiring_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  available_for_hiring BOOLEAN DEFAULT false,
  preferred_role_types TEXT[], -- Array: ['full-time', 'internship', 'consulting', 'startup']
  preferred_locations TEXT[], -- Array: ['San Francisco', 'New York', 'Remote']
  resume_url VARCHAR(255),
  portfolio_url VARCHAR(255),
  availability_date DATE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

-- Recommendation system
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recommendee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recommendation_text TEXT NOT NULL,
  skills_highlighted TEXT[], -- Array of skills being endorsed
  relationship_context VARCHAR(200), -- How they worked together
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(recommender_id, recommendee_id)
);
```

### Course Enhancement Features

```sql
-- Course difficulty and workload tracking
ALTER TABLE courses ADD COLUMN typical_workload_hours INTEGER;
ALTER TABLE courses ADD COLUMN difficulty_rating DECIMAL(2,1); -- 1.0 to 5.0 scale
ALTER TABLE courses ADD COLUMN prerequisites TEXT[];

-- TA feedback on courses (for future TAs)
CREATE TABLE course_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  ta_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workload_rating INTEGER CHECK (workload_rating >= 1 AND workload_rating <= 5),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  would_recommend BOOLEAN,
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(course_offering_id, ta_id)
);
```