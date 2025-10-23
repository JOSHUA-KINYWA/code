'use client';

import React from 'react';
import Image from 'next/image';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({
  id,
  name,
  price,
  quantity,
  image,
  size,
  color,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  return (
    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-md relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        {color && <p className="text-sm text-gray-600 mt-1">Color: {color}</p>}
        {size && <p className="text-sm text-gray-600">Size: {size}</p>}
        <p className="text-lg font-bold text-gray-900 mt-2">${price.toFixed(2)}</p>
      </div>

      <div className="flex flex-col items-end space-y-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateQuantity(id, quantity - 1)}
            className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button
            onClick={() => onUpdateQuantity(id, quantity + 1)}
            className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            +
          </button>
        </div>
        <button
          onClick={() => onRemove(id)}
          className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
