import { NextRequest, NextResponse } from 'next/server';
import { initiateStkPush, validateMpesaConfig } from '@/lib/mpesa';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Validate M-Pesa configuration
    if (!validateMpesaConfig()) {
      return NextResponse.json(
        { message: 'M-Pesa is not properly configured' },
        { status: 500 }
      );
    }

    const { orderId, phoneNumber, amount } = await request.json();

    if (!orderId || !phoneNumber || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields: orderId, phoneNumber, amount' },
        { status: 400 }
      );
    }

    // Initiate STK Push
    const stkResponse = await initiateStkPush(
      phoneNumber,
      amount,
      `Order-${orderId}`,
      'Payment for order'
    );

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        orderId,
        phoneNumber,
        amount,
        merchantRequestID: stkResponse.MerchantRequestID,
        checkoutRequestID: stkResponse.CheckoutRequestID,
        status: 'pending',
      },
    });

    return NextResponse.json({
      message: 'STK Push initiated successfully',
      payment: {
        id: payment.id,
        merchantRequestID: payment.merchantRequestID,
        checkoutRequestID: payment.checkoutRequestID,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error('STK Push error:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to initiate payment',
      },
      { status: 500 }
    );
  }
}






