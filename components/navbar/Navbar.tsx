'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import CartButton from './CartButton';
import DarkMode from './DarkMode';
import NavSearch from './NavSearch';
import UserIcon from './UserIcon';
import LinksDropdown from './LinksDropdown';
import SignOutLink from './SignOutLink';

// Mock user data - replace with real auth
const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();

  // Check if user is authenticated - replace with real auth check
  const isAuthenticated = false; // Change to true to see authenticated state
  const user = isAuthenticated ? mockUser : null;

  const isActive = (path: string) => pathname === path;

  // Navigation links for dropdown
  const shopLinks = [
    {
      name: 'All Products',
      href: '/products',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'Electronics',
      href: '/products?category=electronics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Audio',
      href: '/products?category=audio',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414" />
        </svg>
      ),
    },
    {
      name: 'Wearables',
      href: '/products?category=wearables',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`${
                isActive('/')
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              } transition-colors`}
            >
              Home
            </Link>

            <LinksDropdown links={shopLinks} title="Shop" />

            <Link
              href="/about"
              className={`${
                isActive('/about')
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              } transition-colors`}
            >
              About
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/favorites"
                  className={`${
                    isActive('/favorites')
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                  } transition-colors`}
                >
                  Favorites
                </Link>
                <Link
                  href="/orders"
                  className={`${
                    isActive('/orders')
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                  } transition-colors`}
                >
                  Orders
                </Link>
              </>
            )}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            <NavSearch />
            <DarkMode />
            <CartButton itemCount={3} />
            
            {/* User Icon with Dropdown */}
            <div className="hidden md:block">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center"
                  >
                    <UserIcon user={user} />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <SignOutLink />
                    </div>
                  )}
                </div>
              ) : (
                <UserIcon user={null} />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700 dark:text-gray-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${
                  isActive('/')
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-200'
                } px-3 py-2`}
              >
                Home
              </Link>
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${
                  isActive('/products')
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-200'
                } px-3 py-2`}
              >
                Products
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${
                  isActive('/about')
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-200'
                } px-3 py-2`}
              >
                About
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/favorites"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${
                      isActive('/favorites')
                        ? 'text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-200'
                    } px-3 py-2`}
                  >
                    Favorites
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${
                      isActive('/orders')
                        ? 'text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-200'
                    } px-3 py-2`}
                  >
                    Orders
                  </Link>
                  <Link
                    href="/reviews"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${
                      isActive('/reviews')
                        ? 'text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-200'
                    } px-3 py-2`}
                  >
                    Reviews
                  </Link>
                  <div className="px-3 py-2">
                    <SignOutLink />
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-700 dark:text-gray-200 px-3 py-2"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
