'use client';

import React from 'react';
import Link from 'next/link';
import ProductCard from '../products/ProductCard';
import { useUser } from '@clerk/nextjs';

const featuredProducts = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299.99,
    image: '/placeholder-product.jpg',
    rating: 4.8,
    reviews: 342,
    category: 'Audio',
  },
  {
    id: '2',
    name: 'Smart Watch Series 5',
    price: 399.99,
    image: '/placeholder-product.jpg',
    rating: 4.6,
    reviews: 568,
    category: 'Wearables',
  },
  {
    id: '3',
    name: 'Wireless Earbuds Pro',
    price: 199.99,
    image: '/placeholder-product.jpg',
    rating: 4.7,
    reviews: 789,
    category: 'Audio',
  },
  {
    id: '4',
    name: 'Bluetooth Speaker',
    price: 89.99,
    image: '/placeholder-product.jpg',
    rating: 4.5,
    reviews: 445,
    category: 'Audio',
  },
];

export default function FeaturedProducts() {
  const { user, isSignedIn } = useUser();
  const displayName = user?.firstName || user?.username || 'there';

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isSignedIn ? `Recommended for You, ${displayName}` : 'Featured Products'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isSignedIn 
                ? 'Products picked just for you based on trending items' 
                : 'Check out our most popular items'}
            </p>
          </div>
          <Link
            href="/products"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center whitespace-nowrap"
          >
            View All Products
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
