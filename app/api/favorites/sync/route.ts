import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST - Sync localStorage favorites to database (for migration)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productIds } = await req.json();

    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds must be an array' },
        { status: 400 }
      );
    }

    // Get existing favorites
    const existing = await prisma.favorite.findMany({
      where: { userId },
      select: { productId: true },
    });

    const existingIds = new Set(existing.map((f) => f.productId));

    // Add new favorites (only ones not already in DB)
    const newFavorites = productIds.filter((id) => !existingIds.has(id));

    if (newFavorites.length > 0) {
      await prisma.favorite.createMany({
        data: newFavorites.map((productId) => ({
          userId,
          productId,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch all favorites
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      {
        message: 'Favorites synced successfully',
        favorites,
        synced: newFavorites.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error syncing favorites:', error);
    return NextResponse.json(
      { error: 'Failed to sync favorites' },
      { status: 500 }
    );
  }
}





