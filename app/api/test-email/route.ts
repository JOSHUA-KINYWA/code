import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

/**
 * Test endpoint to verify email sending
 * GET /api/test-email
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const customerName = user.fullName || user.firstName || 'Customer';
    const customerEmail = user.emailAddresses[0]?.emailAddress || '';

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'No email address found for user' },
        { status: 400 }
      );
    }

    // Test email data
    const testEmailData = {
      orderNumber: 'TEST-' + Date.now(),
      customerName,
      customerEmail,
      total: 1299.00,
      items: [
        {
          name: 'Test Product',
          quantity: 1,
          price: 1299.00,
        },
      ],
      shippingAddress: {
        street: '123 Test Street',
        city: 'Nairobi',
        state: 'Nairobi',
        zip: '00100',
        country: 'Kenya',
      },
      paymentMethod: 'Test',
      status: 'PENDING',
    };

    console.log('📧 Sending test email to:', customerEmail);

    // Send test email
    const result = await sendOrderConfirmationEmail(testEmailData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        sentTo: customerEmail,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send email',
        details: result.error,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Test email error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

