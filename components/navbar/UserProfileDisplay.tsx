'use client';

import React from 'react';
import { useUser, UserButton } from '@clerk/nextjs';

export default function UserProfileDisplay() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3">
        <div className="animate-pulse">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.firstName || user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User';

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
      <div className="text-right hidden lg:block">
        <div className="flex items-center gap-2 justify-end">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {displayName}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
          {user.emailAddresses[0]?.emailAddress}
        </p>
      </div>

      <div className="relative">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-10 h-10 ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all',
              userButtonPopoverCard: 'shadow-2xl',
              userButtonPopoverActionButton: 'hover:bg-gray-100 dark:hover:bg-gray-700',
            },
          }}
        />
      </div>
    </div>
  );
}

