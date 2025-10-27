import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

// GET all users from Clerk
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users from Clerk
    const client = await clerkClient();
    const users = await client.users.getUserList({
      limit: 100,
    });

    const formattedUsers = users.data.map((user) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      role: user.publicMetadata?.role || 'user',
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}






