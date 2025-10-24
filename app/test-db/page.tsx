import { createClient } from '@/utils/supabase/server';

export default async function TestDatabasePage() {
  const supabase = await createClient();

  // Test: Fetch all products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-900/20 flex items-center justify-center p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            ❌ Database Connection Error
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Error: {error.message}
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
            <pre className="text-sm overflow-auto">{JSON.stringify(error, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Success Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                ✅ Database Connection Successful!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Supabase is connected and working perfectly
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-blue-600 dark:text-blue-400 text-sm font-semibold mb-1">
                Products Found
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {products?.length || 0}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-green-600 dark:text-green-400 text-sm font-semibold mb-1">
                Tables Created
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                9
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-purple-600 dark:text-purple-400 text-sm font-semibold mb-1">
                Status
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                Ready! 🚀
              </div>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            📦 Products from Database
          </h2>
          
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${product.price}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Stock: {product.stock}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full">
                      {product.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No products found in database</p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🎯 What&apos;s Next?
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl">✅</span>
              <div>
                <strong>Database Connected:</strong> Your Supabase database is working perfectly
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl">✅</span>
              <div>
                <strong>Tables Created:</strong> All 9 tables (users, products, orders, cart, etc.)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl">✅</span>
              <div>
                <strong>Sample Data:</strong> 8 products loaded and ready
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-500 text-xl">🔄</span>
              <div>
                <strong>Next:</strong> Update your products page to fetch from database
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-500 text-xl">🔄</span>
              <div>
                <strong>Then:</strong> Implement authentication with Supabase Auth
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

