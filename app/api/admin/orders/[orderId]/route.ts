import { NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
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

    const { orderId } = await params;

    // Get order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch user details from Clerk
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(order.userId);
      const orderWithUserInfo = {
        ...order,
        user: {
          name: clerkUser.firstName && clerkUser.lastName 
            ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
            : clerkUser.firstName || clerkUser.username || 'Customer',
          email: clerkUser.emailAddresses[0]?.emailAddress || order.userId,
        }
      };
      return NextResponse.json(orderWithUserInfo);
    } catch (error) {
      // If user not found in Clerk, return order without user info
      console.warn(`Could not fetch user ${order.userId} from Clerk:`, error);
      return NextResponse.json({
        ...order,
        user: {
          name: 'Customer',
          email: order.userId,
        }
      });
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

