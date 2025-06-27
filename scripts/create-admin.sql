-- Script to create the first admin user
-- Run this after setting up the production database

-- Replace these values with your actual admin details
-- Password should be hashed using bcrypt (you can generate one using an online bcrypt generator)
-- Example password 'AdminPassword123!' hashed with bcrypt

INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'sepesi.w@wustl.edu', -- Replace with your admin email
    '', -- Replace with bcrypt hash of your password
    'William', -- Replace with admin first name
    'Sepesi', -- Replace with admin last name
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- To generate a bcrypt hash:
-- 1. Use an online tool like https://bcrypt-generator.com/
-- 2. Or use Node.js: 
--    const bcrypt = require('bcryptjs');
--    const hash = bcrypt.hashSync('YourPassword123!', 10);
--    console.log(hash);

-- After creating the admin, they can invite other users through the application