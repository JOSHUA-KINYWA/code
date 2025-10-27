'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Rating from '../ui/Rating';
import ReviewForm from '../reviews/ReviewForm';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({
  productId,
  productName,
}: ProductReviewsProps) {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState<{
    canReview: boolean;
    reason: string;
    message: string;
  } | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reviews?productId=${productId}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews);

        // Check if current user has already reviewed
        if (isSignedIn && user) {
          const currentUserReview = data.reviews.find((r: Review) => r.userId === user.id);
          setUserReview(currentUserReview || null);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    if (!isSignedIn) {
      setCanReview(false);
      return;
    }

    try {
      const response = await fetch(`/api/reviews/can-review?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setCanReview(data.canReview);
        setReviewEligibility(data);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    checkReviewEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isSignedIn, user?.id]);

  const handleWriteReview = () => {
    if (!isSignedIn) {
      toast.error('Please sign in to write a review');
      router.push('/sign-in');
      return;
    }

    if (!canReview) {
      if (reviewEligibility?.reason === 'already_reviewed') {
        toast.error('You have already reviewed this product');
      } else if (reviewEligibility?.reason === 'not_purchased') {
        toast.error('⚠️ You can only review products you have purchased');
      } else {
        toast.error('You cannot review this product');
      }
      return;
    }

    setShowReviewForm(true);
  };

  const handleReviewSuccess = () => {
    fetchReviews();
    checkReviewEligibility();
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete your review?')) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Review deleted successfully');
        fetchReviews();
        checkReviewEligibility();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: totalReviews > 0 
      ? (reviews.filter((r) => r.rating === rating).length / totalReviews) * 100 
      : 0,
  }));

  if (isLoading) {
    return (
      <div className="space-y-8" id="reviews">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews</h2>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="reviews">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews</h2>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {totalReviews > 0 ? averageRating.toFixed(1) : '0.0'}
          </div>
          <Rating rating={averageRating} size="lg" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">{rating} star</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {totalReviews === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Reviews Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {canReview ? 'Be the first to review this product!' : 'Purchase this product to leave the first review!'}
          </p>
          {canReview ? (
            <button
              onClick={handleWriteReview}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Write the First Review
            </button>
          ) : isSignedIn && reviewEligibility?.reason === 'not_purchased' ? (
            <div className="inline-block bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  Purchase this product to leave a review
                </span>
              </div>
            </div>
          ) : !isSignedIn ? (
            <button
              onClick={handleWriteReview}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign in to Write a Review
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => {
            const isOwnReview = user?.id === review.userId;
            
            return (
              <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {isOwnReview ? 'You' : 'Anonymous'}
                      </span>
                      {review.verified && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full font-medium">
                          ✓ Verified Purchase
                        </span>
                      )}
                      {isOwnReview && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                          Your Review
                        </span>
                      )}
                    </div>
                    <Rating rating={review.rating} size="sm" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(review.createdAt)}
                    </span>
                    {isOwnReview && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{review.title}</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{review.comment}</p>

                <div className="flex items-center gap-4 text-sm">
                  <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                    Helpful ({review.helpful})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Write Review Button or Info Message */}
      {totalReviews > 0 && (
        <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
          {canReview ? (
            <button
              onClick={handleWriteReview}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Write a Review
            </button>
          ) : isSignedIn && reviewEligibility?.reason === 'not_purchased' ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 text-amber-800 dark:text-amber-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  Purchase this product to leave a review
                </span>
              </div>
            </div>
          ) : isSignedIn && reviewEligibility?.reason === 'already_reviewed' ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  Thank you for your review!
                </span>
              </div>
            </div>
          ) : !isSignedIn ? (
            <button
              onClick={handleWriteReview}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign in to Write a Review
            </button>
          ) : null}
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          productName={productName}
          onClose={() => setShowReviewForm(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
