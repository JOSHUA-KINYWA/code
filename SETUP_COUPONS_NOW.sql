-- =========================================
-- COUPON SYSTEM SETUP - RUN IN SUPABASE
-- =========================================
-- Copy and paste this entire script into Supabase SQL Editor

-- Step 1: Create discount_type enum
DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add coupon fields to orders table (if not already added)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS coupon_id TEXT;

-- Step 3: Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount Type & Amount
  discount_type discount_type NOT NULL,
  discount_value DOUBLE PRECISION NOT NULL,
  
  -- Usage Limits
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  
  -- Conditions
  minimum_order_value DOUBLE PRECISION,
  max_discount DOUBLE PRECISION,
  
  -- Validity
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);

-- Step 5: Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_coupons_updated_at ON coupons;
CREATE TRIGGER trigger_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Insert 4 sample coupons
INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, minimum_order_value, is_active, valid_until)
VALUES 
  ('WELCOME10', 'Welcome discount - 10% off your first order', 'PERCENTAGE', 10, NULL, 0, true, NOW() + INTERVAL '30 days'),
  ('SAVE20', 'Save $20 on orders over $100', 'FIXED_AMOUNT', 20, NULL, 100, true, NOW() + INTERVAL '30 days'),
  ('FREESHIP', 'Free shipping on all orders', 'FREE_SHIPPING', 0, NULL, 0, true, NOW() + INTERVAL '30 days'),
  ('VIP50', 'VIP members get 50% off', 'PERCENTAGE', 50, 100, 50, true, NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;

-- Step 8: Verify setup
SELECT 
  'Coupon system setup complete!' AS status,
  COUNT(*) AS total_coupons,
  COUNT(*) FILTER (WHERE is_active = true) AS active_coupons
FROM coupons;





