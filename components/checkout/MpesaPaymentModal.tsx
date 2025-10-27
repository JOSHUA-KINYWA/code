'use client';

import { useState, useEffect } from 'react';

type PaymentStatus = 'initiating' | 'pending' | 'success' | 'failed';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: PaymentStatus;
  amount: number;
  phoneNumber: string;
  transactionId?: string;
  errorMessage?: string;
}

export default function MpesaPaymentModal({
  isOpen,
  onClose,
  status,
  amount,
  phoneNumber,
  transactionId,
  errorMessage,
}: MpesaPaymentModalProps) {
  const [dots, setDots] = useState('');

  // Animated dots for loading
  useEffect(() => {
    if (status === 'pending' || status === 'initiating') {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'initiating':
      case 'pending':
        return (
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-orange-200 dark:border-orange-900 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-orange-500 dark:border-orange-400 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'initiating':
        return 'Initiating Payment';
      case 'pending':
        return 'Waiting for Payment';
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed!';
      default:
        return '';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'initiating':
        return `Processing your payment${dots}`;
      case 'pending':
        return 'Please check your phone and enter your M-Pesa PIN to complete the payment.';
      case 'success':
        return 'Your payment has been processed successfully!';
      case 'failed':
        return errorMessage || 'Your payment could not be processed.';
      default:
        return '';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header with M-Pesa branding */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-xl">M</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">M-Pesa Payment</h3>
                <p className="text-green-100 text-sm">Safaricom</p>
              </div>
            </div>
            <div className="text-white text-right">
              <p className="text-sm opacity-90">Amount</p>
              <p className="font-bold text-lg">{formatAmount(amount)}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {getStatusIcon()}

          <h2 className={`text-2xl font-bold text-center mb-3 ${
            status === 'success' ? 'text-green-600 dark:text-green-400' :
            status === 'failed' ? 'text-red-600 dark:text-red-400' :
            'text-gray-900 dark:text-white'
          }`}>
            {getStatusTitle()}
          </h2>

          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            {getStatusMessage()}
          </p>

          {/* Details */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mobile Number:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{phoneNumber}</span>
            </div>
            {transactionId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID:</span>
                <span className="font-mono text-xs text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {transactionId}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">{formatAmount(amount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          {(status === 'success' || status === 'failed') && (
            <button
              onClick={onClose}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                status === 'success'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {status === 'success' ? 'Continue' : 'Close'}
            </button>
          )}

          {(status === 'pending' || status === 'initiating') && (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {status === 'initiating' ? 'Please wait...' : 'This may take a few moments'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            🔒 Secured by M-Pesa • Safaricom PLC
          </p>
        </div>
      </div>
    </div>
  );
}






