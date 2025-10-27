import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/payments/auto-cancel
 * Automatically cancel orders with pending payments older than 24 hours
 * This should be called by a cron job or manually by admin
 * 
 * Security: Protected by API key or admin auth
 */
export async function POST(req: NextRequest) {
  try {
    // Check for API key or admin auth
    const apiKey = req.headers.get('x-api-key');
    const authHeader = req.headers.get('authorization');
    
    // Allow both API key (for cron jobs) and Bearer token (for admin manual trigger)
    if (apiKey !== process.env.CRON_SECRET && !authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If using bearer token, verify it's an admin
    if (authHeader && !apiKey) {
      const { auth, clerkClient: getClient } = await import('@clerk/nextjs/server');
      const { userId } = await auth();
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const client = await getClient();
      const user = await client.users.getUser(userId);
      const userRole = user.publicMetadata?.role as string || 'user';
      
      if (userRole !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    // Calculate cutoff time (24 hours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    // Find pending orders older than 24 hours
    const expiredOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        createdAt: {
          lte: cutoffTime,
        },
        status: {
          not: 'CANCELLED', // Don't process already cancelled orders
        },
      },
      include: {
        payment: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (expiredOrders.length === 0) {
      return NextResponse.json({
        message: 'No expired orders found',
        cancelled: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const cancelledOrders = [];
    const errors = [];

    // Process each expired order
    for (const order of expiredOrders) {
      try {
        // Update order status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            cancelledAt: new Date(),
            cancellationReason: 'Payment timeout - automatically cancelled after 24 hours',
          },
        });

        // Update payment status if exists
        if (order.payment) {
          await prisma.payment.update({
            where: { id: order.payment.id },
            data: {
              status: 'failed',
              resultDesc: 'Payment timeout - order cancelled',
            },
          });

          // Log the auto-cancellation
          await prisma.paymentLog.create({
            data: {
              orderId: order.id,
              paymentId: order.payment.id,
              action: 'AUTO_CANCELLED',
              status: 'SUCCESS',
              method: order.payment.stripePaymentIntentId ? 'STRIPE' : 'MPESA',
              initiatedBy: 'SYSTEM',
              initiatorRole: 'SYSTEM',
              previousStatus: order.paymentStatus,
              newStatus: 'FAILED',
              details: JSON.stringify({
                orderNumber: order.orderNumber,
                amount: order.total,
                ageInHours: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)),
                reason: 'Payment timeout - 24 hours expired',
              }),
            },
          });
        }

        // Restore product stock
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        cancelledOrders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.total,
          createdAt: order.createdAt,
          ageInHours: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)),
        });

      } catch (error: any) {
        console.error(`Failed to cancel order ${order.id}:`, error);
        errors.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: `Successfully cancelled ${cancelledOrders.length} expired orders`,
      cancelled: cancelledOrders.length,
      failed: errors.length,
      details: {
        cancelledOrders,
        errors: errors.length > 0 ? errors : undefined,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Auto-cancel error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-cancel orders', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/auto-cancel
 * Preview orders that would be cancelled (dry run)
 */
export async function GET(req: NextRequest) {
  try {
    // Check for API key or admin auth
    const apiKey = req.headers.get('x-api-key');
    
    if (apiKey !== process.env.CRON_SECRET) {
      const { auth, clerkClient: getClient } = await import('@clerk/nextjs/server');
      const { userId } = await auth();
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const client = await getClient();
      const user = await client.users.getUser(userId);
      const userRole = user.publicMetadata?.role as string || 'user';
      
      if (userRole !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    // Calculate cutoff time (24 hours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    // Find pending orders older than 24 hours
    const expiredOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        createdAt: {
          lte: cutoffTime,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        createdAt: true,
        paymentMethod: true,
      },
    });

    const ordersList = expiredOrders.map(order => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      ageInHours: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)),
    }));

    return NextResponse.json({
      message: 'Preview of orders that would be cancelled',
      count: expiredOrders.length,
      totalAmount: expiredOrders.reduce((sum, order) => sum + order.total, 0),
      orders: ordersList,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Auto-cancel preview error:', error);
    return NextResponse.json(
      { error: 'Failed to preview auto-cancel', details: error.message },
      { status: 500 }
    );
  }
}

