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
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80" 
                alt="Shopping Experience" 
                className="w-full h-[500px] object-cover rounded-2xl"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-6 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      <p className="font-bold text-lg">Quality Guaranteed</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Free shipping on orders over $50</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
