import React from 'react';
import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import Categories from '@/components/home/Categories';
import WelcomeBanner from '@/components/home/WelcomeBanner';

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <WelcomeBanner />
      </div>
      <FeaturedProducts />
      <Categories />
    </>
  );
}
