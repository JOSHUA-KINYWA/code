import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST - Bulk operations
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string;

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, productIds, data } = await req.json();

    if (!action || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: action and productIds are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'delete':
        // Bulk delete products
        result = await prisma.product.deleteMany({
          where: {
            id: {
              in: productIds,
            },
          },
        });
        break;

      case 'activate':
        // Bulk activate products
        result = await prisma.product.updateMany({
          where: {
            id: {
              in: productIds,
            },
          },
          data: {
            isActive: true,
          },
        });
        break;

      case 'deactivate':
        // Bulk deactivate products
        result = await prisma.product.updateMany({
          where: {
            id: {
              in: productIds,
            },
          },
          data: {
            isActive: false,
          },
        });
        break;

      case 'updateCategory':
        // Bulk update category
        if (!data?.category) {
          return NextResponse.json(
            { error: 'Category is required for updateCategory action' },
            { status: 400 }
          );
        }
        result = await prisma.product.updateMany({
          where: {
            id: {
              in: productIds,
            },
          },
          data: {
            category: data.category,
          },
        });
        break;

      case 'updatePrice':
        // Bulk update price (add/subtract percentage)
        if (!data?.priceChange || !data?.changeType) {
          return NextResponse.json(
            { error: 'priceChange and changeType are required' },
            { status: 400 }
          );
        }

        // Get all products to update
        const products = await prisma.product.findMany({
          where: {
            id: {
              in: productIds,
            },
          },
        });

        // Update each product's price
        const priceUpdates = products.map(product => {
          let newPrice = product.price;
          
          if (data.changeType === 'percentage') {
            const change = (product.price * parseFloat(data.priceChange)) / 100;
            newPrice = product.price + change;
          } else if (data.changeType === 'fixed') {
            newPrice = product.price + parseFloat(data.priceChange);
          }

          // Ensure price doesn't go below 0
          newPrice = Math.max(0, newPrice);

          return prisma.product.update({
            where: { id: product.id },
            data: { price: newPrice },
          });
        });

        await Promise.all(priceUpdates);
        result = { count: priceUpdates.length };
        break;

      case 'markTrending':
        // Bulk mark as trending
        result = await prisma.product.updateMany({
          where: {
            id: {
              in: productIds,
            },
          },
          data: {
            isTrending: true,
          },
        });
        break;

      case 'unmarkTrending':
        // Bulk unmark as trending
        result = await prisma.product.updateMany({
          where: {
            id: {
              in: productIds,
            },
          },
          data: {
            isTrending: false,
          },
        });
        break;

      case 'markFlashDeal':
        // Bulk mark as flash deal
        result = await prisma.product.updateMany({
          where: {
            id: {
              in: productIds,
            },
          },
          data: {
            isFlashDeal: true,
          },
        });
        break;

      case 'unmarkFlashDeal':
        // Bulk unmark as flash deal
        result = await prisma.product.updateMany({
          where: {
            id: {
              in: productIds,
            },
          },
          data: {
            isFlashDeal: false,
          },
        });
        break;

      case 'updateStock':
        // Bulk update stock
        if (data?.stock === undefined || data?.stockAction === undefined) {
          return NextResponse.json(
            { error: 'stock and stockAction are required' },
            { status: 400 }
          );
        }

        if (data.stockAction === 'set') {
          // Set stock to specific value
          result = await prisma.product.updateMany({
            where: {
              id: {
                in: productIds,
              },
            },
            data: {
              stock: parseInt(data.stock),
            },
          });
        } else if (data.stockAction === 'add') {
          // Add to existing stock
          const stockProducts = await prisma.product.findMany({
            where: { id: { in: productIds } },
          });

          const stockUpdates = stockProducts.map(product =>
            prisma.product.update({
              where: { id: product.id },
              data: { stock: product.stock + parseInt(data.stock) },
            })
          );

          await Promise.all(stockUpdates);
          result = { count: stockUpdates.length };
        } else if (data.stockAction === 'subtract') {
          // Subtract from existing stock
          const stockProducts = await prisma.product.findMany({
            where: { id: { in: productIds } },
          });

          const stockUpdates = stockProducts.map(product =>
            prisma.product.update({
              where: { id: product.id },
              data: { stock: Math.max(0, product.stock - parseInt(data.stock)) },
            })
          );

          await Promise.all(stockUpdates);
          result = { count: stockUpdates.length };
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        message: `Bulk operation '${action}' completed successfully`,
        affected: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

// GET - Export products to CSV
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string;

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate CSV
    const headers = [
      'ID',
      'Name',
      'Description',
      'Price',
      'Compare Price',
      'Category',
      'Stock',
      'Active',
      'Trending',
      'Flash Deal',
      'Rating',
      'Review Count',
      'Created At',
    ];

    const rows = products.map(product => [
      product.id,
      product.name,
      product.description,
      product.price.toFixed(2),
      (product.comparePrice || 0).toFixed(2),
      product.category,
      product.stock,
      product.isActive ? 'Yes' : 'No',
      product.isTrending ? 'Yes' : 'No',
      product.isFlashDeal ? 'Yes' : 'No',
      product.rating.toFixed(1),
      product.reviewCount,
      new Date(product.createdAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products-export-${
          new Date().toISOString().split('T')[0]
        }.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export products' },
      { status: 500 }
    );
  }
}





