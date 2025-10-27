'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Rating from '../ui/Rating';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  stock?: number; // Add stock prop
  category?: string;
  onAddToCart?: (id: string) => void;
}

export default function ProductCard({
  id,
  name,
  price,
  image,
  images = [],
  rating = 0,
  reviews = 0,
  inStock = true,
  stock = 0,
  category,
  onAddToCart,
}: ProductCardProps) {
  // Calculate inStock based on stock value if provided
  const isInStock = stock !== undefined ? stock > 0 : inStock;
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  // Check if this product is favorited
  const isProductFavorited = isFavorite(id);
  
  // Use images array if available, otherwise use single image
  const displayImages = images.length > 0 ? images : [image];
  const currentImage = displayImages[currentImageIndex];

  // Auto-swipe images every 3 seconds
  useEffect(() => {
    if (displayImages.length <= 1) return; // Don't auto-swipe if only one image

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [displayImages.length]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if product is in stock
    if (!isInStock) {
      toast.error('❌ This product is out of stock');
      return;
    }
    
    // Check if user is signed in
    if (!isSignedIn) {
      toast.error('🔒 Please sign in to add items to cart', {
        duration: 3000,
      });
      setTimeout(() => {
        router.push('/sign-in');
      }, 1500);
      return;
    }
    
    // Debug logging
    console.log('Adding to cart:', { id, name, price, image, category });
    
    // Add to cart using context
    try {
      addToCart({
        id,
        name,
        price,
        image: currentImage, // Use the currently displayed image
        category,
      });
      console.log('Successfully added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
      return;
    }
    
    if (onAddToCart) {
      onAddToCart(id);
    }
    
    // Show success toast
    toast.success(`🛒 ${name} added to cart!`, {
      duration: 2000,
    });
    
    // Redirect to cart page
    setTimeout(() => {
      router.push('/cart');
    }, 500);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isSignedIn) {
      toast.error('Please sign in to add favorites');
      router.push('/sign-in');
      return;
    }

    if (isAdmin) {
      toast.error('Admins cannot add favorites');
      return;
    }

    if (isProductFavorited) {
      removeFromFavorites(id);
      toast.success(`❤️ ${name} removed from favorites`);
    } else {
      addToFavorites({
        id,
        name,
        price,
        image: currentImage,
        category: category || '',
        inStock: isInStock,
      });
      toast.success(`💖 ${name} added to favorites!`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-shadow duration-200">
      <Link href={`/products/${id}`}>
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
          {/* Product Image */}
          {currentImage ? (
            <img
              src={currentImage}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback placeholder */}
          <div className={`${currentImage ? 'hidden' : ''} w-full h-full flex items-center justify-center text-gray-400 absolute inset-0`}>
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Favorite Button (only for non-admin users) */}
          {!isAdmin && (
            <button
              onClick={handleToggleFavorite}
              className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-2 rounded-full shadow-md transition-all duration-200 z-10 group/fav"
              aria-label={isProductFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className={`w-5 h-5 transition-all duration-200 ${
                  isProductFavorited
                    ? 'fill-red-500 text-red-500 scale-110'
                    : 'fill-none text-gray-600 dark:text-gray-400 group-hover/fav:text-red-500 group-hover/fav:scale-110'
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
          )}

          {/* Navigation Arrows (only show if multiple images) */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                aria-label="Next image"
              >
                <svg className="w-4 h-4 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => handleDotClick(e, index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'bg-blue-600 w-4'
                        : 'bg-white/80 hover:bg-white'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>

              {/* Image Counter */}
              <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {currentImageIndex + 1} / {displayImages.length}
              </div>
            </>
          )}

          {/* Out of Stock Overlay */}
          {!isInStock && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-20">
              <span className="text-white font-bold text-xl mb-2">Out of Stock</span>
              <span className="text-white/80 text-sm">Currently Unavailable</span>
            </div>
          )}

          {/* Stock Badge */}
          {isInStock && stock !== undefined && stock <= 5 && stock > 0 && (
            <div className="absolute top-2 left-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
              Only {stock} left!
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {name}
          </h3>
          {rating > 0 && (
            <div className="mb-2">
              <Rating rating={rating} showNumber reviews={reviews} size="sm" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${price.toFixed(2)}</p>
            {/* Stock status text */}
            {stock !== undefined && (
              <span className={`text-xs font-medium ${isInStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isInStock ? `${stock} in stock` : 'Out of stock'}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Hide Add to Cart button for admins */}
      {!isAdmin && (
        <div className="p-4 pt-0">
          <button
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={`w-full py-2 rounded-lg font-medium transition-colors ${
              isInStock
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {isInStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      )}
    </div>
  );
}