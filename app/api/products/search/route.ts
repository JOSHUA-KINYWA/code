import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query && !category) {
      return NextResponse.json({ products: [], total: 0 });
    }

    // Build search conditions
    const whereConditions: any = {
      isActive: true,
    };

    // Add search query conditions
    if (query) {
      whereConditions.OR = [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          description: {
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
      ];
    }

    // Add category filter
    if (category) {
      whereConditions.category = {
        equals: category,
        mode: 'insensitive',
      };
    }

    // Get products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereConditions,
        take: limit,
        orderBy: [
          { isTrending: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          comparePrice: true,
          images: true,
          category: true,
          stock: true,
          rating: true,
          reviewCount: true,
          isTrending: true,
          isFlashDeal: true,
        },
      }),
      prisma.product.count({
        where: whereConditions,
      }),
    ]);

    return NextResponse.json({
      products,
      total,
      query,
      category,
    });
  } catch (error) {
    console.error('[Search Error]', error);
    return NextResponse.json(
      { error: 'Failed to search products', products: [], total: 0 },
      { status: 500 }
    );
  }
}





