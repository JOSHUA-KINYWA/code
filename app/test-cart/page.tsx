'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

export default function TestCartPage() {
  const { cartItems, addToCart, cartCount, isInitialized } = useCart();

  const handleTestAdd = () => {
    console.log('TEST: Adding test item to cart');
    try {
      addToCart({
        id: 'test-123',
        name: 'Test Product',
        price: 99.99,
        image: '/placeholder-product.jpg',
        category: 'Test',
      });
      toast.success('Test item added!');
    } catch (error) {
      console.error('TEST: Error adding item:', error);
      toast.error('Failed to add test item');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Cart System Debug
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Cart Status
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p><strong>Initialized:</strong> {isInitialized ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Cart Count:</strong> {cartCount}</p>
            <p><strong>Items in Cart:</strong> {cartItems.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Actions
          </h2>
          <button
            onClick={handleTestAdd}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Test Item to Cart
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Cart Contents
          </h2>
          {cartItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Cart is empty</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-gray-600 dark:text-gray-400">ID: {item.id}</p>
                  <p className="text-gray-600 dark:text-gray-400">Price: ${item.price}</p>
                  <p className="text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4 text-yellow-900 dark:text-yellow-200">
            Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-800 dark:text-yellow-300">
            <li>Open browser console (F12)</li>
            <li>Click "Add Test Item to Cart"</li>
            <li>Check console logs for any errors</li>
            <li>Verify cart count increases</li>
            <li>Check if item appears in "Cart Contents"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

