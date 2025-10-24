'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';

export default function TestAddPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch products on load
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (error) {
      setMessage(`❌ Error loading products: ${error.message}`);
    } else {
      setProducts(data || []);
      setMessage('✅ Products loaded successfully!');
    }
  };

  // Test adding a product to favorites
  const testAddToFavorites = async (productId: string) => {
    setLoading(true);
    setMessage('Testing add to favorites...');

    // For testing, we'll use a dummy user ID
    const testUserId = 'test-user-123';

    const { data, error } = await supabase
      .from('favorites')
      .insert([
        {
          user_id: testUserId,
          product_id: productId
        }
      ])
      .select();

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        setMessage('⚠️ Already in favorites! (Test working - database prevents duplicates)');
      } else if (error.code === '23503') {
        setMessage('⚠️ Foreign key constraint (Need real user ID - but connection works!)');
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
    } else {
      setMessage('✅ Successfully added to favorites! Database connection working!');
    }
  };

  // Test reading from database
  const testRead = async () => {
    setLoading(true);
    setMessage('Testing database read...');

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' });

    setLoading(false);

    if (error) {
      setMessage(`❌ Read failed: ${error.message}`);
    } else {
      setMessage(`✅ Read successful! Found ${count} products in database.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧪 Test Database Connection
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test if your Supabase database is working correctly
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : message.includes('⚠️')
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm font-medium ${
              message.includes('✅') 
                ? 'text-green-800 dark:text-green-300' 
                : message.includes('⚠️')
                ? 'text-yellow-800 dark:text-yellow-300'
                : 'text-red-800 dark:text-red-300'
            }`}>
              {message}
            </p>
          </div>
        )}

        {/* Test Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Tests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={testRead}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Testing...' : '📖 Test Read'}
            </button>
            <button
              onClick={loadProducts}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Loading...' : '🔄 Reload Products'}
            </button>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📦 Products (Test Add to Favorites)
          </h2>
          
          {products.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No products found. Make sure your database tables are created.</p>
              <a 
                href="/test-db" 
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                → Go to main test page
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ${product.price} • Stock: {product.stock}
                    </p>
                  </div>
                  <button
                    onClick={() => testAddToFavorites(product.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {loading ? '...' : '❤️ Test Add'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mt-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📋 How to Test
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-blue-500 font-bold">1.</span>
              <div>
                <strong>Test Read:</strong> Click "Test Read" button to verify database connection
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-500 font-bold">2.</span>
              <div>
                <strong>Reload Products:</strong> Click to fetch products from database
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-500 font-bold">3.</span>
              <div>
                <strong>Test Add:</strong> Click "Test Add" on any product to test database insert
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold">✅</span>
              <div>
                If you see green success messages, your database is working perfectly!
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/test-db"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            ← Full Test Page
          </a>
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

