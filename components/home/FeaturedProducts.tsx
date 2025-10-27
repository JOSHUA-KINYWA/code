'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '../products/ProductCard';
import { useUser } from '@clerk/nextjs';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  rating: number;
  reviewCount: number;
  category: string;
  stock: number;
}

export default function FeaturedProducts() {
  const { user, isSignedIn } = useUser();
  const displayName = user?.firstName || user?.username || 'there';
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          // Show only 4 active products
          setProducts(data.filter((p: Product) => p.isActive).slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isSignedIn ? `Recommended for You, ${displayName}` : 'Featured Products'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isSignedIn 
                ? 'Products picked just for you based on trending items' 
                : 'Check out our most popular items'}
            </p>
          </div>
          <Link
            href="/products"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center whitespace-nowrap"
          >
            View All Products
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80 animate-pulse"></div>
            ))
          ) : products.length === 0 ? (
            <div className="col-span-4 text-center py-12 text-gray-500 dark:text-gray-400">
              No products available
            </div>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.images[0] || '/placeholder-product.jpg'}
                images={product.images}
                rating={product.rating}
                reviews={product.reviewCount}
                inStock={product.stock > 0}
                category={product.category}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
