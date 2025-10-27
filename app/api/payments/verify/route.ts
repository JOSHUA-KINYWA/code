import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { queryStkPushStatus } from '@/lib/mpesa';

// Payment verification endpoint
/**
 * POST /api/payments/verify
 * Manually verify payment status for an order
 * Can be triggered by user or admin
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Fetch order with payment details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user owns this order or is admin
    const { clerkClient: getClient } = await import('@clerk/nextjs/server');
    const client = await getClient();
    const user = await client.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string || 'user';
    
    if (order.userId !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'You do not have permission to verify this payment' }, { status: 403 });
    }

    // Check if payment exists
    if (!order.payment) {
      return NextResponse.json({ 
        error: 'No payment record found for this order',
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      }, { status: 404 });
    }

    const payment = order.payment;

    // Log verification attempt
    await prisma.paymentLog.create({
      data: {
        orderId: order.id,
        paymentId: payment.id,
        action: 'VERIFICATION_REQUESTED',
        status: 'PENDING',
        method: payment.stripePaymentIntentId ? 'STRIPE' : 'MPESA',
        initiatedBy: userId,
        initiatorRole: userRole.toUpperCase(),
        details: JSON.stringify({
          orderNumber: order.orderNumber,
          currentPaymentStatus: payment.status,
          currentOrderPaymentStatus: order.paymentStatus,
        }),
      },
    });

    // Handle M-Pesa verification
    if (payment.checkoutRequestID && payment.phoneNumber) {
      try {
        const mpesaStatus = await queryStkPushStatus(payment.checkoutRequestID);

        // Update payment record
        const updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            resultCode: mpesaStatus.ResultCode,
            resultDesc: mpesaStatus.ResultDesc,
            status: mpesaStatus.ResultCode === '0' ? 'completed' : 'failed',
            updatedAt: new Date(),
          },
        });

        // If payment succeeded, update order
        if (mpesaStatus.ResultCode === '0') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              status: 'PROCESSING',
            },
          });

          // Log successful verification
          await prisma.paymentLog.create({
            data: {
              orderId: order.id,
              paymentId: payment.id,
              action: 'MANUAL_VERIFICATION',
              status: 'SUCCESS',
              method: 'MPESA',
              initiatedBy: userId,
              initiatorRole: userRole.toUpperCase(),
              previousStatus: payment.status,
              newStatus: 'completed',
              details: JSON.stringify({
                mpesaReceipt: updatedPayment.mpesaReceiptNumber,
                transactionDate: updatedPayment.transactionDate,
                resultDesc: mpesaStatus.ResultDesc,
              }),
            },
          });

          return NextResponse.json({
            success: true,
            message: 'Payment verified successfully',
            payment: {
              status: 'completed',
              mpesaReceipt: updatedPayment.mpesaReceiptNumber,
              resultDesc: mpesaStatus.ResultDesc,
            },
            order: {
              paymentStatus: 'PAID',
              status: 'PROCESSING',
            },
          });
        } else {
          // Payment failed
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'FAILED',
            },
          });

          // Log failed verification
          await prisma.paymentLog.create({
            data: {
              orderId: order.id,
              paymentId: payment.id,
              action: 'MANUAL_VERIFICATION',
              status: 'FAILED',
              method: 'MPESA',
              initiatedBy: userId,
              initiatorRole: userRole.toUpperCase(),
              previousStatus: payment.status,
              newStatus: 'failed',
              errorMessage: mpesaStatus.ResultDesc,
              details: JSON.stringify({
                resultCode: mpesaStatus.ResultCode,
                resultDesc: mpesaStatus.ResultDesc,
              }),
            },
          });

          return NextResponse.json({
            success: false,
            message: 'Payment verification failed',
            payment: {
              status: 'failed',
              resultDesc: mpesaStatus.ResultDesc,
            },
            order: {
              paymentStatus: 'FAILED',
            },
          }, { status: 400 });
        }
      } catch (mpesaError: any) {
        // Log error
        await prisma.paymentLog.create({
          data: {
            orderId: order.id,
            paymentId: payment.id,
            action: 'MANUAL_VERIFICATION',
            status: 'FAILED',
            method: 'MPESA',
            initiatedBy: userId,
            initiatorRole: userRole.toUpperCase(),
            errorMessage: mpesaError.message || 'M-Pesa query failed',
            details: JSON.stringify({
              error: mpesaError.message,
              stack: mpesaError.stack,
            }),
          },
        });

        return NextResponse.json({
          success: false,
          message: 'Failed to verify M-Pesa payment',
          error: mpesaError.message || 'M-Pesa query failed',
        }, { status: 500 });
      }
    }

    // Handle Stripe verification
    if (payment.stripePaymentIntentId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);

        const stripeStatus = paymentIntent.status;
        const paymentStatus = stripeStatus === 'succeeded' ? 'completed' : stripeStatus === 'processing' ? 'pending' : 'failed';

        // Update payment record
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: paymentStatus,
            resultDesc: `Stripe status: ${stripeStatus}`,
            updatedAt: new Date(),
          },
        });

        // If payment succeeded, update order
        if (stripeStatus === 'succeeded') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              status: 'PROCESSING',
            },
          });

          // Log successful verification
          await prisma.paymentLog.create({
            data: {
              orderId: order.id,
              paymentId: payment.id,
              action: 'MANUAL_VERIFICATION',
              status: 'SUCCESS',
              method: 'STRIPE',
              initiatedBy: userId,
              initiatorRole: userRole.toUpperCase(),
              previousStatus: payment.status,
              newStatus: paymentStatus,
              details: JSON.stringify({
                stripeStatus,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
              }),
            },
          });

          return NextResponse.json({
            success: true,
            message: 'Payment verified successfully',
            payment: {
              status: paymentStatus,
              stripeStatus,
            },
            order: {
              paymentStatus: 'PAID',
              status: 'PROCESSING',
            },
          });
        } else {
          // Payment not yet succeeded
          if (stripeStatus === 'processing') {
            await prisma.paymentLog.create({
              data: {
                orderId: order.id,
                paymentId: payment.id,
                action: 'MANUAL_VERIFICATION',
                status: 'PENDING',
                method: 'STRIPE',
                initiatedBy: userId,
                initiatorRole: userRole.toUpperCase(),
                details: JSON.stringify({
                  stripeStatus,
                  message: 'Payment is still processing',
                }),
              },
            });

            return NextResponse.json({
              success: false,
              message: 'Payment is still processing. Please check again in a few minutes.',
              payment: {
                status: 'pending',
                stripeStatus,
              },
            }, { status: 202 });
          } else {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'FAILED',
              },
            });

            await prisma.paymentLog.create({
              data: {
                orderId: order.id,
                paymentId: payment.id,
                action: 'MANUAL_VERIFICATION',
                status: 'FAILED',
                method: 'STRIPE',
                initiatedBy: userId,
                initiatorRole: userRole.toUpperCase(),
                previousStatus: payment.status,
                newStatus: 'failed',
                errorMessage: `Stripe payment ${stripeStatus}`,
                details: JSON.stringify({
                  stripeStatus,
                }),
              },
            });

            return NextResponse.json({
              success: false,
              message: 'Payment verification failed',
              payment: {
                status: 'failed',
                stripeStatus,
              },
              order: {
                paymentStatus: 'FAILED',
              },
            }, { status: 400 });
          }
        }
      } catch (stripeError: any) {
        // Log error
        await prisma.paymentLog.create({
          data: {
            orderId: order.id,
            paymentId: payment.id,
            action: 'MANUAL_VERIFICATION',
            status: 'FAILED',
            method: 'STRIPE',
            initiatedBy: userId,
            initiatorRole: userRole.toUpperCase(),
            errorMessage: stripeError.message || 'Stripe query failed',
            details: JSON.stringify({
              error: stripeError.message,
              stack: stripeError.stack,
            }),
          },
        });

        return NextResponse.json({
          success: false,
          message: 'Failed to verify Stripe payment',
          error: stripeError.message || 'Stripe query failed',
        }, { status: 500 });
      }
    }

    // No payment method found
    return NextResponse.json({
      success: false,
      message: 'No payment method information found',
      payment: {
        status: payment.status,
      },
    }, { status: 400 });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to verify payment', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

