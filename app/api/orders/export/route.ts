import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { generateOrdersCSV } from '@/lib/invoice';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isAdmin = searchParams.get('admin') === 'true';

    let orders;

    if (isAdmin) {
      // Check if user is admin
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const userRole = user.publicMetadata?.role as string;

      if (userRole !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Admin: Export all orders (with optional date filter)
      const where: any = {};
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      orders = await prisma.order.findMany({
        where,
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
    } else {
      // User: Export only their orders
      const where: any = { userId };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      orders = await prisma.order.findMany({
        where,
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
    }

    // Fetch user details from Clerk for all orders
    const client = await clerkClient();
    const uniqueUserIds = [...new Set(orders.map((order: any) => order.userId))];
    
    // Fetch all users in parallel
    const userDetailsMap = new Map();
    await Promise.all(
      uniqueUserIds.map(async (uid) => {
        try {
          const user = await client.users.getUser(uid);
          const name = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || 'N/A';
          const email = user.emailAddresses[0]?.emailAddress || 'N/A';
          userDetailsMap.set(uid, { name, email });
        } catch (error) {
          console.error(`Failed to fetch user ${uid}:`, error);
          userDetailsMap.set(uid, { name: 'N/A', email: 'N/A' });
        }
      })
    );

    // Map orders with user details
    const ordersWithUsers = orders.map((order: any) => ({
      ...order,
      user: userDetailsMap.get(order.userId) || { name: 'N/A', email: 'N/A' },
    }));

    // Generate CSV
    const csv = generateOrdersCSV(ordersWithUsers);

    // Return CSV as download
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    );
  }
}

