'use client';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'table' | 'text' | 'avatar' | 'custom';
  count?: number;
  height?: string;
  width?: string;
  className?: string;
}

export default function SkeletonLoader({
  variant = 'card',
  count = 1,
  height,
  width,
  className = '',
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gray-300 dark:bg-gray-700 rounded';

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className={`${baseClasses} h-48 w-full`} />
            <div className="p-4 space-y-3">
              <div className={`${baseClasses} h-4 w-3/4`} />
              <div className={`${baseClasses} h-3 w-1/2`} />
              <div className={`${baseClasses} h-6 w-1/3`} />
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className={`${baseClasses} h-12 w-12 rounded-full flex-shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${baseClasses} h-4 w-3/4`} />
              <div className={`${baseClasses} h-3 w-1/2`} />
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className={`${baseClasses} h-12 w-full`} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
                <div className={`${baseClasses} h-6 w-16`} />
                <div className={`${baseClasses} h-6 flex-1`} />
                <div className={`${baseClasses} h-6 w-24`} />
                <div className={`${baseClasses} h-6 w-24`} />
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`${baseClasses} h-4 ${
                  i === 2 ? 'w-2/3' : 'w-full'
                }`}
              />
            ))}
          </div>
        );

      case 'avatar':
        return (
          <div className={`${baseClasses} ${width || 'w-12'} ${height || 'h-12'} rounded-full`} />
        );

      case 'custom':
        return (
          <div
            className={`${baseClasses} ${className}`}
            style={{ height: height || '100%', width: width || '100%' }}
          />
        );

      default:
        return <div className={`${baseClasses} h-32 w-full`} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
}





