import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join us and start your shopping journey today
          </p>
        </div>

        {/* Clerk Sign Up Component */}
        <SignUp 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: 
                'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all font-semibold rounded-xl h-12',
              socialButtonsBlockButtonText: 'font-semibold text-sm',
              formButtonPrimary: 
                'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl h-12 transition-all shadow-lg hover:shadow-xl',
              formFieldLabel: 'text-gray-700 dark:text-gray-300 font-semibold text-sm',
              formFieldInput: 
                'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl h-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all',
              footerActionLink: 
                'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold',
              dividerLine: 'bg-gray-300 dark:bg-gray-600',
              dividerText: 'text-gray-500 dark:text-gray-400 font-medium',
              formFieldInputShowPasswordButton: 
                'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
              identityPreviewEditButton: 'text-purple-600 dark:text-purple-400 hover:text-purple-700',
              footer: 'bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl',
              footerActionText: 'text-gray-600 dark:text-gray-400',
              formFieldSuccessText: 'text-green-600 dark:text-green-400',
            },
            layout: {
              socialButtonsPlacement: 'top',
              socialButtonsVariant: 'blockButton',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />

        {/* Additional Info */}
        <div className="mt-8 text-center space-y-2">
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            🔒 Your data is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}

