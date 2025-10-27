'use client';

import React, { useState } from 'react';
import Rating from '../ui/Rating';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useUser } from '@clerk/nextjs';

interface ProductDetailsProps {
  name: string;
  price: number;
  rating: number;
  reviews: number;
  description: string;
  inStock: boolean;
  category: string;
  onAddToCart: () => void;
  onAddToFavorites: () => void;
  isFavorited?: boolean;
}

export default function ProductDetails({
  name,
  price,
  rating,
  reviews,
  description,
  inStock,
  category,
  onAddToCart,
  onAddToFavorites,
  isFavorited = false,
}: ProductDetailsProps) {
  const { user } = useUser();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';

  const sizes = ['S', 'M', 'L', 'XL'];
  const colors = ['Black', 'White', 'Blue', 'Red'];

  return (
    <div className="space-y-6">
      {/* Category and Stock */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 uppercase tracking-wide">{category}</span>
        {inStock ? (
          <Badge variant="success">In Stock</Badge>
        ) : (
          <Badge variant="error">Out of Stock</Badge>
        )}
      </div>

      {/* Product Name */}
      <h1 className="text-3xl font-bold text-gray-900">{name}</h1>

      {/* Rating */}
      <div className="flex items-center gap-4">
        <Rating rating={rating} showNumber reviews={reviews} />
        <a href="#reviews" className="text-blue-600 hover:underline text-sm">
          See all {reviews} reviews
        </a>
      </div>

      {/* Price */}
      <div className="border-t border-b border-gray-200 py-6">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-gray-900">${price.toFixed(2)}</span>
          <span className="text-lg text-gray-500 line-through">$399.99</span>
          <Badge variant="error">25% OFF</Badge>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Size</h3>
          <div className="flex gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                  selectedSize === size
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Color</h3>
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                  selectedColor === color
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity - Hide for admins */}
      {!isAdmin && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quantity</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              -
            </button>
            <span className="w-16 text-center font-medium text-lg text-gray-900 dark:text-white">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons - Hide for admins */}
      {!isAdmin && (
        <div className="flex gap-4">
          <Button
            onClick={onAddToCart}
            disabled={!inStock}
            className="flex-1"
            size="lg"
          >
            Add to Cart
          </Button>
          <button
            onClick={onAddToFavorites}
            className={`w-14 h-12 border-2 rounded-lg flex items-center justify-center transition-all ${
              isFavorited
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-red-500'
            }`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              className={`w-6 h-6 transition-all ${
                isFavorited
                  ? 'fill-red-500 text-red-500 scale-110'
                  : 'fill-none text-gray-600 dark:text-gray-400 hover:text-red-500 hover:scale-110'
              }`}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      )}
      
      {/* Admin viewing message */}
      {isAdmin && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">You are viewing this product as an admin. Purchase features are disabled.</span>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="border-t border-gray-200 pt-6 space-y-3 text-sm">
        <div className="flex items-center text-gray-600">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Free shipping on orders over $50
        </div>
        <div className="flex items-center text-gray-600">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          30-day return policy
        </div>
        <div className="flex items-center text-gray-600">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Secure payment processing
        </div>
      </div>
    </div>
  );
}
