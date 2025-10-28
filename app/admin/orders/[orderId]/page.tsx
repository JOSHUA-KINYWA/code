'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  items: OrderItem[];
  user?: {
    name: string;
    email: string;
  };
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [params.orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update order');

      toast.success('Order status updated!');
      await fetchOrder();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const approvePayment = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentStatus: 'PAID',
        }),
      });

      if (!response.ok) throw new Error('Failed to approve payment');

      toast.success('Payment approved successfully! 🎉');
      await fetchOrder();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The order you're looking for doesn't exist.</p>
          <Link href="/admin/orders" className="text-blue-600 hover:underline">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Order {order.orderNumber}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
              Payment: {order.paymentStatus}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Order Items ({order.items.length})
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                    <Image
                      src={item.product.images[0] || '/placeholder.png'}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.product.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">${item.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Customer Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-semibold text-gray-900 dark:text-white">{order.user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-semibold text-gray-900 dark:text-white">{order.user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Shipping Address
            </h2>
            <p className="text-gray-900 dark:text-white">{order.shippingAddress}</p>
            <p className="text-gray-900 dark:text-white">
              {order.shippingCity}, {order.shippingState} {order.shippingZip}
            </p>
            <p className="text-gray-900 dark:text-white">{order.shippingCountry}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-900 dark:text-white">${order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="text-gray-900 dark:text-white">${order.tax.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                <span className="font-bold text-gray-900 dark:text-white">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Payment
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                <p className="font-semibold text-gray-900 dark:text-white">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {order.paymentStatus === 'PENDING' && !order.cancelledAt && (
              <button
                onClick={approvePayment}
                disabled={updating}
                className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {updating ? 'Approving...' : '✓ Approve Payment'}
              </button>
            )}
          </div>

          {/* Order Status */}
          {!order.cancelledAt && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Update Status
              </h2>
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(e.target.value)}
                disabled={updating || order.paymentStatus === 'PENDING'}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
              </select>
              {order.paymentStatus === 'PENDING' && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  ⚠️ Approve payment first before changing status
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

