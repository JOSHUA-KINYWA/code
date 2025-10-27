import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { sendOrderCancellationEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Validate reason
    if (!reason || reason.trim() === '') {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    // Fetch the order with payment details
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
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

    // Verify ownership
    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to cancel this order' }, { status: 403 });
    }

    // Check if order is already cancelled
    if (order.cancelledAt) {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
    }

    // Only allow cancellation for PENDING or PROCESSING orders
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      return NextResponse.json({ 
        error: `Cannot cancel orders with status: ${order.status}. Only PENDING or PROCESSING orders can be cancelled.` 
      }, { status: 400 });
    }

    // Restore stock for cancelled items
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    let refundStatus = 'N/A';
    let refundDetails = null;

    // Process refund if payment was completed
    if (order.paymentStatus === 'PAID' && order.payment) {
      if (order.paymentMethod === 'M-Pesa') {
        // For M-Pesa, we log the refund request
        // In production, you would integrate with M-Pesa B2C API
        refundStatus = 'REFUND_REQUESTED';
        refundDetails = {
          method: 'M-Pesa',
          amount: order.total,
          mpesaReceiptNumber: order.payment.mpesaReceiptNumber,
          message: 'Refund request logged. Customer will receive refund within 3-5 business days.',
        };

        // Update payment record
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: {
            refundStatus: 'PENDING',
            refundInitiatedAt: new Date(),
          },
        });

        console.log('[M-Pesa Refund Request]', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.total,
          mpesaReceiptNumber: order.payment.mpesaReceiptNumber,
          phoneNumber: order.payment.phoneNumber,
        });
      } else if (order.paymentMethod === 'Stripe' && order.payment.stripePaymentIntentId) {
        // Process Stripe refund
        try {
          const refund = await stripe.refunds.create({
            payment_intent: order.payment.stripePaymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              cancellationReason: reason,
            },
          });

          refundStatus = 'REFUNDED';
          refundDetails = {
            method: 'Stripe',
            amount: order.total,
            refundId: refund.id,
            status: refund.status,
            message: 'Refund processed successfully. Funds will appear in your account within 5-10 business days.',
          };

          // Update payment record
          await prisma.payment.update({
            where: { id: order.payment.id },
            data: {
              refundStatus: 'COMPLETED',
              refundInitiatedAt: new Date(),
              refundCompletedAt: new Date(),
              stripeRefundId: refund.id,
            },
          });

          console.log('[Stripe Refund Success]', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            refundId: refund.id,
            amount: order.total,
          });
        } catch (stripeError) {
          console.error('[Stripe Refund Error]', stripeError);
          refundStatus = 'REFUND_FAILED';
          refundDetails = {
            method: 'Stripe',
            error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
            message: 'Refund failed. Please contact support.',
          };
        }
      }
    }

    // Update order status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: {
        payment: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Send cancellation email notification
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const customerName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Customer';
      const customerEmail = clerkUser.emailAddresses[0]?.emailAddress || '';

      if (customerEmail) {
        await sendOrderCancellationEmail({
          orderNumber: updatedOrder.orderNumber,
          customerName,
          customerEmail,
          total: updatedOrder.total,
          cancellationReason: reason,
          refundAmount: refundDetails && refundDetails.amount ? refundDetails.amount : undefined,
          refundMethod: refundDetails && refundDetails.method ? refundDetails.method : undefined,
          refundETA: refundDetails && refundDetails.message ? refundDetails.message : undefined,
        });
      }
    } catch (emailError) {
      console.error('Failed to send cancellation email, but order was cancelled:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder,
      refund: {
        status: refundStatus,
        details: refundDetails,
      },
    });
  } catch (error) {
    console.error('[Cancel Order Error]', error);
    return NextResponse.json(
      { error: 'Failed to cancel order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

