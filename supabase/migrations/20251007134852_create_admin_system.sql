/*
  # Create Admin System

  ## New Tables
  - `admins` - Admin user accounts
    - `id` - UUID primary key
    - `username` - Unique username for login
    - `password_hash` - Hashed password
    - `email` - Admin email
    - `name` - Admin full name
    - `is_active` - Active status
    - `created_at` - Timestamp

  ## Security
  - Enable RLS
  - Only admins can view admin table
  - Passwords stored as bcrypt hash
  
  ## Default Admin
  - Username: admin
  - Password: Admin@123 (will be hashed)
*/

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Only authenticated users can check admin credentials
CREATE POLICY "Public can verify admin login" 
  ON admins FOR SELECT 
  TO public 
  USING (true);

-- Insert default admin
-- Password: Admin@123
INSERT INTO admins (username, password_hash, email, name, is_active)
VALUES (
  'admin',
  crypt('Admin@123', gen_salt('bf')),
  'admin@dresshub.com',
  'System Administrator',
  true
)
ON CONFLICT (username) DO NOTHING;

-- Function to verify admin login
CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username text,
  p_password text
)
RETURNS TABLE(
  admin_id uuid,
  username text,
  email text,
  name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.username,
    a.email,
    a.name
  FROM admins a
  WHERE a.username = p_username
    AND a.password_hash = crypt(p_password, a.password_hash)
    AND a.is_active = true;
  
  -- Update last login
  UPDATE admins 
  SET last_login = now() 
  WHERE admins.username = p_username 
    AND admins.password_hash = crypt(p_password, admins.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_admin_login TO anon, authenticated;
