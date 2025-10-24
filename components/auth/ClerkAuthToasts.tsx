'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

export default function ClerkAuthToasts() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    // Check if user just signed in
    if (isSignedIn && user) {
      const hasShownWelcome = sessionStorage.getItem('welcome_shown');
      
      if (!hasShownWelcome) {
        const displayName = user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User';
        
        toast.success(`Welcome back, ${displayName}! 👋`, {
          duration: 3000,
          icon: '🎉',
        });
        
        sessionStorage.setItem('welcome_shown', 'true');
      }
    } else {
      // User signed out, clear the flag
      sessionStorage.removeItem('welcome_shown');
    }
  }, [isSignedIn, user]);

  return null; // This component doesn't render anything
}

