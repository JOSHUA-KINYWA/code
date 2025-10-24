import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to continue your shopping experience
          </p>
        </div>

        {/* Clerk Sign In Component */}
        <SignIn 
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
                'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl h-12 transition-all shadow-lg hover:shadow-xl',
              formFieldLabel: 'text-gray-700 dark:text-gray-300 font-semibold text-sm',
              formFieldInput: 
                'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl h-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all',
              footerActionLink: 
                'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold',
              dividerLine: 'bg-gray-300 dark:bg-gray-600',
              dividerText: 'text-gray-500 dark:text-gray-400 font-medium',
              formFieldInputShowPasswordButton: 
                'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
              identityPreviewEditButton: 'text-blue-600 dark:text-blue-400 hover:text-blue-700',
              footer: 'bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl',
              footerActionText: 'text-gray-600 dark:text-gray-400',
            },
            layout: {
              socialButtonsPlacement: 'top',
              socialButtonsVariant: 'blockButton',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            🔒 Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
}

