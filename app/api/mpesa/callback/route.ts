import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import { sendPaymentConfirmationEmail, sendOrderStatusUpdateEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();
    
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

    const { Body } = callbackData;
    const { stkCallback } = Body;

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    } = stkCallback;

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestID: CheckoutRequestID },
      include: { order: true },
    });

    if (!payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    // Update payment based on result code
    if (ResultCode === 0) {
      // Payment successful
      const { CallbackMetadata } = stkCallback;
      const metadata = CallbackMetadata?.Item || [];

      const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value;

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'completed',
          resultCode: String(ResultCode),
          resultDesc: ResultDesc,
          mpesaReceiptNumber,
          transactionDate: transactionDate ? new Date(String(transactionDate)) : null,
        },
      });

      // Update order status - automatically approve when payment is completed
      const updatedOrder = await prisma.order.update({
        where: { id: payment.orderId },
        data: { 
          status: 'PROCESSING', // Automatically approve order
          paymentStatus: 'PAID',
        },
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

      console.log('Payment completed and order automatically approved:', CheckoutRequestID);

      // Send payment confirmation email
      try {
        const user = await clerkClient().users.getUser(updatedOrder.userId);
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
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
        // Don't fail the callback if email fails
      }
    } else {
      // Payment failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          resultCode: String(ResultCode),
          resultDesc: ResultDesc,
        },
      });

      console.log('Payment failed:', CheckoutRequestID, ResultDesc);
    }

    return NextResponse.json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Callback processing error:', error);
    return NextResponse.json(
      { message: 'Failed to process callback' },
      { status: 500 }
    );
  }
}


