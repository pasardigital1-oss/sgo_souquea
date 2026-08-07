-- =============================================
-- SGO-SouqUAE Seed Data
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. INSERT VENDORS (linked to admin user)
-- =============================================
INSERT INTO vendors (id, user_id, business_name, business_name_ar, trade_license_no, trade_license_expiry, vat_trn, business_type, emirate, address, commission_rate, status, rating, total_sales)
VALUES
(
  'a1b2c3d4-0001-0001-0001-000000000001'::uuid,
  '3a364d6d-a82b-4211-8cda-6021391a48c7'::uuid,
  'Al Futtaim Auto Parts',
  'الفطيم لقطع السيارات',
  'DED-2024-001234',
  '2026-12-31',
  '100123456700003',
  'distributor',
  'dubai',
  'Al Quoz Industrial Area 3, Dubai, UAE',
  5.00,
  'approved',
  4.80,
  125000.00
),
(
  'a1b2c3d4-0002-0002-0002-000000000002'::uuid,
  '3a364d6d-a82b-4211-8cda-6021391a48c7'::uuid,
  'Arabian Automobiles Parts',
  'الجزيرة العربية لقطع السيارات',
  'DED-2024-005678',
  '2026-10-15',
  '100234567800003',
  'retailer',
  'dubai',
  'Deira, Al Rigga Road, Dubai, UAE',
  5.00,
  'approved',
  4.90,
  89000.00
),
(
  'a1b2c3d4-0003-0003-0003-000000000003'::uuid,
  '3a364d6d-a82b-4211-8cda-6021391a48c7'::uuid,
  'Gulf Auto Supplies',
  'الخليج لمستلزمات السيارات',
  'ADJD-2024-009012',
  '2027-03-20',
  NULL,
  'wholesaler',
  'sharjah',
  'Industrial Area 1, Sharjah, UAE',
  5.00,
  'approved',
  4.60,
  67000.00
),
(
  'a1b2c3d4-0004-0004-0004-000000000004'::uuid,
  '3a364d6d-a82b-4211-8cda-6021391a48c7'::uuid,
  'Dubai Auto Zone',
  'دبي أوتو زون',
  'DED-2024-003456',
  '2026-08-30',
  '100345678900003',
  'retailer',
  'dubai',
  'Al Qusais Industrial Area, Dubai, UAE',
  5.00,
  'approved',
  4.70,
  43000.00
),
(
  'a1b2c3d4-0005-0005-0005-000000000005'::uuid,
  '3a364d6d-a82b-4211-8cda-6021391a48c7'::uuid,
  'Emirates Parts Trading',
  'الإمارات لتجارة قطع الغيار',
  'ADDED-2024-007890',
  '2027-01-15',
  '100456789000003',
  'distributor',
  'abu_dhabi',
  'Mussafah Industrial Area, Abu Dhabi, UAE',
  5.00,
  'approved',
  4.50,
  95000.00
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. INSERT SPARE PARTS
-- =============================================
INSERT INTO spare_parts (id, vendor_id, category_id, part_number, oem_code, name, name_ar, description, brand, part_type, condition, weight_kg, warranty_months, is_active, is_featured)
VALUES
-- Engine Parts
(
  'p0000001-0000-0000-0000-000000000001'::uuid,
  'a1b2c3d4-0001-0001-0001-000000000001'::uuid,
  1, '15208-31U0B', '15208-31U0B',
  'Oil Filter - Nissan Patrol V8 5.6L',
  'فلتر زيت - نيسان باترول V8',
  'Genuine OEM oil filter for Nissan Patrol Y62 with 5.6L V8 engine. Ensures clean engine oil and extends engine life.',
  'Nissan OEM', 'oem', 'new', 0.35, 12, true, true
),
(
  'p0000002-0000-0000-0000-000000000002'::uuid,
  'a1b2c3d4-0002-0002-0002-000000000002'::uuid,
  5, '04152-YZZA6', '04152-YZZA6',
  'Engine Oil Filter - Toyota Land Cruiser 200',
  'فلتر زيت المحرك - تويوتا لاند كروزر 200',
  'Genuine Toyota oil filter for Land Cruiser 200 Series with 4.6L/5.7L V8 engine.',
  'Toyota OEM', 'oem', 'new', 0.40, 12, true, true
),
(
  'p0000003-0000-0000-0000-000000000003'::uuid,
  'a1b2c3d4-0003-0003-0003-000000000003'::uuid,
  5, 'MR571476', 'MR571476',
  'Air Filter - Mitsubishi Pajero 3.8L',
  'فلتر هواء - ميتسوبيشي باجيرو',
  'High quality air filter for Mitsubishi Pajero V93/V97 with 3.8L engine. Bosch aftermarket replacement.',
  'Bosch', 'aftermarket', 'new', 0.28, 12, true, true
),
(
  'p0000004-0000-0000-0000-000000000004'::uuid,
  'a1b2c3d4-0004-0004-0004-000000000004'::uuid,
  4, '12290-R40-L01', '12290-R40-L01',
  'Iridium Spark Plug Set (4pcs) - Honda Accord',
  'طقم بواجي إيريديوم - هوندا أكورد',
  'NGK Iridium spark plug set for Honda Accord 2.4L engine. Provides better fuel efficiency and engine performance.',
  'NGK', 'aftermarket', 'new', 0.15, 24, true, true
),
-- Brake Parts
(
  'p0000005-0000-0000-0000-000000000005'::uuid,
  'a1b2c3d4-0002-0002-0002-000000000002'::uuid,
  2, '04465-60080', '04465-60080',
  'Front Brake Pad Set - Toyota Land Cruiser 200',
  'طقم تيل فرامل أمامية - تويوتا لاند كروزر 200',
  'Genuine Toyota front brake pads for Land Cruiser 200 Series. Superior stopping power for UAE road conditions.',
  'Toyota OEM', 'oem', 'new', 1.20, 6, true, true
),
(
  'p0000006-0000-0000-0000-000000000006'::uuid,
  'a1b2c3d4-0001-0001-0001-000000000001'::uuid,
  2, 'D1060-1LA0A', 'D1060-1LA0A',
  'Front Brake Pad Set - Nissan Patrol Y62',
  'طقم تيل فرامل أمامية - نيسان باترول Y62',
  'OEM front brake pads for Nissan Patrol Y62. Designed for heavy duty use in UAE desert conditions.',
  'Nissan OEM', 'oem', 'new', 1.35, 6, true, false
),
(
  'p0000007-0000-0000-0000-000000000007'::uuid,
  'a1b2c3d4-0003-0003-0003-000000000003'::uuid,
  2, 'GDB1234', NULL,
  'Front Brake Pad Set - Toyota Camry 2018-2024',
  'طقم تيل فرامل أمامية - تويوتا كامري',
  'Brembo high performance front brake pads compatible with Toyota Camry 2018-2024.',
  'Brembo', 'aftermarket', 'new', 0.95, 12, true, false
),
-- Suspension
(
  'p0000008-0000-0000-0000-000000000008'::uuid,
  'a1b2c3d4-0005-0005-0005-000000000005'::uuid,
  3, '48510-60F00', '48510-60F00',
  'Front Shock Absorber - Toyota Land Cruiser Prado',
  'ماص صدمات أمامي - تويوتا برادو',
  'KYB front shock absorber for Toyota Land Cruiser Prado 150 Series. Enhanced performance for rough terrain.',
  'KYB', 'aftermarket', 'new', 3.50, 12, true, true
),
(
  'p0000009-0000-0000-0000-000000000009'::uuid,
  'a1b2c3d4-0005-0005-0005-000000000005'::uuid,
  3, '56110-ZL10A', '56110-ZL10A',
  'Front Stabilizer Bar Link - Nissan Patrol Y62',
  'رابط الماص الأمامي - نيسان باترول Y62',
  'OEM front stabilizer bar link for Nissan Patrol Y62 2010-2023. Reduces body roll and improves handling.',
  'Nissan OEM', 'oem', 'new', 0.85, 12, true, false
),
-- Electrical
(
  'p0000010-0000-0000-0000-000000000010'::uuid,
  'a1b2c3d4-0004-0004-0004-000000000004'::uuid,
  4, '28890-0C020', '28890-0C020',
  'Alternator - Toyota Hilux / Fortuner 2.7L',
  'دينمو - تويوتا هايلكس وفورتشنر',
  'Bosch remanufactured alternator for Toyota Hilux and Fortuner 2.7L petrol engine. 130A output.',
  'Bosch', 'remanufactured', 'refurbished', 5.20, 6, true, false
),
-- Filters
(
  'p0000011-0000-0000-0000-000000000011'::uuid,
  'a1b2c3d4-0001-0001-0001-000000000001'::uuid,
  5, '17801-50060', '17801-50060',
  'Air Filter - Toyota Land Cruiser 4.5L/4.7L V8',
  'فلتر هواء - تويوتا لاند كروزر',
  'Genuine Toyota air filter for Land Cruiser 100 Series with 4.5L and 4.7L V8 engines.',
  'Toyota OEM', 'oem', 'new', 0.32, 12, true, false
),
(
  'p0000012-0000-0000-0000-000000000012'::uuid,
  'a1b2c3d4-0003-0003-0003-000000000003'::uuid,
  5, 'W7015', NULL,
  'Fuel Filter - Mitsubishi Pajero 3.2L Diesel',
  'فلتر وقود - ميتسوبيشي باجيرو ديزل',
  'Mann fuel filter for Mitsubishi Pajero V87/V97 with 3.2L DID diesel engine.',
  'Mann-Filter', 'aftermarket', 'new', 0.42, 12, true, false
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. INSERT INVENTORY (prices in AED incl. VAT)
-- =============================================
INSERT INTO inventory (id, part_id, vendor_id, emirate, quantity, reserved_qty, price_aed, sku, low_stock_alert)
VALUES
('i0000001'::uuid, 'p0000001-0000-0000-0000-000000000001'::uuid, 'a1b2c3d4-0001-0001-0001-000000000001'::uuid, 'dubai', 45, 0, 85.00, 'ALF-OIL-001', 5),
('i0000002'::uuid, 'p0000002-0000-0000-0000-000000000002'::uuid, 'a1b2c3d4-0002-0002-0002-000000000002'::uuid, 'dubai', 32, 0, 95.00, 'ARA-OIL-002', 5),
('i0000003'::uuid, 'p0000003-0000-0000-0000-000000000003'::uuid, 'a1b2c3d4-0003-0003-0003-000000000003'::uuid, 'sharjah', 28, 0, 65.00, 'GUL-AIR-003', 5),
('i0000004'::uuid, 'p0000004-0000-0000-0000-000000000004'::uuid, 'a1b2c3d4-0004-0004-0004-000000000004'::uuid, 'dubai', 60, 0, 120.00, 'DAZ-SPK-004', 10),
('i0000005'::uuid, 'p0000005-0000-0000-0000-000000000005'::uuid, 'a1b2c3d4-0002-0002-0002-000000000002'::uuid, 'dubai', 18, 0, 245.00, 'ARA-BRK-005', 5),
('i0000006'::uuid, 'p0000006-0000-0000-0000-000000000006'::uuid, 'a1b2c3d4-0001-0001-0001-000000000001'::uuid, 'dubai', 22, 0, 285.00, 'ALF-BRK-006', 5),
('i0000007'::uuid, 'p0000007-0000-0000-0000-000000000007'::uuid, 'a1b2c3d4-0003-0003-0003-000000000003'::uuid, 'sharjah', 35, 0, 145.00, 'GUL-BRK-007', 5),
('i0000008'::uuid, 'p0000008-0000-0000-0000-000000000008'::uuid, 'a1b2c3d4-0005-0005-0005-000000000005'::uuid, 'abu_dhabi', 12, 0, 385.00, 'EPT-SUS-008', 3),
('i0000009'::uuid, 'p0000009-0000-0000-0000-000000000009'::uuid, 'a1b2c3d4-0005-0005-0005-000000000005'::uuid, 'abu_dhabi', 25, 0, 165.00, 'EPT-SUS-009', 5),
('i0000010'::uuid, 'p0000010-0000-0000-0000-000000000010'::uuid, 'a1b2c3d4-0004-0004-0004-000000000004'::uuid, 'dubai', 8, 0, 650.00, 'DAZ-ELC-010', 3),
('i0000011'::uuid, 'p0000011-0000-0000-0000-000000000011'::uuid, 'a1b2c3d4-0001-0001-0001-000000000001'::uuid, 'dubai', 40, 0, 75.00, 'ALF-AIR-011', 5),
('i0000012'::uuid, 'p0000012-0000-0000-0000-000000000012'::uuid, 'a1b2c3d4-0003-0003-0003-000000000003'::uuid, 'sharjah', 30, 0, 55.00, 'GUL-FUL-012', 5)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. INSERT PART COMPATIBILITY
-- =============================================
INSERT INTO part_compatibility (part_id, make_id, model_id, year_from, year_to)
VALUES
('p0000001-0000-0000-0000-000000000001'::uuid, 2, 6, 2010, 2023),
('p0000002-0000-0000-0000-000000000002'::uuid, 1, 1, 2008, 2021),
('p0000003-0000-0000-0000-000000000003'::uuid, 3, 9, 2007, 2023),
('p0000004-0000-0000-0000-000000000004'::uuid, 4, 11, 2013, 2022),
('p0000005-0000-0000-0000-000000000005'::uuid, 1, 1, 2008, 2021),
('p0000006-0000-0000-0000-000000000006'::uuid, 2, 6, 2010, 2023),
('p0000007-0000-0000-0000-000000000007'::uuid, 1, 2, 2018, 2024),
('p0000008-0000-0000-0000-000000000008'::uuid, 1, 5, 2009, 2023),
('p0000009-0000-0000-0000-000000000009'::uuid, 2, 6, 2010, 2023),
('p0000011-0000-0000-0000-000000000011'::uuid, 1, 1, 1998, 2007),
('p0000012-0000-0000-0000-000000000012'::uuid, 3, 9, 2007, 2023)
ON CONFLICT (part_id, model_id) DO NOTHING;
