import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

export default function EmptyCart() {
  return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <svg
        className="mx-auto h-24 w-24 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      <h2 className="mt-4 text-2xl font-semibold text-gray-900">Your cart is empty</h2>
      <p className="mt-2 text-gray-600">Add some products to get started</p>
      <Link href="/products">
        <Button className="mt-6">Continue Shopping</Button>
      </Link>
    </div>
  );
}
