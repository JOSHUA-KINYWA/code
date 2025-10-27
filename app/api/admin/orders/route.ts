import { NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
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

    // Get all orders with items and user info
    const orders = await prisma.order.findMany({
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
    });

    // Fetch user details from Clerk for each order
    const ordersWithUserInfo = await Promise.all(
      orders.map(async (order) => {
        try {
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(order.userId);
          return {
            ...order,
            user: {
              name: clerkUser.firstName && clerkUser.lastName 
                ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
                : clerkUser.firstName || clerkUser.username || 'Customer',
              email: clerkUser.emailAddresses[0]?.emailAddress || order.userId,
            }
          };
        } catch (error) {
          // If user not found in Clerk, use fallback
          console.warn(`Could not fetch user ${order.userId} from Clerk:`, error);
          return {
            ...order,
            user: {
              name: 'Customer',
              email: order.userId,
            }
          };
        }
      })
    );

    return NextResponse.json(ordersWithUserInfo);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { orderId, status, paymentStatus, trackingNumber } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Send status update email to customer
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(updatedOrder.userId);
      const customerName = clerkUser.fullName || clerkUser.firstName || 'Customer';
      const customerEmail = clerkUser.emailAddresses[0]?.emailAddress || '';

      if (customerEmail && status) {
        await sendOrderStatusUpdateEmail({
          orderNumber: updatedOrder.orderNumber,
          customerName,
          customerEmail,
          total: updatedOrder.total,
          items: updatedOrder.items.map((item: any) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress: {
            street: updatedOrder.shippingAddress,
            city: updatedOrder.shippingCity,
            state: updatedOrder.shippingState,
            zip: updatedOrder.shippingZip,
            country: updatedOrder.shippingCountry,
          },
          paymentMethod: updatedOrder.paymentMethod,
          status: updatedOrder.status,
          newStatus: status,
          trackingNumber: trackingNumber || undefined,
        });
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the update if email fails
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

