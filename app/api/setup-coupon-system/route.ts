import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Add discount and coupon fields to orders table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION DEFAULT 0,
      ADD COLUMN IF NOT EXISTS coupon_code TEXT,
      ADD COLUMN IF NOT EXISTS coupon_id TEXT;
    `);

    // Create discount_type enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create coupons table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        
        discount_type discount_type NOT NULL,
        discount_value DOUBLE PRECISION NOT NULL,
        
        max_uses INTEGER,
        max_uses_per_user INTEGER DEFAULT 1,
        used_count INTEGER DEFAULT 0,
        
        minimum_order_value DOUBLE PRECISION,
        max_discount DOUBLE PRECISION,
        
        is_active BOOLEAN DEFAULT true,
        valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
        valid_until TIMESTAMP,
        
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
    `);

    // Insert sample coupons
    await prisma.$executeRawUnsafe(`
      INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, minimum_order_value, is_active, valid_until)
      VALUES 
        ('WELCOME10', 'Welcome discount - 10% off your first order', 'PERCENTAGE', 10, NULL, 0, true, NOW() + INTERVAL '30 days'),
        ('SAVE20', 'Save $20 on orders over $100', 'FIXED_AMOUNT', 20, NULL, 100, true, NOW() + INTERVAL '30 days'),
        ('FREESHIP', 'Free shipping on all orders', 'FREE_SHIPPING', 0, NULL, 0, true, NOW() + INTERVAL '30 days'),
        ('VIP50', 'VIP members get 50% off', 'PERCENTAGE', 50, 100, 50, true, NOW() + INTERVAL '7 days')
      ON CONFLICT (code) DO NOTHING;
    `);

    // Create update trigger function
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS trigger_coupons_updated_at ON coupons;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trigger_coupons_updated_at
      BEFORE UPDATE ON coupons
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    return NextResponse.json({
      success: true,
      message: 'Coupon system created successfully! Sample coupons: WELCOME10, SAVE20, FREESHIP, VIP50',
    });
  } catch (error) {
    console.error('Coupon system setup error:', error);
    return NextResponse.json(
      {
        error: 'Failed to setup coupon system',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





