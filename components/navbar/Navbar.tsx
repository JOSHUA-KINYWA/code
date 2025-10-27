'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import CartButton from './CartButton';
import DarkMode from './DarkMode';
import NavSearch from './NavSearch';
import LinksDropdown from './LinksDropdown';
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import UserProfileDisplay from './UserProfileDisplay';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const pathname = usePathname();
  const { cartCount } = useCart();
  const router = useRouter();
  const { user } = useUser();
  
  // Check if user is admin
  const userRole = user?.publicMetadata?.role as string || 'user';
  const isAdmin = userRole === 'admin';

  const isActive = (path: string) => pathname === path;

  const handleRoleSelect = (role: 'user' | 'admin') => {
    setShowRoleSelection(false);
    setIsAuthMenuOpen(false);
    
    if (role === 'admin') {
      router.push('/admin-login');
    } else {
      setIsAuthMenuOpen(true);
    }
  };

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

          {/* Desktop Navigation - Only show for non-admin users */}
          {!isAdmin && (
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

              <Link
                href="/contact"
                className={`${
                  isActive('/contact')
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                } transition-colors`}
              >
                Contact
              </Link>
            </div>
          )}
          
          {/* Admin Navigation */}
          {isAdmin && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/admin"
                className={`${
                  isActive('/admin')
                    ? 'text-orange-600 dark:text-orange-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400'
                } transition-colors flex items-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin Dashboard
              </Link>
            </div>
          )}

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Hide search and cart for admins, show cart only for logged-in users */}
            {!isAdmin && <NavSearch />}
            <SignedIn>
              {!isAdmin && <CartButton itemCount={cartCount} />}
            </SignedIn>
            <DarkMode />

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <SignedOut>
                <div className="relative">
                  <button
                    onClick={() => setShowRoleSelection(!showRoleSelection)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                    aria-label="User menu"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {/* Role Selection or Auth Menu */}
                  {(showRoleSelection || isAuthMenuOpen) && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => {
                          setShowRoleSelection(false);
                          setIsAuthMenuOpen(false);
                        }}
                      />
                      
                      {/* Menu */}
                      {showRoleSelection ? (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20">
                          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Select Your Role</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choose how you want to sign in</p>
                          </div>
                          
                          <button
                            onClick={() => handleRoleSelect('user')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <p className="font-semibold">Regular User</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Shop and browse products</p>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => handleRoleSelect('admin')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <p className="font-semibold">Admin</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Manage store dashboard</p>
                            </div>
                          </button>
                        </div>
                      ) : (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20">
                          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Welcome!</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sign in to your account</p>
                          </div>
                          
                          <Link
                            href="/sign-in"
                            onClick={() => setIsAuthMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-medium">Sign In</span>
                          </Link>
                          
                          <Link
                            href="/sign-up"
                            onClick={() => setIsAuthMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span className="font-medium">Create Account</span>
                          </Link>
                          
                          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                          
                          <button
                            onClick={() => {
                              setIsAuthMenuOpen(false);
                              setShowRoleSelection(true);
                            }}
                            className="flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Back to role selection</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </SignedOut>
              <SignedIn>
                <UserProfileDisplay />
              </SignedIn>
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
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${
                  isActive('/contact')
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-200'
                } px-3 py-2`}
              >
                Contact
              </Link>

              {/* Mobile Auth */}
              <SignedOut>
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 mt-2 pt-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Account</p>
                  <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Create Account
                    </button>
                  </Link>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 mt-2 pt-4">
                  <UserProfileDisplay />
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
