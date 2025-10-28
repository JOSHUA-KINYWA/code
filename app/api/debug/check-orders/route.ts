import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all orders with their payment status
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get all payments
    const payments = await prisma.payment.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        orderId: true,
        amount: true,
        status: true,
        method: true,
        mpesaReceiptNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      orders,
      payments,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}

