'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useCart } from '@/context/CartContext';

export default function WelcomeBanner() {
  const { user, isSignedIn } = useUser();
  const { cartCount } = useCart();
  
  // Dynamic time-based greeting
  const timeOfDay = new Date().getHours();
  const greeting = 
    timeOfDay >= 5 && timeOfDay < 12 ? 'Good morning' : 
    timeOfDay >= 12 && timeOfDay < 17 ? 'Good afternoon' : 
    timeOfDay >= 17 && timeOfDay < 22 ? 'Good evening' : 
    'Welcome back';

  const greetingIcon = 
    timeOfDay >= 5 && timeOfDay < 12 ? '🌅' : 
    timeOfDay >= 12 && timeOfDay < 17 ? '☀️' : 
    timeOfDay >= 17 && timeOfDay < 22 ? '🌙' : 
    '✨';

  const displayName = user?.firstName || user?.username || 'there';

  if (isSignedIn) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700 rounded-2xl shadow-2xl mb-12">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative p-8 md:p-10">
          {/* Greeting Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{greetingIcon}</span>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {greeting}, {displayName}!
                  </h2>
                  <p className="text-white/90 text-lg mt-1">
                    {timeOfDay >= 5 && timeOfDay < 12 
                      ? "Let's start your day with great deals" 
                      : timeOfDay >= 12 && timeOfDay < 17 
                        ? "Perfect time to discover new arrivals"
                        : timeOfDay >= 17 && timeOfDay < 22
                          ? "Unwind with some shopping therapy"
                          : "Thanks for visiting us"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-md rounded-xl px-6 py-4 text-center border border-white/30">
                <div className="text-3xl font-bold text-white">{cartCount}</div>
                <div className="text-white/90 text-sm font-medium">In Cart</div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/products"
              className="group bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-xl p-4 transition-all border border-white/20 hover:border-white/40 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm">Browse</span>
              </div>
            </Link>

            <Link
              href="/cart"
              className="group bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-xl p-4 transition-all border border-white/20 hover:border-white/40 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-white font-semibold text-sm">Cart</span>
              </div>
            </Link>

            <Link
              href="/orders"
              className="group bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-xl p-4 transition-all border border-white/20 hover:border-white/40 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm">Orders</span>
              </div>
            </Link>

            <Link
              href="/favorites"
              className="group bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-xl p-4 transition-all border border-white/20 hover:border-white/40 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm">Favorites</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged out version - simpler but still nice
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white rounded-2xl shadow-xl p-8 mb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            {greetingIcon} {greeting}!
          </h2>
          <p className="text-blue-100 dark:text-blue-200 text-lg">
            Welcome to your shopping experience. Sign in for personalized recommendations.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/products"
            className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-semibold shadow-lg hover:scale-105 text-center"
          >
            Shop Now
          </Link>
          <Link
            href="/sign-in"
            className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all font-semibold border-2 border-white/40 hover:border-white/60 text-center"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

