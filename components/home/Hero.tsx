'use client';

import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';
import { useUser } from '@clerk/nextjs';

export default function Hero() {
  const { isSignedIn } = useUser();

  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {isSignedIn 
                ? 'Welcome Back! Discover More Amazing Products' 
                : 'Discover Amazing Products'}
            </h1>
            <p className="text-lg md:text-xl mb-8 text-blue-100 dark:text-blue-200">
              {isSignedIn
                ? 'Continue your shopping journey with exclusive deals and personalized recommendations just for you.'
                : 'Shop the latest trends and find the perfect items for your lifestyle. Quality products, unbeatable prices.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products">
                <Button size="lg" variant="secondary" className="font-semibold">
                  {isSignedIn ? 'Continue Shopping' : 'Shop Now'}
                </Button>
              </Link>
              {isSignedIn ? (
                <Link href="/orders">
                  <Button size="lg" variant="ghost" className="text-white border-white hover:bg-white/10 font-semibold">
                    My Orders
                  </Button>
                </Link>
              ) : (
                <Link href="/about">
                  <Button size="lg" variant="ghost" className="text-white border-white hover:bg-white/10 font-semibold">
                    Learn More
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm">
              <div className="aspect-square bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-32 h-32 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
