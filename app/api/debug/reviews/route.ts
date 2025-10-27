import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Debug endpoint to see all reviews for current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all reviews by this user
    const reviews = await prisma.review.findMany({
      where: {
        userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get all paid orders
    const orders = await prisma.order.findMany({
      where: {
        userId,
        paymentStatus: 'PAID',
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      userId,
      reviewsCount: reviews.length,
      reviews: reviews.map(r => ({
        id: r.id,
        productId: r.productId,
        productName: r.product.name,
        rating: r.rating,
        title: r.title,
        createdAt: r.createdAt,
      })),
      ordersCount: orders.length,
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        items: o.items.map(i => ({
          productId: i.productId,
          productName: i.product.name,
        })),
      })),
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}

// DELETE - Clear all reviews for current user (for testing)
export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const deleted = await prisma.review.deleteMany({
      where: {
        userId,
      },
    });

    return NextResponse.json({
      message: `Deleted ${deleted.count} review(s)`,
      count: deleted.count,
    });
  } catch (error) {
    console.error('Error deleting reviews:', error);
    return NextResponse.json(
      { error: 'Failed to delete reviews' },
      { status: 500 }
    );
  }
}





