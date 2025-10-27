'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { useFavorites } from '@/context/FavoritesContext';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { favorites, removeFromFavorites } = useFavorites();

  // Protect this route - require authentication
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        toast.error('🔒 Please sign in to view your favorites');
        router.push('/sign-in');
        return;
      }

      // Block admin from accessing regular user favorites
      const userRole = user?.publicMetadata?.role as string || 'user';
      
      if (userRole === 'admin') {
        toast.error('⚠️ Admins cannot access user favorites. Use Admin Dashboard.');
        router.push('/admin');
        return;
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Show loading while checking auth
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  const removeFavorite = (id: string) => {
    const product = favorites.find(item => item.id === id);
    removeFromFavorites(id);
    
    toast.success(`❤️ ${product?.name || 'Item'} removed from favorites`, {
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Favorites ❤️</h1>
          <p className="text-gray-600 mt-2">
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">No favorites yet</h2>
            <p className="mt-2 text-gray-600">Start adding products you love to your favorites</p>
            <Link 
              href="/products" 
              className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden group relative">
                <button
                  onClick={() => removeFavorite(product.id)}
                  className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors"
                  aria-label="Remove from favorites"
                >
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>

                <Link href={`/products/${product.id}`}>
                  <div className="aspect-square bg-gray-200 relative overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      {product.category}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </p>
                      {product.inStock ? (
                        <span className="text-xs text-green-600 font-medium">In Stock</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="p-4 pt-0">
                  <button
                    disabled={!product.inStock}
                    className={`w-full py-2 rounded-lg font-medium transition-colors ${
                      product.inStock
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {favorites.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Share your favorites</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Create a wishlist link to share with friends and family
                </p>
              </div>
              <button className="mt-4 sm:mt-0 bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share List
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
