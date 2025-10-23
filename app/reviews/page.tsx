
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
}

export default function ReviewsPage() {
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      productId: '1',
      productName: 'Premium Wireless Headphones',
      productImage: '/placeholder-product.jpg',
      rating: 5,
      title: 'Amazing sound quality!',
      comment: 'These headphones exceeded my expectations. The noise cancellation is phenomenal and the battery life lasts all day. Highly recommend for anyone looking for premium audio experience.',
      date: 'October 15, 2025',
      verified: true,
      helpful: 24,
    },
    {
      id: '2',
      productId: '2',
      productName: 'Smart Watch Series 5',
      productImage: '/placeholder-product.jpg',
      rating: 4,
      title: 'Great features, minor issues',
      comment: 'Love the fitness tracking and the display is beautiful. Battery life could be better, but overall a solid smartwatch. The health monitoring features are very accurate.',
      date: 'October 10, 2025',
      verified: true,
      helpful: 18,
    },
    {
      id: '3',
      productId: '4',
      productName: 'Bluetooth Speaker',
      productImage: '/placeholder-product.jpg',
      rating: 5,
      title: 'Perfect for outdoor use',
      comment: 'Took this speaker to the beach and it performed flawlessly. Waterproof, great sound, and the battery lasted the entire day. Worth every penny!',
      date: 'October 5, 2025',
      verified: true,
      helpful: 32,
    },
  ]);

  const [filter, setFilter] = useState<'all' | number>('all');

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(review => review.rating === filter);

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / reviews.length) * 100,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-2">Reviews you&apos;ve written for purchased products</p>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">No reviews yet</h2>
            <p className="mt-2 text-gray-600">Purchase products to leave reviews</p>
            <Link 
              href="/products" 
              className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Summary</h2>
                
                <div className="text-center mb-6 pb-6 border-b border-gray-200">
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">Based on {reviews.length} reviews</p>
                </div>

                <div className="space-y-3 mb-6">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <button
                      key={rating}
                      onClick={() => setFilter(filter === rating ? 'all' : rating)}
                      className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                        filter === rating ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-700 w-12">
                        {rating} star
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </button>
                  ))}
                </div>

                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1">
                      <Link
                        href={`/products/${review.productId}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {review.productName}
                      </Link>
                      
                      <div className="flex items-center mt-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        {review.verified && (
                          <span className="ml-3 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            Verified Purchase
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {review.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{review.comment}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{review.date}</span>
                        <div className="flex items-center space-x-4">
                          <button className="text-gray-600 hover:text-gray-900 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>

                      {review.helpful > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            {review.helpful} {review.helpful === 1 ? 'person' : 'people'} found this helpful
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
