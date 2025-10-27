'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const [isReported, setIsReported] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  const handleReportError = async () => {
    try {
      // In production, send error to logging service (e.g., Sentry, LogRocket)
      await fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail if error reporting fails
      });
      setIsReported(true);
    } catch (err) {
      console.error('Failed to report error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-red-900/20 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 dark:bg-red-600 rounded-full animate-ping opacity-20"></div>
              <div className="relative bg-red-100 dark:bg-red-900/50 p-4 rounded-full">
                <svg
                  className="w-12 h-12 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Something Went Wrong
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              We encountered an unexpected error. Our team has been notified.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please try again or contact support if the problem persists.
            </p>
          </div>

          {/* Error Details Toggle */}
          {error.message && (
            <div className="mb-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {showDetails ? 'Hide' : 'Show'} Error Details
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    showDetails ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showDetails && (
                <div className="mt-2 p-4 bg-gray-900 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-mono text-red-400 break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs font-mono text-gray-500 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>

            <Link
              href="/"
              className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </Link>
          </div>

          {/* Report Error Button */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {!isReported ? (
              <button
                onClick={handleReportError}
                className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Report This Error
              </button>
            ) : (
              <div className="flex items-center justify-center text-sm text-green-600 dark:text-green-400">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Error reported. Thank you!
              </div>
            )}
          </div>

          {/* Help Links */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Need help?
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/contact"
                className="text-xs text-pink-600 dark:text-pink-400 hover:underline"
              >
                Contact Support
              </Link>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <Link
                href="/about"
                className="text-xs text-pink-600 dark:text-pink-400 hover:underline"
              >
                Help Center
              </Link>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <a
                href="https://wa.me/254758036936"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pink-600 dark:text-pink-400 hover:underline"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





