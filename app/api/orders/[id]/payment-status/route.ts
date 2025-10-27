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
    const { paymentStatus } = await request.json();

    // Validate payment status
    const validStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
    if (!validStatuses.includes(paymentStatus)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }

    // Update payment status in order
    const order = await prisma.order.update({
      where: { id },
      data: { 
        paymentStatus,
        updatedAt: new Date(),
      },
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
        customerName: clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.username || 'Customer',
        customerEmail: clerkUser.emailAddresses[0]?.emailAddress || 'N/A',
      });
    } catch (clerkError) {
      console.error('Error fetching customer from Clerk:', clerkError);
      // Return order without customer info if Clerk fetch fails
      return NextResponse.json({
        ...order,
        customerName: 'Customer',
        customerEmail: 'N/A',
      });
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}

