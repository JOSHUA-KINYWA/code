import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST - Sync localStorage cart to database
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      );
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    // Merge localStorage items with existing cart
    for (const item of items) {
      const { productId, quantity } = item;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        continue; // Skip invalid products
      }

      // Check if item already in cart
      const existingItem = cart.items.find(i => i.productId === productId);

      if (existingItem) {
        // Update quantity (merge)
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          product.stock
        );
        
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        // Add new item
        const maxQuantity = Math.min(quantity, product.stock);
        
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity: maxQuantity,
          },
        });
      }
    }

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Cart synced successfully',
        cart: updatedCart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error syncing cart:', error);
    return NextResponse.json(
      { error: 'Failed to sync cart' },
      { status: 500 }
    );
  }
}





