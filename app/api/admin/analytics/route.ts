import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || 'all'; // all, today, week, month, year

    // Calculate date range
    const now = new Date();
    let startDate: Date | undefined;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: {
        ...(startDate && { createdAt: { gte: startDate } }),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate comprehensive metrics
    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const previousPeriodRevenue = 0; // Would need historical data for comparison
    
    const revenueGrowth = previousPeriodRevenue > 0 
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    // Order stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'PROCESSING').length;
    const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED').length;
    const shippedOrders = orders.filter(o => o.status === 'SHIPPED').length;
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

    // Financial metrics
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalTax = paidOrders.reduce((sum, order) => sum + order.tax, 0);
    const totalShipping = paidOrders.reduce((sum, order) => sum + order.shipping, 0);
    const totalDiscounts = paidOrders.reduce((sum, order) => sum + (order.discount || 0), 0);

    // Product sales analysis
    const productSales = new Map<string, any>();
    let totalProductsSold = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        totalProductsSold += item.quantity;
        const existing = productSales.get(item.product.id);
        if (existing) {
          existing.totalSold += item.quantity;
          existing.revenue += item.price * item.quantity;
          existing.orders += 1;
        } else {
          productSales.set(item.product.id, {
            id: item.product.id,
            name: item.product.name,
            category: item.product.category,
            images: item.product.images,
            totalSold: item.quantity,
            revenue: item.price * item.quantity,
            orders: 1,
            price: item.price,
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    // Category analysis
    const categoryStats = new Map<string, { revenue: number; orders: number; products: number }>();
    
    productSales.forEach(product => {
      const existing = categoryStats.get(product.category);
      if (existing) {
        existing.revenue += product.revenue;
        existing.orders += product.orders;
        existing.products += 1;
      } else {
        categoryStats.set(product.category, {
          revenue: product.revenue,
          orders: product.orders,
          products: 1,
        });
      }
    });

    const topCategories = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Customer metrics
    const uniqueCustomers = new Set(orders.map(o => o.userId)).size;
    const repeatingCustomers = orders.reduce((count, order, _, arr) => {
      const customerOrders = arr.filter(o => o.userId === order.userId).length;
      return customerOrders > 1 ? count + 1 : count;
    }, 0);
    const customerRetentionRate = uniqueCustomers > 0 ? (repeatingCustomers / uniqueCustomers) * 100 : 0;

    // Payment methods distribution
    const paymentMethods = orders.reduce((acc: any, order) => {
      const method = order.paymentMethod;
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    // Sales by day (for chart)
    const salesByDay = paidOrders.reduce((acc: any, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { revenue: 0, orders: 0 };
      }
      acc[date].revenue += order.total;
      acc[date].orders += 1;
      return acc;
    }, {});

    const chartData = Object.entries(salesByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30) // Last 30 days
      .map(([date, data]: any) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }));

    // Conversion rate (would need to track visitors for accurate rate)
    const conversionRate = 0; // Placeholder - would need analytics integration

    return NextResponse.json(
      {
        overview: {
          totalRevenue,
          revenueGrowth,
          totalOrders,
          averageOrderValue,
          totalProductsSold,
          uniqueCustomers,
          customerRetentionRate,
          conversionRate,
        },
        orderStats: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        financial: {
          totalTax,
          totalShipping,
          totalDiscounts,
          netRevenue: totalRevenue - totalTax - totalShipping,
        },
        products: {
          topByRevenue: topProducts,
          topBySales: topSellingProducts,
        },
        categories: topCategories,
        paymentMethods,
        chartData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}





