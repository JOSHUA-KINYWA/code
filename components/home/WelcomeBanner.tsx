'use client';

import React from 'react';
import Link from 'next/link';

export default function WelcomeBanner() {
  const timeOfDay = new Date().getHours();
  const greeting = 
    timeOfDay < 12 ? '🌅 Good morning' : 
    timeOfDay < 18 ? '☀️ Good afternoon' : 
    '🌙 Good evening';

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">
            {greeting}!
          </h2>
          <p className="text-blue-100 dark:text-blue-200">
            Welcome to your shopping experience
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/products"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors font-medium"
          >
            Shop Now
          </Link>
          <Link
            href="/about"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors font-medium"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}

