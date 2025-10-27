import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get product suggestions
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            category: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: 5,
      orderBy: [
        { isTrending: 'desc' },
        { rating: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        images: true,
      },
    });

    // Get unique categories that match
    const categories = await prisma.product.findMany({
      where: {
        isActive: true,
        category: {
          contains: query,
          mode: 'insensitive',
        },
      },
      distinct: ['category'],
      select: {
        category: true,
      },
      take: 3,
    });

    return NextResponse.json({
      suggestions: {
        products,
        categories: categories.map((c) => c.category),
      },
    });
  } catch (error) {
    console.error('[Suggestions Error]', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions', suggestions: { products: [], categories: [] } },
      { status: 500 }
    );
  }
}





