import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Check if user can review a product (has purchased but not reviewed)
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { canReview: false, reason: 'not_signed_in' },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json({
        canReview: false,
        reason: 'already_reviewed',
        message: 'You have already reviewed this product',
      });
    }

    // Check if user has purchased this product
    const purchasedOrder = await prisma.order.findFirst({
      where: {
        userId,
        paymentStatus: 'PAID',
        status: {
          in: ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'],
        },
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!purchasedOrder) {
      return NextResponse.json({
        canReview: false,
        reason: 'not_purchased',
        message: 'You can only review products you have purchased',
      });
    }

    // User can review
    return NextResponse.json({
      canReview: true,
      reason: 'eligible',
      message: 'You can write a review for this product',
    });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check review eligibility' },
      { status: 500 }
    );
  }
}





