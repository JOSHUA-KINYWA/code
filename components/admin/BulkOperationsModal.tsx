'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface BulkOperationsModalProps {
  selectedProducts: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkOperationsModal({
  selectedProducts,
  onClose,
  onSuccess,
}: BulkOperationsModalProps) {
  const [action, setAction] = useState('');
  const [category, setCategory] = useState('');
  const [priceChange, setPriceChange] = useState('');
  const [changeType, setChangeType] = useState('percentage');
  const [stock, setStock] = useState('');
  const [stockAction, setStockAction] = useState('set');
  const [loading, setLoading] = useState(false);

  const handleBulkAction = async () => {
    if (!action) {
      toast.error('Please select an action');
      return;
    }

    let data: any = {};

    // Prepare data based on action
    if (action === 'updateCategory' && !category) {
      toast.error('Please enter a category');
      return;
    } else if (action === 'updateCategory') {
      data = { category };
    }

    if (action === 'updatePrice' && !priceChange) {
      toast.error('Please enter a price change value');
      return;
    } else if (action === 'updatePrice') {
      data = { priceChange, changeType };
    }

    if (action === 'updateStock' && !stock) {
      toast.error('Please enter a stock value');
      return;
    } else if (action === 'updateStock') {
      data = { stock, stockAction };
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          productIds: selectedProducts,
          data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform bulk operation');
      }

      const result = await response.json();
      toast.success(`${result.affected} product(s) updated successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Bulk operation error:', error);
      const message = error instanceof Error ? error.message : 'Failed to perform bulk operation';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Bulk Operations
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {selectedProducts.length} product(s) selected
        </p>

        {/* Action Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Action
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose an action...</option>
            <optgroup label="Visibility">
              <option value="activate">Activate Products</option>
              <option value="deactivate">Deactivate Products</option>
            </optgroup>
            <optgroup label="Status">
              <option value="markTrending">Mark as Trending</option>
              <option value="unmarkTrending">Unmark as Trending</option>
              <option value="markFlashDeal">Mark as Flash Deal</option>
              <option value="unmarkFlashDeal">Unmark as Flash Deal</option>
            </optgroup>
            <optgroup label="Modifications">
              <option value="updateCategory">Change Category</option>
              <option value="updatePrice">Update Price</option>
              <option value="updateStock">Update Stock</option>
            </optgroup>
            <optgroup label="Danger Zone">
              <option value="delete">Delete Products</option>
            </optgroup>
          </select>
        </div>

        {/* Category Input */}
        {action === 'updateCategory' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Electronics, Clothing, etc."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Price Update Inputs */}
        {action === 'updatePrice' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Change Type
              </label>
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (KES)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {changeType === 'percentage' ? 'Percentage Change' : 'Amount Change'}
              </label>
              <input
                type="number"
                value={priceChange}
                onChange={(e) => setPriceChange(e.target.value)}
                placeholder={changeType === 'percentage' ? 'e.g., 10 for +10% or -10 for -10%' : 'e.g., 100 for +100 or -100 for -100'}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Use positive numbers to increase price, negative to decrease
              </p>
            </div>
          </div>
        )}

        {/* Stock Update Inputs */}
        {action === 'updateStock' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Action
              </label>
              <select
                value={stockAction}
                onChange={(e) => setStockAction(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="set">Set to Value</option>
                <option value="add">Add to Existing</option>
                <option value="subtract">Subtract from Existing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Value
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g., 100"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Delete Warning */}
        {action === 'delete' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-400 text-sm font-medium">
              ⚠️ Warning: This action cannot be undone. All {selectedProducts.length} selected product(s) will be permanently deleted.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkAction}
            disabled={loading || !action}
            className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              action === 'delete'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : action === 'delete' ? 'Delete Products' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}





