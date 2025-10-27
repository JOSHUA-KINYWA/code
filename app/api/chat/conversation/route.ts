import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Get or create a conversation for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, userEmail } = body;

    if (!userId || !userName || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already has an open conversation
    let conversation = await prisma.chatConversation.findFirst({
      where: {
        userId,
        status: 'open',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    // If no open conversation, create a new one
    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          userId,
          userName,
          userEmail,
          status: 'open',
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error in chat conversation:', error);
    return NextResponse.json(
      { error: 'Failed to load conversation' },
      { status: 500 }
    );
  }
}






