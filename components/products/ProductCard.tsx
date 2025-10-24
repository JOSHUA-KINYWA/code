'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Rating from '../ui/Rating';
import toast from 'react-hot-toast';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  onAddToCart?: (id: string) => void;
}

export default function ProductCard({
  id,
  name,
  price,
  image,
  rating = 0,
  reviews = 0,
  inStock = true,
  onAddToCart,
}: ProductCardProps) {
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToCart) {
      onAddToCart(id);
    }
    
    // Show success toast
    toast.success(`🛒 ${name} added to cart!`, {
      duration: 2000,
    });
    
    // Small delay to ensure cart state updates
    setTimeout(() => {
      router.push('/cart');
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-shadow duration-200">
      <Link href={`/products/${id}`}>
        <div className="aspect-square bg-gray-200 relative overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          {!inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {name}
          </h3>
          {rating > 0 && (
            <div className="mb-2">
              <Rating rating={rating} showNumber reviews={reviews} size="sm" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">${price.toFixed(2)}</p>
          </div>
        </div>
      </Link>

      <div className="p-4 pt-0">
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            inStock
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}