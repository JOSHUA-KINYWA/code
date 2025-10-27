import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await req.json();

    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    console.error('Error Report:', {
      userId: userId || 'anonymous',
      ...body,
      userAgent: req.headers.get('user-agent'),
      url: req.headers.get('referer'),
    });

    // Could also store in database or send to external service
    // Example: await sendToSentry(body);
    // Example: await prisma.errorLog.create({ data: { ...body, userId } });

    return NextResponse.json(
      { success: true, message: 'Error reported successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to process error report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to report error' },
      { status: 500 }
    );
  }
}





