CREATE TABLE IF NOT EXISTS pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON pages TO authenticated;
GRANT ALL ON pages TO service_role;
GRANT SELECT ON pages TO anon;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pages_public_read" ON pages FOR SELECT USING (true);
CREATE POLICY "pages_admin_write" ON pages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO pages (slug, title, content) VALUES
('privacy', 'Privacy Policy', '## Privacy Policy

Last updated: August 2026

### 1. Information We Collect
We collect information you provide directly to us when you create an account, place an order, or contact support:
- Name, email address, and phone number
- Shipping and billing address
- Payment information (processed securely by payment partners)
- Vehicle information saved in My Garage
- Order history and preferences

### 2. How We Use Your Information
- Process and fulfill your orders
- Send order confirmations, invoices, and shipping updates
- Provide customer support
- Comply with UAE legal obligations including VAT reporting to FTA
- Detect and prevent fraud

### 3. Information Sharing
We share your information only as necessary:
- With vendors to fulfill orders (name, phone, shipping address)
- With payment processors to complete transactions
- With UAE government authorities as required by law
- We never sell your personal data to third parties

### 4. Your Rights (UAE PDPL)
Under UAE Federal Decree-Law No. 45 of 2021, you have the right to access, correct, delete, and port your data. Contact us at support@sgosouquae.com

### 5. Contact
Email: support@sgosouquae.com
Address: Dubai, United Arab Emirates'),

('returns', 'Return Policy', '## Return Policy

Last updated: August 2026

### Return Window
Items must be returned within **7 days** of delivery date.

### Eligibility
- Parts must be unused, uninstalled, and in original packaging
- Original invoice or proof of purchase required
- Items damaged due to improper installation are not eligible

### Non-Returnable Items
- Electrical components that have been connected or tested
- Parts that have been installed on a vehicle
- Special order or custom parts
- Clearance items

### Return Process
1. Go to My Orders and find the order
2. Contact the vendor directly through the order page
3. Vendor will provide return instructions
4. Pack item securely in original packaging
5. Drop off at designated courier pickup point

### Refund Timeline
- Vendor inspection: 1-2 business days
- Credit card refunds: 5-7 business days
- COD refunds via bank transfer: 3-5 business days

### Defective or Wrong Items
Contact the vendor within 48 hours. Full replacement or refund provided at no cost. Return shipping covered by vendor.'),

('terms', 'Terms of Service', '## Terms of Service

Last updated: August 2026

### 1. Acceptance
By using SGO-SouqUAE you agree to these Terms and all applicable UAE laws.

### 2. Platform Description
SGO-SouqUAE is a multi-vendor marketplace connecting buyers and sellers of automotive spare parts across the UAE. We are a platform intermediary, not the seller of record.

### 3. User Accounts
- You must be 18 years or older
- Provide accurate and complete information
- Maintain security of your account

### 4. Vendor Obligations
- Hold a valid UAE Trade License
- List only genuine, accurately described products
- Honor all orders placed through the platform
- Issue proper VAT invoices for all transactions

### 5. Pricing & VAT
All prices include 5% VAT as required by UAE Federal Tax Authority (FTA).

### 6. Limitation of Liability
SGO-SouqUAE is not liable for product defects, delivery delays, or incorrect vehicle compatibility. Maximum liability is limited to the value of the specific transaction.

### 7. Governing Law
These Terms are governed by UAE law. Disputes are subject to the courts of Dubai, UAE.

### 8. Contact
Email: support@sgosouquae.com'),

('help', 'Help Center', '## Help Center

### Orders & Checkout

**How do I place an order?**
Browse the catalog, add items to cart, then proceed to checkout. Fill in your shipping address and choose a payment method.

**Can I cancel my order?**
Orders can be cancelled while still in "Pending" status. Once confirmed by the vendor, contact them directly to discuss cancellation.

**How do I track my order?**
Go to My Orders page to see real-time status updates from the vendor.

---

### Payment & VAT

**Are prices inclusive of VAT?**
Yes. All prices include 5% VAT as per UAE Federal Tax Authority regulations.

**What payment methods are accepted?**
Cash on Delivery, Stripe (credit/debit card), Telr, Tabby (pay in 4), and Tamara (pay in 3).

**Can I get a tax invoice?**
Yes. Go to My Orders and click "Download Invoice" for a UAE FTA-compliant tax invoice.

---

### Shipping & Delivery

**Which emirates do you deliver to?**
All 7 Emirates: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain, and Fujairah.

**How long does delivery take?**
1-3 days within the same emirate, 2-5 days cross-emirate.

---

### Returns & Refunds

**What is the return policy?**
Returns accepted within 7 days for unused parts in original packaging.

**How do I get a refund?**
Once vendor approves return, refunds processed within 5-7 business days.

---

### Still Need Help?
Contact us at support@sgosouquae.com')

ON CONFLICT (slug) DO NOTHING;
