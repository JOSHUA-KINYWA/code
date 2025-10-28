import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { clerkClient } from '@clerk/nextjs/server';
import {
  sendPaymentConfirmationEmail,
  sendOrderStatusUpdateEmail,
} from '@/lib/email';

const prisma = new PrismaClient();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature if secret is available
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } else {
        // For development without webhook secret
        event = JSON.parse(body);
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update order status - automatically approve when payment is completed
        if (session.metadata?.orderId) {
          const updatedOrder = await prisma.order.update({
            where: { id: session.metadata.orderId },
            data: {
              status: 'PROCESSING', // Automatically approve order
              paymentStatus: 'PAID',
            },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          });

          console.log('✅ Stripe Payment completed and order automatically approved');
          console.log('✅ Order updated:', { 
            orderNumber: updatedOrder.orderNumber, 
            status: updatedOrder.status, 
            paymentStatus: updatedOrder.paymentStatus,
            stripeSessionId: session.id
          });

          // Send payment confirmation and status update emails
          try {
            const client = await clerkClient();
            const user = await client.users.getUser(updatedOrder.userId);
            const customerName = user.fullName || user.firstName || 'Customer';
            const customerEmail = user.emailAddresses[0]?.emailAddress || '';

            if (customerEmail) {
              // Send payment confirmation
              await sendPaymentConfirmationEmail({
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
                status: 'PAID',
              });

              // Send order status update (PROCESSING)
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
                status: 'PROCESSING',
                newStatus: 'PROCESSING',
              });

              console.log('✅ Stripe payment confirmation emails sent');
            }
          } catch (emailError) {
            console.error('❌ Failed to send Stripe payment emails:', emailError);
            // Don't fail the webhook if email fails
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', paymentIntent.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

