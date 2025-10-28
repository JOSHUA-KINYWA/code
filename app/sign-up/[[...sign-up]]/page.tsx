import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Benefits */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-3xl p-12 text-white shadow-2xl">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold mb-4">
                  Join NexStore Community
                </h1>
                <p className="text-lg text-white/90">
                  Create an account and unlock exclusive benefits
                </p>
              </div>

              <div className="space-y-4 mt-12">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Welcome Bonus</h3>
                    <p className="text-white/80 text-sm">Get 10% off your first purchase</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Fast Checkout</h3>
                    <p className="text-white/80 text-sm">Save your details for quick purchases</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Order Alerts</h3>
                    <p className="text-white/80 text-sm">Get notified about deals and promotions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="w-full">
            {/* Mobile Header */}
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create Account
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Join us and start shopping
              </p>
            </div>

            {/* Clerk Sign Up Component */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-2">
              <SignUp 
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'bg-transparent shadow-none border-0 w-full',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    socialButtonsBlockButton: 
                      'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all font-semibold rounded-xl h-12 shadow-sm hover:shadow-md',
                    socialButtonsBlockButtonText: 'font-semibold text-sm',
                    socialButtonsIconButton: 'border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700',
                    formButtonPrimary: 
                      'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl h-12 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]',
                    formFieldLabel: 'text-gray-700 dark:text-gray-300 font-semibold text-sm mb-2',
                    formFieldInput: 
                      'bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl h-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all px-4',
                    footerActionLink: 
                      'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold hover:underline',
                    dividerLine: 'bg-gray-300 dark:bg-gray-600',
                    dividerText: 'text-gray-500 dark:text-gray-400 font-medium px-4',
                    formFieldInputShowPasswordButton: 
                      'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
                    identityPreviewEditButton: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:underline',
                    footer: 'bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl mt-4 py-4',
                    footerActionText: 'text-gray-600 dark:text-gray-400 text-sm',
                    formFieldSuccessText: 'text-green-600 dark:text-green-400',
                    footerPages: 'space-y-2',
                  },
                  layout: {
                    socialButtonsPlacement: 'top',
                    socialButtonsVariant: 'blockButton',
                    unsafe_disableDevelopmentModeWarnings: true,
                  },
                }}
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
              />
            </div>

            {/* Terms & Security */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                By signing up, you agree to our{' '}
                <a href="/terms" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                  Terms
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                  Privacy Policy
                </a>
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium">Protected</span>
                </div>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

