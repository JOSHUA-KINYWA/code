'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignIn, useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, isLoaded, setActive } = useSignIn();
  const { user, isSignedIn } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check if already signed in as admin
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userRole = user?.publicMetadata?.role as string;
      
      if (userRole === 'admin') {
        toast.success('Already signed in as admin!');
        router.push('/admin');
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if already signed in
    if (isSignedIn) {
      toast.error('You are already signed in. Please sign out first.');
      return;
    }
    
    if (!isLoaded || !signIn) {
      return;
    }

    setIsLoading(true);

    try {
      // Attempt to sign in with Clerk
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Check if user has admin role
        const userRole = result.userData?.publicMetadata?.role as string;
        
        if (userRole === 'admin') {
          toast.success('✅ Admin login successful! Redirecting...', {
            duration: 2000,
            icon: '🎉',
          });
          
          setTimeout(() => {
            router.push('/admin');
          }, 500);
        } else {
          toast.error('❌ Access denied! Admin privileges required.', {
            duration: 3000,
          });
          setIsLoading(false);
        }
      } else {
        toast.error('❌ Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.errors && err.errors[0]) {
        const errorMessage = err.errors[0].message;
        
        // Handle specific error for already signed in
        if (errorMessage.includes('signed in') || errorMessage.includes('already')) {
          toast.error('You are already signed in. Redirecting...', {
            duration: 2000,
          });
          setTimeout(() => {
            router.push('/admin');
          }, 1000);
          return;
        }
        
        toast.error(`❌ ${errorMessage}`, {
          duration: 3000,
        });
      } else {
        toast.error('❌ Invalid email or password', {
          duration: 3000,
        });
      }
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Admin Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                <p className="text-orange-100 text-sm">Authorized Access Only</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-600 text-white rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-500"
                      placeholder="Enter your admin email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-600 text-white rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-500"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In to Dashboard
                    </span>
                  )}
                </button>
              </form>

            {/* Info Notice */}
            <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-300">Restricted Access</p>
                  <p className="text-xs text-gray-500 mt-1">Only authorized admin accounts can access this portal.</p>
                  <p className="text-xs text-gray-500">Forgot your password? Contact the system administrator.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-900/50 px-8 py-4 border-t border-slate-700/50">
            <p className="text-center text-sm text-gray-400">
              Need help? Contact{' '}
              <Link href="/contact" className="text-orange-400 hover:text-orange-300 font-medium">
                support
              </Link>
            </p>
          </div>
        </div>

        {/* Regular User Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Not an admin?{' '}
            <Link href="/sign-in" className="text-orange-400 hover:text-orange-300 font-semibold hover:underline transition-colors">
              Sign in as regular user
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

