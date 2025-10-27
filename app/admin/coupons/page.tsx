'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import CouponModal from '@/components/admin/CouponModal';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  usedCount: number;
  minimumOrderValue?: number;
  maxDiscount?: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Check if user is admin
  const userRole = user?.publicMetadata?.role as string;
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push('/');
    }
  }, [isLoaded, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchCoupons();
    }
  }, [isAdmin]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete coupon');

      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });

      if (!response.ok) throw new Error('Failed to update coupon');

      toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
      fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast.error('Failed to update coupon');
    }
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    switch (coupon.discountType) {
      case 'PERCENTAGE':
        return `${coupon.discountValue}% off`;
      case 'FIXED_AMOUNT':
        return `$${coupon.discountValue.toFixed(2)} off`;
      case 'FREE_SHIPPING':
        return 'Free Shipping';
      default:
        return coupon.discountValue;
    }
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.validUntil) return false;
    return new Date(coupon.validUntil) < new Date();
  };

  const isMaxedOut = (coupon: Coupon) => {
    if (!coupon.maxUses) return false;
    return coupon.usedCount >= coupon.maxUses;
  };

  if (!isLoaded || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🎟️ Coupon Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage discount coupons
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Coupon
          </button>
        </div>

        {/* Sample Coupons Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📝 Sample Coupons Available
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
            Visit{' '}
            <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">
              /api/setup-coupon-system
            </code>{' '}
            to create sample coupons:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="font-semibold">WELCOME10</span> - 10% off
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="font-semibold">SAVE20</span> - $20 off over $100
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="font-semibold">FREESHIP</span> - Free shipping
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="font-semibold">VIP50</span> - 50% off (limited)
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading coupons...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Coupons Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first coupon to start offering discounts
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Create Coupon
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valid Until
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {coupon.code}
                          </div>
                          {coupon.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {coupon.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getDiscountDisplay(coupon)}
                        </span>
                        {coupon.minimumOrderValue && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Min: ${coupon.minimumOrderValue.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {coupon.usedCount}{' '}
                          {coupon.maxUses && `/ ${coupon.maxUses}`}
                        </div>
                        {coupon.maxUsesPerUser && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {coupon.maxUsesPerUser} per user
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {coupon.validUntil
                            ? new Date(coupon.validUntil).toLocaleDateString()
                            : 'No expiry'}
                        </div>
                        {isExpired(coupon) && (
                          <span className="text-xs text-red-600 dark:text-red-400">Expired</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              coupon.isActive
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {isMaxedOut(coupon) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                              Maxed Out
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleActive(coupon)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              coupon.isActive
                                ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40 text-green-700 dark:text-green-300'
                            }`}
                          >
                            {coupon.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-700 dark:text-red-300 rounded text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Coupon Modal */}
      <CouponModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchCoupons}
      />
    </div>
  );
}

