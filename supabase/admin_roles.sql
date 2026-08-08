-- Add admin_role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role TEXT
  CHECK (admin_role IN ('super_admin', 'admin'))
  DEFAULT NULL;

-- Set existing admin user as super_admin
UPDATE profiles SET admin_role = 'super_admin'
WHERE role = 'admin';

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role ON profiles(admin_role);

-- Grant
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
