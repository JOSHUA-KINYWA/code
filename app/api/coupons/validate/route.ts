import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, subtotal } = await req.json();

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json(
        { error: 'Coupon code and subtotal are required' },
        { status: 400 }
      );
    }

    // Find the coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code', valid: false },
        { status: 400 }
      );
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: 'This coupon is no longer active', valid: false },
        { status: 400 }
      );
    }

    // Check validity dates
    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return NextResponse.json(
        { error: 'This coupon is not yet valid', valid: false },
        { status: 400 }
      );
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return NextResponse.json(
        { error: 'This coupon has expired', valid: false },
        { status: 400 }
      );
    }

    // Check usage limits
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: 'This coupon has reached its usage limit', valid: false },
        { status: 400 }
      );
    }

    // Check per-user usage limit
    if (coupon.maxUsesPerUser) {
      const userUsageCount = await prisma.order.count({
        where: {
          userId,
          couponId: coupon.id,
        },
      });

      if (userUsageCount >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          { error: 'You have already used this coupon the maximum number of times', valid: false },
          { status: 400 }
        );
      }
    }

    // Check minimum order value
    if (coupon.minimumOrderValue && subtotal < coupon.minimumOrderValue) {
      return NextResponse.json(
        {
          error: `Minimum order value of $${coupon.minimumOrderValue.toFixed(2)} required`,
          valid: false,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    let freeShipping = false;

    switch (coupon.discountType) {
      case 'PERCENTAGE':
        discountAmount = (subtotal * coupon.discountValue) / 100;
        // Apply max discount cap if set
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
        break;

      case 'FIXED_AMOUNT':
        discountAmount = coupon.discountValue;
        // Discount cannot exceed subtotal
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
        break;

      case 'FREE_SHIPPING':
        freeShipping = true;
        discountAmount = 0; // Shipping discount will be handled separately
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid coupon type', valid: false },
          { status: 400 }
        );
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Number(discountAmount.toFixed(2)),
        freeShipping,
      },
    });
  } catch (error) {
    console.error('[Coupon Validation Error]', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon', valid: false },
      { status: 500 }
    );
  }
}





