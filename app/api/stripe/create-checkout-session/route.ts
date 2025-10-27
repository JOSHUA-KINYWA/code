import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const { items, shippingInfo, subtotal, tax, shipping, discount, total, couponCode, couponId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Verify stock availability BEFORE creating order
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
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

    // Create order in database first
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: `ORD-${Date.now()}`,
        subtotal: subtotal || 0,
        tax: tax || 0,
        shipping: shipping || 0,
        discount: discount || 0,
        total,
        shippingAddress: shippingInfo.address || '',
        shippingCity: shippingInfo.city || '',
        shippingState: shippingInfo.state || '',
        shippingZip: shippingInfo.zipCode || '',
        shippingCountry: shippingInfo.country || 'Kenya',
        paymentMethod: 'stripe',
        couponCode: couponCode || null,
        couponId: couponId || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Decrement stock for each product
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.id },
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

    // Create Stripe line items
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.images ? [item.images[0]] : [],
          description: item.category || '',
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if applicable
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
            description: 'Delivery charges',
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`,
      metadata: {
        orderId: order.id,
        userId,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

