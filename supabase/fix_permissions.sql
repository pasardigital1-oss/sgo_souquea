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

-- Also grant sequences for INSERT
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
