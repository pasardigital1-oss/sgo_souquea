-- =============================================
-- Fix RLS Issues - SGO-SouqUAE
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. CRITICAL: Enable RLS on payment_settings
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if any
DROP POLICY IF EXISTS "payment_settings_all" ON payment_settings;
DROP POLICY IF EXISTS "payment_settings_public" ON payment_settings;

-- Only admin can read/write payment_settings
CREATE POLICY "payment_settings_admin_only" ON payment_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customer/checkout needs to read enabled gateways (but NOT secret keys)
-- Create a view that exposes only safe columns
CREATE OR REPLACE VIEW payment_settings_public AS
  SELECT gateway, is_enabled, is_sandbox
  FROM payment_settings;

GRANT SELECT ON payment_settings_public TO authenticated;
GRANT SELECT ON payment_settings_public TO anon;

-- 2. Fix Auth RLS Initialization Plan warnings
-- These happen when policies call auth.uid() without optimization
-- Fix by using (SELECT auth.uid()) instead of auth.uid()

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- Allow admin to read all profiles
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- spare_parts
DROP POLICY IF EXISTS "parts_select_public" ON spare_parts;
DROP POLICY IF EXISTS "parts_vendor_manage" ON spare_parts;

CREATE POLICY "parts_select_public" ON spare_parts
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "parts_vendor_manage" ON spare_parts
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = (SELECT auth.uid()))
  );

-- inventory
DROP POLICY IF EXISTS "inventory_select_public" ON inventory;
DROP POLICY IF EXISTS "inventory_vendor_manage" ON inventory;

CREATE POLICY "inventory_select_public" ON inventory
  FOR SELECT USING (TRUE);
CREATE POLICY "inventory_vendor_manage" ON inventory
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = (SELECT auth.uid()))
  );

-- orders
DROP POLICY IF EXISTS "orders_customer_select" ON orders;
DROP POLICY IF EXISTS "orders_vendor_select" ON orders;
DROP POLICY IF EXISTS "orders_customer_insert" ON orders;

CREATE POLICY "orders_customer_select" ON orders
  FOR SELECT USING (customer_id = (SELECT auth.uid()));
CREATE POLICY "orders_vendor_select" ON orders
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = (SELECT auth.uid()))
  );
CREATE POLICY "orders_customer_insert" ON orders
  FOR INSERT WITH CHECK (customer_id = (SELECT auth.uid()));

-- Admin can see all orders
CREATE POLICY "orders_admin_select" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );
CREATE POLICY "orders_admin_update" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- cart_items
DROP POLICY IF EXISTS "cart_own" ON cart_items;

CREATE POLICY "cart_own" ON cart_items
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- reviews
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
DROP POLICY IF EXISTS "reviews_customer_insert" ON reviews;

CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "reviews_customer_insert" ON reviews
  FOR INSERT WITH CHECK (customer_id = (SELECT auth.uid()));

-- vendors
DROP POLICY IF EXISTS "vendors_select_public" ON vendors;
DROP POLICY IF EXISTS "vendors_select_own" ON vendors;
DROP POLICY IF EXISTS "vendors_insert_own" ON vendors;
DROP POLICY IF EXISTS "vendors_update_own" ON vendors;

CREATE POLICY "vendors_select_public" ON vendors
  FOR SELECT USING (status = 'approved');
CREATE POLICY "vendors_select_own" ON vendors
  FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "vendors_insert_own" ON vendors
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "vendors_update_own" ON vendors
  FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "vendors_admin_all" ON vendors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );
