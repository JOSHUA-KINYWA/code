import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Also get conversation status
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: { status: true },
    });

    return NextResponse.json({
      messages,
      conversation: conversation || { status: 'open' },
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, senderId, senderName, senderRole, message, imageUrl } = body;

    if (!conversationId || !senderId || !senderName || !senderRole || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId,
        senderName,
        senderRole,
        message,
        imageUrl: imageUrl || null,
      },
    });

    // Update conversation's updatedAt
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

