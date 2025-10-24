'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useCart } from '@/context/CartContext';
import ProductCard from '../products/ProductCard';

export default function LoggedInHome() {
  const { user } = useUser();
  const { cartCount } = useCart();

  // Dynamic time-based greeting
  const timeOfDay = new Date().getHours();
  const greeting = 
    timeOfDay >= 5 && timeOfDay < 12 ? 'Good morning' : 
    timeOfDay >= 12 && timeOfDay < 17 ? 'Good afternoon' : 
    timeOfDay >= 17 && timeOfDay < 22 ? 'Good evening' : 
    'Welcome back';

  const displayName = user?.firstName || 'there';

  // Featured deals (you can make this dynamic from database later)
  const featuredDeals = [
    {
      id: '1',
      name: 'Premium Wireless Headphones',
      price: 299.99,
      originalPrice: 399.99,
      image: '/placeholder-product.jpg',
      rating: 4.8,
      reviews: 342,
      category: 'Audio',
      discount: 25,
    },
    {
      id: '5',
      name: 'Wireless Earbuds Pro',
      price: 199.99,
      originalPrice: 249.99,
      image: '/placeholder-product.jpg',
      rating: 4.7,
      reviews: 789,
      category: 'Audio',
      discount: 20,
    },
    {
      id: '2',
      name: 'Smart Watch Series 5',
      price: 399.99,
      originalPrice: 499.99,
      image: '/placeholder-product.jpg',
      rating: 4.6,
      reviews: 568,
      category: 'Wearables',
      discount: 20,
    },
    {
      id: '4',
      name: 'Bluetooth Speaker',
      price: 89.99,
      originalPrice: 129.99,
      image: '/placeholder-product.jpg',
      rating: 4.5,
      reviews: 445,
      category: 'Audio',
      discount: 31,
    },
  ];

  const trendingProducts = [
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
      id: '6',
      name: 'Fitness Tracker Band',
      price: 79.99,
      image: '/placeholder-product.jpg',
      rating: 4.4,
      reviews: 321,
      category: 'Wearables',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Greeting Bar */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {greeting}, {displayName}! 👋
              </h1>
              <p className="text-blue-100 dark:text-blue-200 mt-1">
                {timeOfDay >= 5 && timeOfDay < 12 
                  ? "Discover amazing deals to start your day" 
                  : timeOfDay >= 12 && timeOfDay < 17 
                    ? "Check out what's new this afternoon"
                    : timeOfDay >= 17 && timeOfDay < 22
                      ? "Evening specials are here"
                      : "Late night shopping? We've got you covered"}
              </p>
            </div>
            <Link
              href="/products"
              className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold shadow-lg transition-all hover:scale-105 text-center whitespace-nowrap"
            >
              Browse All Products →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <Link
            href="/cart"
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Shopping Cart</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{cartCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {cartCount === 1 ? 'item' : 'items'} waiting
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            href="/orders"
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">My Orders</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Track your purchases</p>
              </div>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            href="/favorites"
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Favorites</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">4</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Saved for later</p>
              </div>
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Flash Deals Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">⚡ Flash Deals</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">Limited time offers - Up to 31% off</p>
              </div>
            </div>
            <Link
              href="/products"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDeals.map((product) => (
              <div key={product.id} className="relative">
                <div className="absolute -top-3 -right-3 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  -{product.discount}%
                </div>
                <ProductCard {...product} />
              </div>
            ))}
          </div>
        </div>

        {/* Shop by Category */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Electronics', icon: '💻', color: 'from-blue-500 to-cyan-500', href: '/products?category=electronics' },
              { name: 'Audio', icon: '🎧', color: 'from-purple-500 to-pink-500', href: '/products?category=audio' },
              { name: 'Wearables', icon: '⌚', color: 'from-green-500 to-emerald-500', href: '/products?category=wearables' },
              { name: 'Accessories', icon: '🎒', color: 'from-orange-500 to-red-500', href: '/products?category=accessories' },
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className="relative">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{category.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Explore →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Now */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">🔥 Trending Now</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">Most popular products this week</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {trendingProducts.map((product) => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all group">
                <div className="flex gap-6">
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{product.rating}</span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">({product.reviews} reviews)</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">${product.price}</p>
                    <Link
                      href={`/products/${product.id}`}
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Offer Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 dark:from-purple-800 dark:via-pink-800 dark:to-red-800 rounded-2xl p-8 md:p-12 text-white shadow-2xl mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">🎉 Special Weekend Sale!</h2>
              <p className="text-lg text-white/90 mb-4">
                Get up to 50% off on selected items. Limited time only!
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/products"
                  className="px-6 py-3 bg-white text-purple-600 hover:bg-purple-50 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                >
                  Shop Sale Now
                </Link>
                <span className="text-white/80 text-sm">Ends in 2 days</span>
              </div>
            </div>
            <div className="text-8xl">🛍️</div>
          </div>
        </div>
      </div>
    </div>
  );
}

