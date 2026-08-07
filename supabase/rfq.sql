-- =============================================
-- RFQ (Request for Quotation) Table
-- SGO-SouqUAE
-- =============================================

CREATE TABLE IF NOT EXISTS rfq_requests (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  -- Vehicle info
  make            TEXT NOT NULL,
  model           TEXT NOT NULL,
  year            INTEGER NOT NULL,
  trim            TEXT,
  -- Part info
  part_name       TEXT NOT NULL,
  part_number     TEXT,
  oem_code        TEXT,
  description     TEXT,
  quantity        INTEGER DEFAULT 1,
  -- Contact
  contact_name    TEXT NOT NULL,
  contact_phone   TEXT NOT NULL,
  contact_email   TEXT,
  emirate         TEXT CHECK (emirate IN ('dubai','abu_dhabi','sharjah','ajman','rak','uaq','fujairah')),
  -- Status
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','quoted','closed','cancelled')),
  urgency         TEXT DEFAULT 'normal' CHECK (urgency IN ('normal','urgent','flexible')),
  -- Images (optional - customer can upload photo of damaged part)
  images          TEXT[] DEFAULT '{}',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RFQ Quotes from vendors
CREATE TABLE IF NOT EXISTS rfq_quotes (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rfq_id          UUID REFERENCES rfq_requests(id) ON DELETE CASCADE NOT NULL,
  vendor_id       UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  price_aed       DECIMAL(10,2) NOT NULL,
  availability    TEXT,
  notes           TEXT,
  valid_until     DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rfq_id, vendor_id)
);

-- Permissions
GRANT ALL ON rfq_requests TO authenticated;
GRANT ALL ON rfq_requests TO service_role;
GRANT ALL ON rfq_quotes TO authenticated;
GRANT ALL ON rfq_quotes TO service_role;

-- RLS
ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_quotes ENABLE ROW LEVEL SECURITY;

-- Customer can manage own RFQs
CREATE POLICY "rfq_customer_own" ON rfq_requests
  FOR ALL USING (customer_id = auth.uid());

-- Anyone can insert (even non-logged in via guest)
CREATE POLICY "rfq_public_insert" ON rfq_requests
  FOR INSERT WITH CHECK (true);

-- Vendors can see all open RFQs
CREATE POLICY "rfq_vendor_select" ON rfq_requests
  FOR SELECT USING (status = 'open');

-- Vendor quotes
CREATE POLICY "rfq_quotes_vendor" ON rfq_quotes
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "rfq_quotes_customer_read" ON rfq_quotes
  FOR SELECT USING (
    rfq_id IN (SELECT id FROM rfq_requests WHERE customer_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rfq_customer ON rfq_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_rfq_status ON rfq_requests(status);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_rfq ON rfq_quotes(rfq_id);
