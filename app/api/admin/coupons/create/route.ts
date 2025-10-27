import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string;

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderValue,
      maxDiscount,
      maxUses,
      maxUsesPerUser,
      validUntil,
    } = body;

    // Validate required fields
    if (!code || !discountType) {
      return NextResponse.json(
        { error: 'Code and discount type are required' },
        { status: 400 }
      );
    }

    if (discountType !== 'FREE_SHIPPING' && (discountValue === undefined || discountValue === null)) {
      return NextResponse.json(
        { error: 'Discount value is required for this discount type' },
        { status: 400 }
      );
    }

    // Check if coupon code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A coupon with this code already exists' },
        { status: 400 }
      );
    }

    // Create the coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        minimumOrderValue: minimumOrderValue ? parseFloat(minimumOrderValue) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser) : 1,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('[Coupon Create Error]', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

