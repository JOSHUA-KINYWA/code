import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get all products user can review from their orders
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all paid orders for this user
    const orders = await prisma.order.findMany({
      where: {
        userId,
        paymentStatus: 'PAID',
        status: {
          in: ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get all products from orders
    const purchasedProducts = new Map();
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!purchasedProducts.has(item.productId)) {
          purchasedProducts.set(item.productId, {
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images[0] || null,
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
          });
        }
      });
    });

    // Get all existing reviews by this user
    const existingReviews = await prisma.review.findMany({
      where: {
        userId,
      },
      select: {
        productId: true,
      },
    });

    const reviewedProductIds = new Set(existingReviews.map(r => r.productId));

    // Filter to only products that haven't been reviewed
    const reviewableProducts = Array.from(purchasedProducts.values()).filter(
      product => !reviewedProductIds.has(product.productId)
    );

    return NextResponse.json({
      reviewableProducts,
      totalPurchased: purchasedProducts.size,
      totalReviewed: reviewedProductIds.size,
      canReview: reviewableProducts.length,
    });
  } catch (error) {
    console.error('Error fetching reviewable products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviewable products' },
      { status: 500 }
    );
  }
}





