'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export default function Logo() {
  const { user } = useUser();
  
  // Check if user is admin
  const userRole = user?.publicMetadata?.role as string || 'user';
  const isAdmin = userRole === 'admin';
  
  // Redirect to admin dashboard if admin, otherwise to home
  const href = isAdmin ? '/admin' : '/';
  
  return (
    <Link href={href} className="flex items-center space-x-2">
      <div className={`w-10 h-10 bg-gradient-to-br ${isAdmin ? 'from-orange-600 to-red-600' : 'from-blue-600 to-blue-800'} rounded-lg flex items-center justify-center`}>
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isAdmin ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          )}
        </svg>
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        {isAdmin ? 'Admin' : 'Shop'}
      </span>
    </Link>
  );
}
