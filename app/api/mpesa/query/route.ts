import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { queryStkPushStatus } from '@/lib/mpesa';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutRequestID = searchParams.get('checkoutRequestID');

    if (!checkoutRequestID) {
      return NextResponse.json(
        { message: 'Missing checkoutRequestID parameter' },
        { status: 400 }
      );
    }

    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestID },
    });

    if (!payment) {
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      );
    }

    // If payment is already completed or failed, return database status
    if (payment.status === 'completed' || payment.status === 'failed') {
      return NextResponse.json({
        status: payment.status,
        resultCode: payment.resultCode,
        resultDesc: payment.resultDesc,
        mpesaReceiptNumber: payment.mpesaReceiptNumber,
        transactionDate: payment.transactionDate,
      });
    }

    // If still pending, query M-Pesa API for real-time status
    try {
      const mpesaStatus = await queryStkPushStatus(checkoutRequestID);
      
      console.log('M-Pesa Query Response:', mpesaStatus);

      // Check if payment is complete
      if (mpesaStatus.ResultCode === '0') {
        // Payment successful - update database and automatically approve order
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            resultCode: mpesaStatus.ResultCode,
            resultDesc: mpesaStatus.ResultDesc,
            mpesaReceiptNumber: mpesaStatus.MpesaReceiptNumber || null,
          },
        });

        // Update order status - automatically approve when payment is completed
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { 
            status: 'PROCESSING', // Automatically approve order
            paymentStatus: 'PAID',
          },
        });

        return NextResponse.json({
          status: 'completed',
          resultCode: mpesaStatus.ResultCode,
          resultDesc: mpesaStatus.ResultDesc,
          mpesaReceiptNumber: mpesaStatus.MpesaReceiptNumber,
        });
      } else if (mpesaStatus.ResultCode && mpesaStatus.ResultCode !== '1032') {
        // Payment failed (1032 means request cancelled/timed out, keep as pending)
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            resultCode: mpesaStatus.ResultCode,
            resultDesc: mpesaStatus.ResultDesc,
          },
        });

        return NextResponse.json({
          status: 'failed',
          resultCode: mpesaStatus.ResultCode,
          resultDesc: mpesaStatus.ResultDesc,
        });
      }

      // Still pending
      return NextResponse.json({
        status: 'pending',
        resultCode: mpesaStatus.ResultCode,
        resultDesc: mpesaStatus.ResultDesc || 'Payment pending',
      });
    } catch (mpesaError) {
      console.error('M-Pesa query error:', mpesaError);
      
      // Return current database status if M-Pesa query fails
      return NextResponse.json({
        status: payment.status,
        resultCode: payment.resultCode,
        resultDesc: payment.resultDesc || 'Checking payment status...',
      });
    }
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { message: 'Failed to query payment status' },
      { status: 500 }
    );
  }
}

