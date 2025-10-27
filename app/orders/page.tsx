'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import CancelOrderModal from '@/components/orders/CancelOrderModal';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [reviewableProducts, setReviewableProducts] = useState<Set<string>>(new Set());

  // Cancel modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<{ id: string; orderNumber: string } | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [dateRange, setDateRange] = useState<string>('all');

  // Fetch functions (defined outside useEffect so they can be called from handlers)
  const fetchOrders = useCallback(async () => {
    if (!isSignedIn || !isLoaded) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, isLoaded]);

  const fetchReviewableProducts = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const response = await fetch('/api/orders/reviewable');
      if (response.ok) {
        const data = await response.json();
        const productIds = new Set<string>(data.reviewableProducts.map((p: {productId: string}) => p.productId));
        setReviewableProducts(productIds);
      }
    } catch (error) {
      console.error('Error fetching reviewable products:', error);
    }
  }, [isSignedIn]);

  // Protect this route - require authentication
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        toast.error('🔒 Please sign in to view your orders');
        router.push('/sign-in');
        return;
      }

      const userRole = user?.publicMetadata?.role as string || 'user';
      
      if (userRole === 'admin') {
        toast.error('⚠️ Admins cannot access user orders. Use Admin Dashboard.');
        router.push('/admin');
        return;
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Fetch orders and reviewable products on mount
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      fetchOrders();
      fetchReviewableProducts();
    }
  }, [isSignedIn, isLoaded, fetchOrders, fetchReviewableProducts]);

  // Apply filters
  useEffect(() => {
    let result = [...orders];

    // Search filter
    if (searchQuery) {
      result = result.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.product.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      result = result.filter(order => order.paymentStatus === paymentFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const orderDate = (order: Order) => new Date(order.createdAt);
      
      switch (dateRange) {
        case 'today':
          result = result.filter(order => {
            const diff = now.getTime() - orderDate(order).getTime();
            return diff < 24 * 60 * 60 * 1000;
          });
          break;
        case 'week':
          result = result.filter(order => {
            const diff = now.getTime() - orderDate(order).getTime();
            return diff < 7 * 24 * 60 * 60 * 1000;
          });
          break;
        case 'month':
          result = result.filter(order => {
            const diff = now.getTime() - orderDate(order).getTime();
            return diff < 30 * 24 * 60 * 60 * 1000;
          });
          break;
      }
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        result.sort((a, b) => b.total - a.total);
        break;
      case 'lowest':
        result.sort((a, b) => a.total - b.total);
        break;
    }

    setFilteredOrders(result);
  }, [orders, searchQuery, statusFilter, paymentFilter, sortBy, dateRange]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      DELIVERED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getPaymentBadge = (paymentStatus: string) => {
    return paymentStatus === 'PAID'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setSortBy('newest');
    setDateRange('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || sortBy !== 'newest' || dateRange !== 'all';

  // Cancel order handlers
  const handleCancelClick = (orderId: string, orderNumber: string) => {
    setSelectedOrderForCancel({ id: orderId, orderNumber });
    setCancelModalOpen(true);
  };

  const handleCancelSuccess = () => {
    // Refetch orders to show updated status
    fetchOrders();
    fetchReviewableProducts();
  };

  const canCancelOrder = (order: Order) => {
    // Can only cancel if order is PENDING or PROCESSING and not already cancelled
    return (order.status === 'PENDING' || order.status === 'PROCESSING') && !order.cancelledAt;
  };

  // Invoice download handler
  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      toast.loading('Generating invoice...');
      const response = await fetch(`/api/orders/${orderId}/invoice`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invoice');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.dismiss();
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to download invoice';
      toast.error(message);
    }
  };

  // Check if order is eligible for invoice download
  const canDownloadInvoice = (order: Order) => {
    // Must be paid
    if (order.paymentStatus !== 'PAID') return false;
    
    // Must be at least processing or higher
    const allowedStatuses = ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    return allowedStatuses.includes(order.status);
  };

  // Export all orders to CSV
  const handleExportOrders = async () => {
    try {
      toast.loading('Exporting orders...');
      const response = await fetch('/api/orders/export');
      
      if (!response.ok) {
        throw new Error('Failed to export orders');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.dismiss();
      toast.success('Orders exported successfully!');
    } catch (error) {
      toast.dismiss();
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    }
  };

  if (!isLoaded || !isSignedIn) {
        return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

        return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Orders</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and manage your orders
            </p>
          </div>
          {orders.length > 0 && (
            <button
              onClick={handleExportOrders}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export All Orders
            </button>
          )}
        </div>

        {/* Review Banner */}
        {reviewableProducts.size > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Share Your Experience
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have {reviewableProducts.size} product{reviewableProducts.size > 1 ? 's' : ''} ready to review
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Orders
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
                <input
                  type="text"
                  placeholder="Order number or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Sort and Clear */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
                Clear Filters
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredOrders.length}</span> of <span className="font-semibold text-gray-900 dark:text-white">{orders.length}</span> orders
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {hasActiveFilters ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters to find what you\'re looking for'
                : 'Start shopping to see your orders here'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Clear Filters
              </button>
            ) : (
              <Link href="/products">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Browse Products
                </button>
            </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {order.orderNumber}
                        </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentBadge(order.paymentStatus)}`}>
                            {order.paymentStatus}
                        </span>
                      </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                      </p>
                        {order.cancelledAt && order.cancellationReason && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Cancelled: {order.cancellationReason}
                          </p>
                        )}
                    </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${order.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        {canDownloadInvoice(order) ? (
                          <button
                            onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ml-auto"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Invoice
                          </button>
                        ) : (
                          <div 
                            className="px-4 py-2 bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500 rounded-lg text-sm font-medium flex items-center gap-2 ml-auto cursor-not-allowed"
                            title={
                              order.paymentStatus !== 'PAID' 
                                ? 'Invoice available after payment' 
                                : 'Invoice available once order is confirmed'
                            }
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Invoice Locked</span>
                          </div>
                        )}
                        {canCancelOrder(order) && (
                          <button
                            onClick={() => handleCancelClick(order.id, order.orderNumber)}
                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ml-auto"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item) => {
                      const canReviewProduct = reviewableProducts.has(item.product.id);
                      const orderIsPaid = order.paymentStatus === 'PAID';

                      return (
                        <div key={item.id} className="flex gap-4">
                          <div className="flex-shrink-0 w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-md relative overflow-hidden">
                            {item.product.images && item.product.images[0] ? (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <Link
                              href={`/products/${item.product.id}`}
                              className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {item.product.name}
                            </Link>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span>Qty: {item.quantity}</span>
                              <span>Price: ${item.price.toFixed(2)}</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                Total: ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>

                            {/* Review Button/Badge */}
                            {orderIsPaid && (
                              <div className="mt-2">
                                {canReviewProduct ? (
                                  <button
                                    onClick={() => router.push(`/products/${item.product.id}#reviews`)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    Write Review
                                  </button>
                                ) : (
                                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    ✓ Reviewed
                                  </span>
                                )}
                        </div>
                            )}
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="flex justify-between gap-8">
                          <span>Subtotal:</span>
                          <span className="text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-8">
                          <span>Tax:</span>
                          <span className="text-gray-900 dark:text-white">${order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-8">
                          <span>Shipping:</span>
                          <span className="text-gray-900 dark:text-white">${order.shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-8 pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                          <span>Total:</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                  </div>

                      <div className="text-right">
                        {order.shippingAddress && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">Shipping Address:</p>
                            <p>{order.shippingAddress}</p>
                          </div>
                    )}
                  </div>
                    </div>
                  </div>

                  {/* Order Status Messages */}
                  {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Your order is being processed. You&apos;ll receive a notification once it ships.
                      </p>
                    </div>
                  )}

                  {order.paymentStatus === 'PAID' && order.items.some(item => reviewableProducts.has(item.product.id)) && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Products in this order are ready for review. Share your experience!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {selectedOrderForCancel && (
        <CancelOrderModal
          orderId={selectedOrderForCancel.id}
          orderNumber={selectedOrderForCancel.orderNumber}
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setSelectedOrderForCancel(null);
          }}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}
