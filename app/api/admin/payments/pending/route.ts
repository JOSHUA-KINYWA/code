import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/payments/pending
 * Get all pending payments for admin review
 * Includes orders with PENDING payment status or incomplete payments
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user to check role
    const clerkClientInstance = await clerkClient();
    const user = await clerkClientInstance.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string || 'user';
    
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get filter parameters
    const searchParams = req.nextUrl.searchParams;
    const method = searchParams.get('method'); // mpesa, stripe, all
    const olderThan = searchParams.get('olderThan'); // hours

    // Build where clause
    const where: any = {
      OR: [
        { paymentStatus: 'PENDING' },
        {
          payment: {
            status: 'pending',
          },
        },
      ],
    };

    // Filter by payment method if specified
    if (method && method !== 'all') {
      if (method === 'mpesa') {
        where.payment = {
          ...where.payment,
          checkoutRequestID: { not: null },
        };
      } else if (method === 'stripe') {
        where.payment = {
          ...where.payment,
          stripePaymentIntentId: { not: null },
        };
      }
    }

    // Filter by age if specified
    if (olderThan) {
      const hours = parseInt(olderThan);
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hours);
      
      where.createdAt = {
        lte: cutoffDate,
      };
    }

    // Fetch pending orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        payment: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to 100 most recent
    });

    // Fetch user details from Clerk
    const client = await clerkClient();
    const uniqueUserIds = [...new Set(orders.map(order => order.userId))];
    
    const userDetailsMap = new Map();
    await Promise.all(
      uniqueUserIds.map(async (uid) => {
        try {
          const user = await client.users.getUser(uid);
          const name = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || 'N/A';
          const email = user.emailAddresses[0]?.emailAddress || 'N/A';
          const phone = user.phoneNumbers[0]?.phoneNumber || 'N/A';
          userDetailsMap.set(uid, { name, email, phone });
        } catch (error) {
          console.error(`Failed to fetch user ${uid}:`, error);
          userDetailsMap.set(uid, { name: 'N/A', email: 'N/A', phone: 'N/A' });
        }
      })
    );

    // Map orders with user details and calculate age
    const ordersWithDetails = orders.map(order => {
      const user = userDetailsMap.get(order.userId);
      const ageInHours = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60));
      const ageInMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60));
      
      let paymentMethod = 'UNKNOWN';
      if (order.payment) {
        if (order.payment.checkoutRequestID) paymentMethod = 'M-PESA';
        else if (order.payment.stripePaymentIntentId) paymentMethod = 'STRIPE';
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: user,
        amount: order.total,
        paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        createdAt: order.createdAt,
        ageInHours,
        ageInMinutes,
        isStuck: ageInHours >= 24, // Mark as stuck if older than 24 hours
        isWarning: ageInHours >= 1 && ageInHours < 24, // Warning between 1-24 hours
        payment: order.payment ? {
          id: order.payment.id,
          status: order.payment.status,
          phoneNumber: order.payment.phoneNumber,
          checkoutRequestID: order.payment.checkoutRequestID,
          stripePaymentIntentId: order.payment.stripePaymentIntentId,
          resultCode: order.payment.resultCode,
          resultDesc: order.payment.resultDesc,
          lastUpdated: order.payment.updatedAt,
        } : null,
        items: order.items.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };
    });

    // Calculate summary statistics
    const summary = {
      total: ordersWithDetails.length,
      stuckPayments: ordersWithDetails.filter(o => o.isStuck).length,
      warningPayments: ordersWithDetails.filter(o => o.isWarning).length,
      recentPayments: ordersWithDetails.filter(o => o.ageInHours < 1).length,
      totalAmount: ordersWithDetails.reduce((sum, o) => sum + o.amount, 0),
      byMethod: {
        mpesa: ordersWithDetails.filter(o => o.paymentMethod === 'M-PESA').length,
        stripe: ordersWithDetails.filter(o => o.paymentMethod === 'STRIPE').length,
        unknown: ordersWithDetails.filter(o => o.paymentMethod === 'UNKNOWN').length,
      },
    };

    return NextResponse.json({
      orders: ordersWithDetails,
      summary,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error fetching pending payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending payments', details: error.message },
      { status: 500 }
    );
  }
}

