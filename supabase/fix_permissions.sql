-- =============================================
-- SGO-SouqUAE — Fix Permissions
-- Run this in Supabase SQL Editor
-- =============================================

-- Grant permissions for authenticated users
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON cart_items TO authenticated;
GRANT ALL ON reviews TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT SELECT ON vendors TO authenticated;
GRANT INSERT ON vendors TO authenticated;
GRANT UPDATE ON vendors TO authenticated;
GRANT ALL ON spare_parts TO authenticated;
GRANT ALL ON inventory TO authenticated;
GRANT SELECT ON part_compatibility TO authenticated;
GRANT INSERT ON part_compatibility TO authenticated;

-- user_vehicles (My Garage)
GRANT ALL ON user_vehicles TO authenticated;
GRANT ALL ON user_vehicles TO service_role;

-- payment_settings (Admin)
GRANT ALL ON payment_settings TO authenticated;
GRANT ALL ON payment_settings TO service_role;

-- vat_logs
GRANT ALL ON vat_logs TO authenticated;
GRANT ALL ON vat_logs TO service_role;

-- Service role needs full access for invoice API + admin operations
GRANT ALL ON orders TO service_role;
GRANT ALL ON order_items TO service_role;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON spare_parts TO service_role;
GRANT ALL ON vendors TO service_role;

-- Also grant sequences for INSERT
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
