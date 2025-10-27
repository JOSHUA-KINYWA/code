import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using Clerk metadata
    const user = await currentUser();
    const userRole = user?.publicMetadata?.role as string || 'user';

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Await params in Next.js 15+
    const { id } = await params;
    const { status, completePayment } = await request.json();

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if order is already cancelled
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { 
        status: true,
        cancelledAt: true,
        cancellationReason: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prevent updating cancelled orders
    if (existingOrder.status === 'CANCELLED' || existingOrder.cancelledAt) {
      return NextResponse.json({ 
        error: 'Cannot update a cancelled order',
        message: `This order was cancelled${existingOrder.cancellationReason ? `: ${existingOrder.cancellationReason}` : ''}`,
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = { 
      status,
      updatedAt: new Date(),
    };

    // If completePayment is true, also update payment status
    if (completePayment) {
      updateData.paymentStatus = 'PAID';
    }

    // Update order status (and payment status if needed)
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Fetch customer info from Clerk
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(order.userId);
      
      return NextResponse.json({
        ...order,
        user: {
          name: clerkUser.firstName && clerkUser.lastName 
            ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
            : clerkUser.firstName || clerkUser.username || 'Customer',
          email: clerkUser.emailAddresses[0]?.emailAddress || order.userId,
        }
      });
    } catch (error) {
      // If user not found, return order with placeholder
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
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

