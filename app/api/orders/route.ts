import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth, clerkClient } from '@clerk/nextjs/server';
import {
  sendOrderConfirmationEmail,
  sendAdminNewOrderNotification,
} from '@/lib/email';

const prisma = new PrismaClient();

// GET orders for authenticated user
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      userId, // Only fetch orders for the authenticated user
    };
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create a new order
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, subtotal, tax, shipping, discount, total, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry, paymentMethod, couponCode, couponId } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Verify stock availability and update stock
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product not found` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Only ${product.stock} available.` },
          { status: 400 }
        );
      }
    }

    // Create order with items and decrease stock
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: `ORD-${Date.now()}`,
        subtotal: subtotal || 0,
        tax: tax || 0,
        shipping: shipping || 0,
        discount: discount || 0,
        total,
        shippingAddress: shippingAddress || '',
        shippingCity: shippingCity || '',
        shippingState: shippingState || '',
        shippingZip: shippingZip || '',
        shippingCountry: shippingCountry || 'Kenya',
        paymentMethod: paymentMethod || 'mpesa',
        couponCode: couponCode || null,
        couponId: couponId || null,
        // status: 'PROCESSING' is the default, no need to set it
        // paymentStatus: 'PENDING' is the default, no need to set it
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Decrease stock for each product
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Increment coupon usage count if coupon was used
    if (couponId) {
      await prisma.coupon.update({
        where: { id: couponId },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });
    }

    // Send order confirmation email
    try {
      // Get user details from Clerk
      const user = await clerkClient().users.getUser(userId);
      const customerName = user.fullName || user.firstName || 'Customer';
      const customerEmail = user.emailAddresses[0]?.emailAddress || '';

      if (customerEmail) {
        // Prepare order data for email
        const orderEmailData = {
          orderNumber: order.orderNumber,
          customerName,
          customerEmail,
          total: order.total,
          items: items.map((item: any) => ({
            name: item.name || 'Product',
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress: {
            street: shippingAddress || '',
            city: shippingCity || '',
            state: shippingState || '',
            zip: shippingZip || '',
            country: shippingCountry || 'Kenya',
          },
          paymentMethod: paymentMethod || 'M-Pesa',
          status: 'PENDING',
        };

        // Send confirmation email to customer
        await sendOrderConfirmationEmail(orderEmailData);

        // Send notification to admin
        await sendAdminNewOrderNotification({
          orderNumber: order.orderNumber,
          customerName,
          total: order.total,
          itemsCount: items.length,
          paymentStatus: 'PENDING',
        });
      }
    } catch (emailError) {
      console.error('Failed to send order emails:', emailError);
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

