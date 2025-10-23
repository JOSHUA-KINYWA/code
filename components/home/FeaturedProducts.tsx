import React from 'react';
import Link from 'next/link';
import ProductCard from '../products/ProductCard';

const featuredProducts = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299.99,
    image: '/placeholder-product.jpg',
    rating: 4.8,
    reviews: 342,
  },
  {
    id: '2',
    name: 'Smart Watch Series 5',
    price: 399.99,
    image: '/placeholder-product.jpg',
    rating: 4.6,
    reviews: 568,
  },
  {
    id: '3',
    name: 'Wireless Earbuds Pro',
    price: 199.99,
    image: '/placeholder-product.jpg',
    rating: 4.7,
    reviews: 789,
  },
  {
    id: '4',
    name: 'Bluetooth Speaker',
    price: 89.99,
    image: '/placeholder-product.jpg',
    rating: 4.5,
    reviews: 445,
  },
];

export default function FeaturedProducts() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-gray-600 mt-2">Check out our most popular items</p>
          </div>
          <Link
            href="/products"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            View All
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
