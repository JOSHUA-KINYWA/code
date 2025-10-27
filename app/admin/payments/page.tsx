'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/global/LoadingSpinner';

interface PendingPayment {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  ageInHours: number;
  ageInMinutes: number;
  isStuck: boolean;
  isWarning: boolean;
  payment: {
    id: string;
    status: string;
    phoneNumber: string;
    checkoutRequestID?: string;
    stripePaymentIntentId?: string;
    resultCode?: string;
    resultDesc?: string;
    lastUpdated: string;
  } | null;
}

interface Summary {
  total: number;
  stuckPayments: number;
  warningPayments: number;
  recentPayments: number;
  totalAmount: number;
  byMethod: {
    mpesa: number;
    stripe: number;
    unknown: number;
  };
}

interface PaymentLog {
  id: string;
  orderId: string;
  orderNumber: string;
  action: string;
  status: string;
  method: string;
  initiatedBy: {
    id: string | null;
    name: string;
    email: string;
    role: string | null;
  };
  previousStatus: string | null;
  newStatus: string | null;
  errorMessage: string | null;
  details: any;
  createdAt: string;
}

export default function AdminPendingPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [autoCancelling, setAutoCancelling] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
  }, [selectedFilter]);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') {
        params.append('method', selectedFilter);
      }

      const response = await fetch(`/api/admin/payments/pending?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending payments');
      }

      const data = await response.json();
      setPayments(data.orders);
      setSummary(data.summary);
    } catch (error: any) {
      console.error('Error fetching pending payments:', error);
      toast.error(error.message || 'Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentLogs = async (orderId?: string) => {
    try {
      setLogsLoading(true);
      const params = new URLSearchParams();
      if (orderId) {
        params.append('orderId', orderId);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/admin/payments/logs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setShowLogsModal(true);
    } catch (error: any) {
      console.error('Error fetching payment logs:', error);
      toast.error('Failed to load payment logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const verifyPayment = async (orderId: string) => {
    try {
      setVerifying(orderId);
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment verified successfully!');
        fetchPendingPayments(); // Refresh list
      } else {
        toast.error(data.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setVerifying(null);
    }
  };

  const runAutoCancellation = async () => {
    if (!confirm('This will cancel all orders with pending payments older than 24 hours. Continue?')) {
      return;
    }

    try {
      setAutoCancelling(true);
      const response = await fetch('/api/payments/auto-cancel', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${data.cancelled} orders cancelled successfully`);
        fetchPendingPayments(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to run auto-cancellation');
      }
    } catch (error: any) {
      console.error('Error running auto-cancellation:', error);
      toast.error('Failed to run auto-cancellation');
    } finally {
      setAutoCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getAgeColor = (payment: PendingPayment) => {
    if (payment.isStuck) return 'text-red-600 font-bold';
    if (payment.isWarning) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading pending payments..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pending Payments Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and verify pending payments, auto-cancel expired orders
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total Pending</div>
              <div className="text-3xl font-bold text-gray-900">{summary.total}</div>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-6 border-2 border-red-200">
              <div className="text-sm text-red-600 mb-1">Stuck (24h+)</div>
              <div className="text-3xl font-bold text-red-700">{summary.stuckPayments}</div>
            </div>
            <div className="bg-orange-50 rounded-lg shadow p-6 border-2 border-orange-200">
              <div className="text-sm text-orange-600 mb-1">Warning (1-24h)</div>
              <div className="text-3xl font-bold text-orange-700">{summary.warningPayments}</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-6">
              <div className="text-sm text-green-600 mb-1">Recent (&lt;1h)</div>
              <div className="text-3xl font-bold text-green-700">{summary.recentPayments}</div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-6">
              <div className="text-sm text-blue-600 mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-blue-700">
                KES {summary.totalAmount.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Methods</option>
              <option value="mpesa">M-Pesa Only</option>
              <option value="stripe">Stripe Only</option>
            </select>
            <button
              onClick={fetchPendingPayments}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPaymentLogs()}
              disabled={logsLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              📋 View All Logs
            </button>
            <button
              onClick={runAutoCancellation}
              disabled={autoCancelling}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {autoCancelling ? '⏳ Cancelling...' : '🗑️ Auto-Cancel Expired'}
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-6xl mb-4">🎉</div>
                      <div className="text-lg font-semibold mb-2">No Pending Payments!</div>
                      <div className="text-sm">All payments have been processed</div>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className={payment.isStuck ? 'bg-red-50' : payment.isWarning ? 'bg-orange-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.orderNumber}</div>
                        <div className="text-xs text-gray-500">{new Date(payment.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{payment.customer.name}</div>
                        <div className="text-xs text-gray-500">{payment.customer.email}</div>
                        {payment.payment && (
                          <div className="text-xs text-gray-500">{payment.payment.phoneNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        KES {payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          payment.paymentMethod === 'M-PESA' ? 'bg-green-100 text-green-800' :
                          payment.paymentMethod === 'STRIPE' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${getAgeColor(payment)}`}>
                          {payment.ageInHours > 0 ? `${payment.ageInHours}h` : `${payment.ageInMinutes}m`}
                        </div>
                        {payment.isStuck && (
                          <div className="text-xs text-red-600 font-semibold">⚠️ STUCK</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(payment.paymentStatus)}`}>
                          {payment.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => verifyPayment(payment.id)}
                            disabled={verifying === payment.id}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifying === payment.id ? '⏳' : '✓'} Verify
                          </button>
                          <button
                            onClick={() => fetchPaymentLogs(payment.id)}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium"
                          >
                            📋 Logs
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Logs Modal */}
        {showLogsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Payment Audit Logs</h2>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {logsLoading ? (
                  <LoadingSpinner size="lg" text="Loading logs..." />
                ) : logs.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No logs found</div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className={`border rounded-lg p-4 ${
                        log.status === 'SUCCESS' ? 'border-green-200 bg-green-50' :
                        log.status === 'FAILED' ? 'border-red-200 bg-red-50' :
                        'border-yellow-200 bg-yellow-50'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">{log.action}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded ${
                              log.status === 'SUCCESS' ? 'bg-green-200 text-green-800' :
                              log.status === 'FAILED' ? 'bg-red-200 text-red-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              {log.status}
                            </span>
                            <span className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                              {log.method}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Order:</strong> {log.orderNumber}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>By:</strong> {log.initiatedBy.name} ({log.initiatedBy.role})
                        </div>
                        {log.previousStatus && log.newStatus && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Status Change:</strong> {log.previousStatus} → {log.newStatus}
                          </div>
                        )}
                        {log.errorMessage && (
                          <div className="text-sm text-red-600 mb-2">
                            <strong>Error:</strong> {log.errorMessage}
                          </div>
                        )}
                        {log.details && (
                          <details className="text-xs text-gray-500 mt-2">
                            <summary className="cursor-pointer hover:text-gray-700">Show Details</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

