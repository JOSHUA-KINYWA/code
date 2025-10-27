'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import ProductCard from '../products/ProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  rating: number;
  reviewCount: number;
  category: string;
  stock: number;
  isActive: boolean;
  isTrending: boolean;
  isFlashDeal: boolean;
}

export default function LoggedInHome() {
  const { user } = useUser();
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();
  const [featuredDeals, setFeaturedDeals] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flashDealsPage, setFlashDealsPage] = useState(1);
  const [ordersCount, setOrdersCount] = useState(0);
  const flashDealsPerPage = 4;
  
  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';

  // Dynamic time-based greeting
  const timeOfDay = new Date().getHours();
  const greeting = 
    timeOfDay >= 5 && timeOfDay < 12 ? 'Good morning' : 
    timeOfDay >= 12 && timeOfDay < 17 ? 'Good afternoon' : 
    timeOfDay >= 17 && timeOfDay < 22 ? 'Good evening' : 
    'Welcome back';

  const displayName = user?.firstName || 'there';

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data: Product[] = await response.json();
          const activeProducts = data.filter(p => p.isActive);
          
          // Flash Deals: products marked as flash deals by admin (show all, no limit)
          const deals = activeProducts.filter(p => p.isFlashDeal);
          setFeaturedDeals(deals);
          
          // Trending: products marked as trending by admin
          const trending = activeProducts.filter(p => p.isTrending).slice(0, 2);
          setTrendingProducts(trending);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch user orders count
  useEffect(() => {
    const fetchOrdersCount = async () => {
      if (!user || isAdmin) return; // Don't fetch for non-logged in users or admins
      
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          setOrdersCount(data.length);
        }
      } catch (error) {
        console.error('Error fetching orders count:', error);
      }
    };

    fetchOrdersCount();
  }, [user, isAdmin]);

  // Calculate pagination for Flash Deals
  const totalFlashDealsPages = Math.ceil(featuredDeals.length / flashDealsPerPage);
  const startIndex = (flashDealsPage - 1) * flashDealsPerPage;
  const endIndex = startIndex + flashDealsPerPage;
  const currentFlashDeals = featuredDeals.slice(startIndex, endIndex);

  // Reset to page 1 when flash deals data changes
  useEffect(() => {
    setFlashDealsPage(1);
  }, [featuredDeals.length]);

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
                {isAdmin 
                  ? "Browse your store and manage products"
                  : timeOfDay >= 5 && timeOfDay < 12 
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
        {/* Quick Stats - Different for Admin vs Regular User */}
        {isAdmin ? (
          // Admin Stats
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <Link
              href="/admin/products"
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{featuredDeals.length + trendingProducts.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">In your store</p>
                </div>
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/admin"
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Admin Dashboard</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">📊</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Manage your store</p>
                </div>
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Store Overview</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{featuredDeals.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Flash deals active</p>
                </div>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Regular User Stats
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
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{ordersCount}</p>
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
              href="/favourite"
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Favorites</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{favoritesCount}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {favoritesCount === 1 ? 'item saved' : 'items saved'}
                  </p>
                </div>
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Flash Deals Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">⚡ Flash Deals</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                  {featuredDeals.length > 0 ? `${featuredDeals.length} amazing deals - Up to 31% off` : 'Limited time offers'}
                </p>
              </div>
            </div>
            {featuredDeals.length > flashDealsPerPage && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, featuredDeals.length)} of {featuredDeals.length}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80 animate-pulse"></div>
              ))
            ) : featuredDeals.length === 0 ? (
              <div className="col-span-4 text-center py-12 text-gray-500 dark:text-gray-400">
                No deals available at the moment
              </div>
            ) : (
              currentFlashDeals.map((product) => {
                const discount = product.comparePrice 
                  ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                  : 0;
                return (
                  <div key={product.id} className="relative">
                    {discount > 0 && (
                      <div className="absolute -top-3 -right-3 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        -{discount}%
                      </div>
                    )}
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.images[0] || '/placeholder-product.jpg'}
                      images={product.images}
                      rating={product.rating}
                      reviews={product.reviewCount}
                      stock={product.stock}
                      category={product.category}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Flash Deals Pagination */}
          {!isLoading && featuredDeals.length > flashDealsPerPage && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {flashDealsPage} of {totalFlashDealsPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFlashDealsPage(prev => Math.max(prev - 1, 1))}
                  disabled={flashDealsPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(totalFlashDealsPages)].map((_, i) => {
                    const page = i + 1;
                    // Show first, last, current, and pages around current
                    if (
                      page === 1 ||
                      page === totalFlashDealsPages ||
                      (page >= flashDealsPage - 1 && page <= flashDealsPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setFlashDealsPage(page)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                            page === flashDealsPage
                              ? 'bg-red-500 text-white shadow-lg'
                              : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      (page === flashDealsPage - 2 && page > 1) ||
                      (page === flashDealsPage + 2 && page < totalFlashDealsPages)
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-400 dark:text-gray-600">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setFlashDealsPage(prev => Math.min(prev + 1, totalFlashDealsPages))}
                  disabled={flashDealsPage === totalFlashDealsPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
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
            {isLoading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-48 animate-pulse"></div>
              ))
            ) : trendingProducts.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">
                No trending products available
              </div>
            ) : (
              trendingProducts.map((product) => (
                <div key={product.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all group">
                  <div className="flex gap-6">
                    <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
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
                            <span className="text-sm text-gray-500 dark:text-gray-400">({product.reviewCount} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">${product.price.toFixed(2)}</p>
                      <Link
                        href={`/products/${product.id}`}
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
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


