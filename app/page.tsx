'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import Categories from '@/components/home/Categories';
import LoggedInHome from '@/components/home/LoggedInHome';

export default function HomePage() {
  const { isSignedIn } = useUser();

  // Show professional logged-in experience
  if (isSignedIn) {
    return <LoggedInHome />;
  }

  // Show regular landing page for logged-out users
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <Categories />
    </>
  );
}
