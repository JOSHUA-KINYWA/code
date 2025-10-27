'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface CancelOrderModalProps {
  orderId: string;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCELLATION_REASONS = [
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'found_better_price', label: 'Found a better price elsewhere' },
  { value: 'wrong_item', label: 'Ordered wrong item by mistake' },
  { value: 'shipping_too_long', label: 'Shipping takes too long' },
  { value: 'payment_issues', label: 'Payment issues' },
  { value: 'duplicate_order', label: 'Duplicate order' },
  { value: 'other', label: 'Other reason' },
];

export default function CancelOrderModal({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    const reason = selectedReason === 'other' ? customReason : 
      CANCELLATION_REASONS.find(r => r.value === selectedReason)?.label || '';

    if (!reason.trim()) {
      toast.error('Please select or enter a cancellation reason');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      toast.success('Order cancelled successfully!');
      
      // Show refund info if available
      if (data.refund?.details) {
        const refundInfo = data.refund.details;
        if (refundInfo.status === 'succeeded' || refundInfo.message) {
          toast.success(refundInfo.message || 'Refund initiated successfully', {
            duration: 5000,
          });
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Cancel Order</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Warning Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">
                Are you sure you want to cancel this order?
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Order #{orderNumber} will be cancelled and cannot be recovered.
                {' '}Any payment will be refunded within 5-10 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Why are you cancelling? <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {CANCELLATION_REASONS.map((reason) => (
              <label
                key={reason.value}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="ml-3 text-sm text-gray-700">{reason.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Reason Input */}
        {selectedReason === 'other' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please specify your reason
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              maxLength={200}
              placeholder="Tell us why you're cancelling..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              {customReason.length}/200 characters
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep Order
          </button>
          <button
            onClick={handleCancel}
            disabled={isSubmitting || !selectedReason || (selectedReason === 'other' && !customReason.trim())}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Cancelling...
              </>
            ) : (
              'Cancel Order'
            )}
          </button>
        </div>

        {/* Refund Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          💡 Refunds are processed automatically and will appear in your account within 5-10 business days
        </p>
      </div>
    </div>
  );
}





