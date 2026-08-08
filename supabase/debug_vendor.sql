-- Fix full_name NULL untuk lucky
UPDATE profiles 
SET full_name = 'Lucky Jamaludin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'lucky.jamaludin@gmail.com')
AND full_name IS NULL;

-- Verify vendor PasDig
SELECT 
  v.id,
  v.business_name,
  v.status,
  v.user_id,
  p.full_name,
  p.role,
  p.is_active
FROM vendors v
LEFT JOIN profiles p ON p.id = v.user_id
WHERE v.business_name = 'PasDig';
