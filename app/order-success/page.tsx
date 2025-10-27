'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function OrderSuccessPage() {
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const { clearCart } = useCart();
  const hasCleared = useRef(false); // Prevent multiple clearCart calls

  useEffect(() => {
    // Clear the cart only once when the page first loads
    if (!hasCleared.current) {
      clearCart();
      hasCleared.current = true;
    }
    
    // Generate order number on client side to avoid hydration mismatch
    setOrderNumber(`ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    
    const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    setEstimatedDelivery(deliveryDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - we only want to run this once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
            <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for your purchase! Your order has been confirmed and will be shipped soon.
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Order Number:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {orderNumber ? `#${orderNumber}` : '#...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Delivery:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {estimatedDelivery || '...'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/orders" className="block">
              <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                View Order Details
              </button>
            </Link>
            <Link href="/products" className="block">
              <button className="w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Continue Shopping
              </button>
            </Link>
          </div>

          {/* Email Notification */}
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            A confirmation email has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}

