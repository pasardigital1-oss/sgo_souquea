-- =============================================
-- FIX COMPLETE — Jalankan SEMUA di SQL Editor
-- =============================================

-- 1. Pastikan service_role bisa update vendor & profiles
GRANT ALL ON vendors TO service_role;
GRANT ALL ON profiles TO service_role;

-- 2. Buat atau update profiles row untuk lucky
-- (foreign key join ke profiles yang NULL bikin row tidak muncul)
INSERT INTO profiles (id, full_name, role, is_active, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  'vendor',
  true,
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.email = 'lucky.jamaludin@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'vendor',
  is_active = true,
  full_name = COALESCE(
    profiles.full_name,
    EXCLUDED.full_name
  ),
  updated_at = NOW();

-- 3. Pastikan vendor PasDig status = pending dan linked benar
UPDATE vendors SET
  status = 'pending',
  updated_at = NOW()
WHERE business_name = 'PasDig'
  AND status != 'pending';

-- 4. Verify hasil akhir
SELECT 
  v.id AS vendor_id,
  v.business_name,
  v.status,
  v.created_at AS vendor_created,
  p.id AS profile_id,
  p.full_name,
  p.role AS profile_role,
  p.is_active,
  au.email
FROM vendors v
JOIN profiles p ON p.id = v.user_id
JOIN auth.users au ON au.id = v.user_id
WHERE v.business_name = 'PasDig'
   OR au.email = 'lucky.jamaludin@gmail.com';
