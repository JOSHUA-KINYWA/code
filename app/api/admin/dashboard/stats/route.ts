import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await currentUser();
    const userRole = user?.publicMetadata?.role as string || 'user';

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch real statistics
    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      recentOrders
    ] = await Promise.all([
      // Total orders count
      prisma.order.count(),
      
      // Total revenue (sum of all order totals)
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
      }),
      
      // Total products count
      prisma.product.count(),
      
      // Total unique customers (count unique userIds in orders)
      prisma.order.findMany({
        select: { userId: true },
        distinct: ['userId'],
      }).then(orders => orders.length),
      
      // Recent 5 orders
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
    ]);

    // Fetch customer names for recent orders
    const recentOrdersWithCustomers = await Promise.all(
      recentOrders.map(async (order) => {
        try {
          const { clerkClient } = await import('@clerk/nextjs/server');
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(order.userId);
          
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: clerkUser.firstName && clerkUser.lastName 
              ? `${clerkUser.firstName} ${clerkUser.lastName}` 
              : clerkUser.username || 'Customer',
            customerEmail: clerkUser.emailAddresses[0]?.emailAddress || 'N/A',
            createdAt: order.createdAt,
            status: order.status,
            paymentStatus: order.paymentStatus,
            total: order.total,
          };
        } catch (error) {
          console.error(`Error fetching customer for order ${order.id}:`, error);
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: 'Customer',
            customerEmail: 'N/A',
            createdAt: order.createdAt,
            status: order.status,
            paymentStatus: order.paymentStatus,
            total: order.total,
          };
        }
      })
    );

    return NextResponse.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalProducts,
      totalCustomers,
      recentOrders: recentOrdersWithCustomers,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}





