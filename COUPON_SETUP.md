# 🎟️ Coupon System Setup

## ✅ Step 1: Prisma Client (DONE)
Prisma client has been regenerated with the Coupon model!

## 🔧 Step 2: Create Database Tables

**Go to Supabase SQL Editor and run this:**

```sql
-- Add Coupon System to E-Commerce Database

-- 1. Add discount and coupon fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS coupon_id TEXT;

-- 2. Create discount_type enum
DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create coupons table
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

-- 4. Create indexes for coupons table
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

-- 5. Create index on orders.coupon_id
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);

-- 6. Insert sample coupons for testing
INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, minimum_order_value, is_active, valid_until)
VALUES 
  ('WELCOME10', 'Welcome discount - 10% off your first order', 'PERCENTAGE', 10, NULL, 0, true, NOW() + INTERVAL '30 days'),
  ('SAVE20', 'Save $20 on orders over $100', 'FIXED_AMOUNT', 20, NULL, 100, true, NOW() + INTERVAL '30 days'),
  ('FREESHIP', 'Free shipping on all orders', 'FREE_SHIPPING', 0, NULL, 0, true, NOW() + INTERVAL '30 days'),
  ('VIP50', 'VIP members get 50% off', 'PERCENTAGE', 50, 100, 50, true, NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for coupons updated_at
DROP TRIGGER IF EXISTS trigger_coupons_updated_at ON coupons;
CREATE TRIGGER trigger_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Done! Coupon system is ready.
SELECT 'Coupon system created successfully!' AS message;
```

## 📋 What This Creates:

### Sample Coupons:
- `WELCOME10` - 10% off your first order (valid 30 days)
- `SAVE20` - $20 off orders over $100 (valid 30 days)
- `FREESHIP` - Free shipping on all orders (valid 30 days)
- `VIP50` - 50% off for VIP members, max 100 uses (valid 7 days)

## 🧪 Step 3: Test It!

### Test as Customer:
1. Add items to cart
2. Go to checkout
3. Enter coupon code: `WELCOME10`
4. See 10% discount applied!
5. Complete purchase

### Test as Admin:
1. Go to `/admin/coupons`
2. View all coupons
3. See usage statistics
4. Activate/deactivate coupons
5. Delete coupons

## 🎯 Features Available:

### For Customers:
- ✅ Apply coupon codes at checkout
- ✅ Real-time validation
- ✅ See discount breakdown
- ✅ Free shipping indicator
- ✅ Remove applied coupon

### For Admins:
- ✅ View all coupons
- ✅ See usage stats (X used / Y max)
- ✅ Activate/deactivate coupons
- ✅ Delete coupons
- ✅ See expired/maxed out coupons

### Discount Types:
- ✅ **PERCENTAGE** - e.g., 20% off
- ✅ **FIXED_AMOUNT** - e.g., $10 off
- ✅ **FREE_SHIPPING** - No shipping charge

### Smart Validation:
- ✅ Checks if active
- ✅ Validates expiry dates
- ✅ Enforces usage limits
- ✅ Verifies minimum order value
- ✅ Prevents duplicate usage

---

**After running the SQL, your coupon system is ready!** 🎉





