export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mx-auto mb-6">
          <div className="w-16 h-16 border-4 border-pink-200 dark:border-pink-900 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-pink-600 dark:border-pink-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>

        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Loading...
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we fetch your content
        </p>

        {/* Animated Dots */}
        <div className="flex justify-center gap-1 mt-4">
          <div className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}





