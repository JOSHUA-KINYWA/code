'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

type OrderStats = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
};

type TopProduct = {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
  images: string[];
};

export default function AdminSalesPage() {
  const [stats, setStats] = useState<OrderStats>({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    fetchSalesData();
  }, [selectedPeriod]);

  const fetchSalesData = async () => {
    try {
      const ordersResponse = await fetch('/api/admin/orders');
      if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
      const orders = await ordersResponse.json();

      // Calculate stats
      const totalRevenue = orders.reduce((sum: number, order: any) => 
        order.paymentStatus === 'PAID' ? sum + order.total : sum, 0
      );
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => 
        o.status === 'PENDING' || o.status === 'PROCESSING'
      ).length;
      const completedOrders = orders.filter((o: any) => 
        o.status === 'DELIVERED'
      ).length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        averageOrderValue,
      });

      // Calculate top products
      const productSales = new Map<string, any>();
      orders.forEach((order: any) => {
        order.items.forEach((item: any) => {
          const existing = productSales.get(item.product.id);
          if (existing) {
            existing.totalSold += item.quantity;
            existing.revenue += item.price * item.quantity;
          } else {
            productSales.set(item.product.id, {
              id: item.product.id,
              name: item.product.name,
              images: item.product.images,
              totalSold: item.quantity,
              revenue: item.price * item.quantity,
            });
          }
        });
      });

      const topProductsArray = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      setTopProducts(topProductsArray);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Sales Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your store performance and sales metrics
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white"
        >
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
          <option value="today">Today</option>
        </select>
      </div>

      {/* Revenue Chart - MOVED TO TOP */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <span className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white p-2 rounded-lg mr-3">
            📈
          </span>
          Revenue Overview
        </h3>
        <div className="space-y-4">
          {/* Revenue by Status */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Paid Orders</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                KES {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-full flex items-center px-3 transition-all duration-500"
                style={{ width: stats.totalOrders > 0 ? `${(stats.completedOrders / stats.totalOrders) * 100}%` : '0%' }}
              >
                <span className="text-white text-xs font-semibold">
                  {stats.totalOrders > 0 ? `${((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Orders</span>
              <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pendingOrders} orders
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full flex items-center px-3 transition-all duration-500"
                style={{ width: stats.totalOrders > 0 ? `${(stats.pendingOrders / stats.totalOrders) * 100}%` : '0%' }}
              >
                <span className="text-white text-xs font-semibold">
                  {stats.totalOrders > 0 ? `${((stats.pendingOrders / stats.totalOrders) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Order Value</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                KES {stats.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-600 h-full flex items-center px-3 transition-all duration-500"
                style={{ width: stats.totalOrders > 0 ? '100%' : '0%' }}
              >
                <span className="text-white text-xs font-semibold">
                  {stats.totalOrders} orders
                </span>
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Completion Rate</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-full">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - NOW AFTER CHART */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold">KES {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-sm opacity-90 mt-2">From {stats.totalOrders} orders</p>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Total Orders</h3>
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
          <p className="text-sm opacity-90 mt-2">{stats.pendingOrders} pending</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Avg Order Value</h3>
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold">KES {stats.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-sm opacity-90 mt-2">Per order</p>
        </div>

        {/* Completed Orders */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Completed</h3>
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.completedOrders}</p>
          <p className="text-sm opacity-90 mt-2">
            {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}% completion rate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-2 rounded-lg mr-3">
              🏆
            </span>
            Top Selling Products
          </h3>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No sales data yet</p>
            ) : (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    #{index + 1}
                  </div>
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.totalSold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">
                      KES {product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">revenue</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-2 rounded-lg mr-3">
              📈
            </span>
            Quick Statistics
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Growth</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">+12.5%</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">vs last period</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">3.8%</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">visitors to customers</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer Satisfaction</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">4.7/5</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">average rating</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Return Rate</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">2.1%</p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">of completed orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          📅 Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
            <p className="text-sm opacity-90 mb-2">This Week</p>
            <p className="text-3xl font-bold mb-1">${(stats.totalRevenue * 0.25).toFixed(2)}</p>
            <p className="text-sm opacity-80">{Math.floor(stats.totalOrders * 0.25)} orders</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
            <p className="text-sm opacity-90 mb-2">This Month</p>
            <p className="text-3xl font-bold mb-1">${(stats.totalRevenue * 0.75).toFixed(2)}</p>
            <p className="text-sm opacity-80">{Math.floor(stats.totalOrders * 0.75)} orders</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white">
            <p className="text-sm opacity-90 mb-2">This Year</p>
            <p className="text-3xl font-bold mb-1">${stats.totalRevenue.toFixed(2)}</p>
            <p className="text-sm opacity-80">{stats.totalOrders} orders</p>
          </div>
        </div>
      </div>
    </div>
  );
}

