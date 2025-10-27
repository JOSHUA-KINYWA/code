import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - Update a review
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { rating, title, comment } = body;

    // Validate required fields
    if (!rating || !title || !comment) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own reviews' },
        { status: 403 }
      );
    }

    // Update the review
    const review = await prisma.review.update({
      where: { id },
      data: {
        rating,
        title,
        comment,
      },
    });

    // Recalculate product rating
    const allReviews = await prisma.review.findMany({
      where: { productId: existingReview.productId },
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: existingReview.productId },
      data: {
        rating: averageRating,
      },
    });

    return NextResponse.json(
      { review, message: 'Review updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: { id },
    });

    // Recalculate product rating
    const allReviews = await prisma.review.findMany({
      where: { productId: existingReview.productId },
    });

    if (allReviews.length > 0) {
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await prisma.product.update({
        where: { id: existingReview.productId },
        data: {
          rating: averageRating,
          reviewCount: allReviews.length,
        },
      });
    } else {
      // No reviews left, reset to 0
      await prisma.product.update({
        where: { id: existingReview.productId },
        data: {
          rating: 0,
          reviewCount: 0,
        },
      });
    }

    return NextResponse.json(
      { message: 'Review deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}





