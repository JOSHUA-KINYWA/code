'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductImage from '@/components/single-product/ProductImage';
import ProductDetails from '@/components/single-product/ProductDetails';
import ProductReviews from '@/components/single-product/ProductReviews';
import { PageLoader } from '@/components/global/Preloader';
import toast from 'react-hot-toast';

// Mock product data - in a real app, this would come from an API
const productsData = {
  '1': {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299.99,
    category: 'Audio',
    description: 'Experience superior sound quality with our Premium Wireless Headphones. Featuring active noise cancellation, 30-hour battery life, and premium comfort padding. Perfect for music lovers, commuters, and anyone who values exceptional audio quality.',
    rating: 4.8,
    reviews: 342,
    inStock: true,
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg', '/placeholder-product.jpg', '/placeholder-product.jpg'],
  },
  '2': {
    id: '2',
    name: 'Smart Watch Series 5',
    price: 399.99,
    category: 'Wearables',
    description: 'Stay connected and track your fitness goals with the Smart Watch Series 5. Features include heart rate monitoring, GPS tracking, water resistance, and seamless smartphone integration. The perfect companion for your active lifestyle.',
    rating: 4.6,
    reviews: 568,
    inStock: true,
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg', '/placeholder-product.jpg'],
  },
  '3': {
    id: '3',
    name: 'Leather Backpack',
    price: 129.99,
    category: 'Accessories',
    description: 'Crafted from premium genuine leather, this backpack combines style and functionality. Features multiple compartments, padded laptop sleeve, and adjustable straps. Perfect for daily commute, travel, or casual use.',
    rating: 4.9,
    reviews: 234,
    inStock: false,
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
  },
  '4': {
    id: '4',
    name: 'Bluetooth Speaker',
    price: 89.99,
    category: 'Audio',
    description: 'Portable Bluetooth speaker with 360-degree sound, waterproof design, and 12-hour battery life. Perfect for outdoor adventures, parties, or home use. Connects seamlessly with all your devices.',
    rating: 4.5,
    reviews: 445,
    inStock: true,
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg', '/placeholder-product.jpg'],
  },
  '5': {
    id: '5',
    name: 'Wireless Earbuds Pro',
    price: 199.99,
    category: 'Audio',
    description: 'True wireless earbuds with active noise cancellation, transparent mode, and premium sound quality. Features touch controls, wireless charging case, and IPX4 water resistance. Enjoy up to 24 hours of playback with the charging case.',
    rating: 4.7,
    reviews: 789,
    inStock: true,
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg', '/placeholder-product.jpg', '/placeholder-product.jpg'],
  },
  '6': {
    id: '6',
    name: 'Fitness Tracker Band',
    price: 79.99,
    category: 'Wearables',
    description: 'Track your daily activity, heart rate, sleep patterns, and more with this advanced fitness tracker. Features include step counting, calorie tracking, multiple sport modes, and smartphone notifications. Water-resistant design suitable for swimming.',
    rating: 4.4,
    reviews: 321,
    inStock: true,
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
  },
  '7': {
    id: '7',
    name: 'USB-C Hub Adapter',
    price: 49.99,
    category: 'Electronics',
    description: 'Expand your connectivity with this versatile USB-C hub. Features HDMI output, USB 3.0 ports, SD card reader, and power delivery pass-through. Compact aluminum design perfect for laptops and tablets.',
    rating: 4.6,
    reviews: 156,
    inStock: true,
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg', '/placeholder-product.jpg'],
  },
  '8': {
    id: '8',
    name: 'Portable Charger 20000mAh',
    price: 59.99,
    category: 'Electronics',
    description: 'High-capacity portable charger with 20000mAh battery. Features dual USB outputs, fast charging support, and LED battery indicator. Charge multiple devices simultaneously. Perfect for travel, emergencies, and daily use.',
    rating: 4.8,
    reviews: 892,
    inStock: true,
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
  },
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading product data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, [productId]);

  // Get product data
  const product = productsData[productId as keyof typeof productsData];

  // Show loading state
  if (isLoading) {
    return <PageLoader />;
  }

  // If product not found, show error
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Product Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sorry, the product you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    // Add your cart logic here (e.g., update context, localStorage, etc.)
    console.log('Added to cart:', product.id);
    
    // Show success toast
    toast.success(`🛒 ${product.name} added to cart!`, {
      duration: 2000,
    });
    
    // Redirect to cart after a short delay
    setTimeout(() => {
      router.push('/cart');
    }, 1000);
  };

  const handleAddToFavorites = () => {
    // Add your favorites logic here
    console.log('Added to favorites:', product.id);
    
    // Show success toast
    toast.success(`❤️ ${product.name} added to favorites!`, {
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center text-sm text-gray-600">
          <button
            onClick={() => router.push('/')}
            className="hover:text-blue-600 transition-colors"
          >
            Home
          </button>
          <span className="mx-2">/</span>
          <button
            onClick={() => router.push('/products')}
            className="hover:text-blue-600 transition-colors"
          >
            Products
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div>
              <ProductImage images={product.images} productName={product.name} />
            </div>

            {/* Product Details */}
            <div>
              <ProductDetails
                name={product.name}
                price={product.price}
                rating={product.rating}
                reviews={product.reviews}
                description={product.description}
                inStock={product.inStock}
                category={product.category}
                onAddToCart={handleAddToCart}
                onAddToFavorites={handleAddToFavorites}
              />
            </div>
          </div>

          {/* Product Reviews Section */}
          <div className="mt-12 border-t border-gray-200 pt-12" id="reviews">
            <ProductReviews
              reviews={[
                {
                  id: '1',
                  author: 'Sarah Johnson',
                  rating: 5,
                  date: 'October 15, 2025',
                  title: 'Amazing quality!',
                  comment: 'This product exceeded my expectations. The quality is outstanding and it works perfectly.',
                  verified: true,
                  helpful: 24,
                },
                {
                  id: '2',
                  author: 'Michael Chen',
                  rating: 4,
                  date: 'October 10, 2025',
                  title: 'Great value for money',
                  comment: 'Very satisfied with this purchase. Does exactly what it promises to do.',
                  verified: true,
                  helpful: 15,
                },
                {
                  id: '3',
                  author: 'Emily Rodriguez',
                  rating: 5,
                  date: 'October 5, 2025',
                  title: 'Highly recommend!',
                  comment: 'Best purchase I have made in a while. Shipping was fast and the product is excellent.',
                  verified: false,
                  helpful: 8,
                },
              ]}
              averageRating={product.rating}
              totalReviews={product.reviews}
            />
          </div>
        </div>

        {/* Related Products or Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            ← Back to Products
          </button>
        </div>
      </div>
    </div>
  );
}

