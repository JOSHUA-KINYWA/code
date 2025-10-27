import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/invoice';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch order with all details
    const order = await prisma.order.findUnique({
      where: { id },
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

    // Get Clerk client once at the beginning
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    
    // Check if user owns this order (or is admin)
    let isAdmin = false;
    if (order.userId !== userId) {
      // Check if user is admin
      const user = await client.users.getUser(userId);
      const userRole = user.publicMetadata?.role as string;

      if (userRole !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      isAdmin = true;
    }

    // Only allow invoice download for PAID orders with specific statuses
    // Admin can download any invoice, but users need PAID status
    if (!isAdmin) {
      if (order.paymentStatus !== 'PAID') {
        return NextResponse.json(
          { error: 'Invoice not available. Order must be paid.' },
          { status: 400 }
        );
      }

      // Only allow invoice for orders that are at least PROCESSING or higher
      const allowedStatuses = ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
      if (!allowedStatuses.includes(order.status)) {
        return NextResponse.json(
          { error: 'Invoice not available. Order must be confirmed or shipped.' },
          { status: 400 }
        );
      }
    }

    // Get user name from Clerk
    const clerkUser = await client.users.getUser(order.userId);
    const userName = clerkUser.firstName && clerkUser.lastName 
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || 'Guest';

    // Generate PDF
    const pdf = generateInvoicePDF({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount || 0,
      couponCode: order.couponCode || undefined,
      paymentMethod: order.paymentMethod,
      status: order.status,
      shippingAddress: order.shippingAddress,
      user: {
        name: userName,
        email: clerkUser.emailAddresses[0]?.emailAddress || order.user.email,
      },
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          name: item.product.name,
        },
      })),
    });

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

