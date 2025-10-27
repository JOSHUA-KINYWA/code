'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  favoritesCount: number;
  addToFavorites: (product: FavoriteProduct) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  // Load and sync favorites from database when user signs in
  useEffect(() => {
    const loadFavorites = async () => {
      if (isSignedIn && user) {
        const userRole = user.publicMetadata?.role as string || 'user';
        
        // Only load favorites for regular users, not admins
        if (userRole === 'user') {
          try {
            setIsLoading(true);
            
            // Check if we need to sync localStorage to database
            if (!synced) {
              const userId = user.id;
              const stored = localStorage.getItem(`favorites_${userId}`);
              
              if (stored) {
                // We have localStorage data - sync it to database
                try {
                  const localFavorites = JSON.parse(stored);
                  const productIds = localFavorites.map((f: FavoriteProduct) => f.id);
                  
                  const response = await fetch('/api/favorites/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productIds }),
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    // Map database favorites to FavoriteProduct format
                    const dbFavorites = data.favorites.map((f: any) => ({
                      id: f.product.id,
                      name: f.product.name,
                      price: f.product.price,
                      image: f.product.images[0] || '/placeholder.png',
                      category: f.product.category,
                      inStock: f.product.stock > 0,
                    }));
                    setFavorites(dbFavorites);
                    localStorage.removeItem(`favorites_${userId}`); // Clear old localStorage
                  }
                } catch (error) {
                  console.error('Error syncing favorites:', error);
                }
              } else {
                // No localStorage data - fetch from database
                const response = await fetch('/api/favorites');
                if (response.ok) {
                  const data = await response.json();
                  const dbFavorites = data.map((f: any) => ({
                    id: f.product.id,
                    name: f.product.name,
                    price: f.product.price,
                    image: f.product.images[0] || '/placeholder.png',
                    category: f.product.category,
                    inStock: f.product.stock > 0,
                  }));
                  setFavorites(dbFavorites);
                }
              }
              
              setSynced(true);
            }
          } catch (error) {
            console.error('Error loading favorites:', error);
            setFavorites([]);
          } finally {
            setIsLoading(false);
          }
        } else {
          // Clear favorites for admin users
          setFavorites([]);
        }
      } else {
        // Clear favorites when user signs out
        setFavorites([]);
        setSynced(false);
      }
    };

    loadFavorites();
  }, [isSignedIn, user, synced]);

  const addToFavorites = async (product: FavoriteProduct) => {
    // Check if already in favorites
    if (favorites.some(item => item.id === product.id)) {
      return;
    }

    // Optimistic update
    setFavorites(prev => [...prev, product]);

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      if (!response.ok) {
        // Revert on error
        setFavorites(prev => prev.filter(item => item.id !== product.id));
        toast.error('Failed to add to favorites');
      }
    } catch (error) {
      // Revert on error
      setFavorites(prev => prev.filter(item => item.id !== product.id));
      toast.error('Failed to add to favorites');
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (productId: string) => {
    // Optimistic update
    const previousFavorites = [...favorites];
    setFavorites(prev => prev.filter(item => item.id !== productId));

    try {
      const response = await fetch(`/api/favorites?productId=${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on error
        setFavorites(previousFavorites);
        toast.error('Failed to remove from favorites');
      }
    } catch (error) {
      // Revert on error
      setFavorites(previousFavorites);
      toast.error('Failed to remove from favorites');
      console.error('Error removing from favorites:', error);
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some(item => item.id === productId);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoritesCount: favorites.length,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        clearFavorites,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}


