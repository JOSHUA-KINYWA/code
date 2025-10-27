import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/payments/logs
 * Get payment audit logs for admin review
 * Query params: orderId, action, method, limit, offset
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user to check role
    const clerkClientInstance = await clerkClient();
    const user = await clerkClientInstance.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string || 'user';
    
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get filter parameters
    const searchParams = req.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const action = searchParams.get('action');
    const method = searchParams.get('method');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (action) {
      where.action = action;
    }

    if (method) {
      where.method = method;
    }

    if (status) {
      where.status = status;
    }

    // Fetch payment logs
    const [logs, totalCount] = await Promise.all([
      prisma.paymentLog.findMany({
        where,
        include: {
          payment: {
            include: {
              order: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.paymentLog.count({ where }),
    ]);

    // Fetch user details for initiators
    const client = await clerkClient();
    const uniqueUserIds = [...new Set(
      logs
        .map(log => log.initiatedBy)
        .filter(id => id && id !== 'SYSTEM')
    )] as string[];
    
    const userDetailsMap = new Map();
    await Promise.all(
      uniqueUserIds.map(async (uid) => {
        try {
          const user = await client.users.getUser(uid);
          const name = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || 'Unknown User';
          const email = user.emailAddresses[0]?.emailAddress || '';
          userDetailsMap.set(uid, { name, email });
        } catch (error) {
          userDetailsMap.set(uid, { name: 'Unknown User', email: '' });
        }
      })
    );

    // Map logs with user details
    const logsWithDetails = logs.map(log => {
      let initiatorName = 'SYSTEM';
      let initiatorEmail = '';

      if (log.initiatedBy && log.initiatedBy !== 'SYSTEM') {
        const userDetails = userDetailsMap.get(log.initiatedBy);
        if (userDetails) {
          initiatorName = userDetails.name;
          initiatorEmail = userDetails.email;
        }
      }

      return {
        id: log.id,
        orderId: log.orderId,
        orderNumber: log.payment?.order?.orderNumber || 'N/A',
        action: log.action,
        status: log.status,
        method: log.method,
        initiatedBy: {
          id: log.initiatedBy,
          name: initiatorName,
          email: initiatorEmail,
          role: log.initiatorRole,
        },
        previousStatus: log.previousStatus,
        newStatus: log.newStatus,
        errorMessage: log.errorMessage,
        details: log.details ? JSON.parse(log.details) : null,
        createdAt: log.createdAt,
      };
    });

    // Calculate summary statistics
    const summary = {
      totalLogs: totalCount,
      actions: {
        webhookReceived: logs.filter(l => l.action === 'WEBHOOK_RECEIVED').length,
        verificationRequested: logs.filter(l => l.action === 'VERIFICATION_REQUESTED').length,
        manualVerification: logs.filter(l => l.action === 'MANUAL_VERIFICATION').length,
        statusUpdated: logs.filter(l => l.action === 'STATUS_UPDATED').length,
        autoCancelled: logs.filter(l => l.action === 'AUTO_CANCELLED').length,
      },
      statuses: {
        success: logs.filter(l => l.status === 'SUCCESS').length,
        failed: logs.filter(l => l.status === 'FAILED').length,
        pending: logs.filter(l => l.status === 'PENDING').length,
      },
      methods: {
        mpesa: logs.filter(l => l.method === 'MPESA').length,
        stripe: logs.filter(l => l.method === 'STRIPE').length,
        manual: logs.filter(l => l.method === 'MANUAL').length,
      },
    };

    return NextResponse.json({
      logs: logsWithDetails,
      summary,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error fetching payment logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment logs', details: error.message },
      { status: 500 }
    );
  }
}

