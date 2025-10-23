'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface SignOutLinkProps {
  onSignOut?: () => void;
}

export default function SignOutLink({ onSignOut }: SignOutLinkProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    // Call the provided onSignOut function if it exists
    if (onSignOut) {
      await onSignOut();
    } else {
      // Default sign out behavior
      // In a real app, this would call your auth provider's sign out method
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    
    // Redirect to home page
    router.push('/');
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      Sign Out
    </button>
  );
}
