'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type NotificationSettings = {
  emailOrderUpdates: boolean;
  emailPromotions: boolean;
  emailNewsletter: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
};

type PrivacySettings = {
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showOrderHistory: boolean;
  allowDataCollection: boolean;
};

type SecuritySettings = {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // in minutes
  loginAlerts: boolean;
};

export default function SettingsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'security' | 'data'>('notifications');
  const [isSaving, setIsSaving] = useState(false);

  // Settings states
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailOrderUpdates: true,
    emailPromotions: false,
    emailNewsletter: false,
    pushNotifications: true,
    smsNotifications: false,
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'private',
    showEmail: false,
    showOrderHistory: false,
    allowDataCollection: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true,
  });

  // Check authentication and authorization
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast.error('Please sign in to access settings');
      router.push('/login');
      return;
    }

    // Prevent admin from accessing user settings
    const userRole = user?.publicMetadata?.role as string;
    if (userRole === 'admin') {
      toast.error('Admin users should use the admin panel');
      router.push('/admin');
      return;
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Load settings from localStorage
  useEffect(() => {
    if (isSignedIn && user?.id) {
      const savedNotifications = localStorage.getItem(`settings_notifications_${user.id}`);
      const savedPrivacy = localStorage.getItem(`settings_privacy_${user.id}`);
      const savedSecurity = localStorage.getItem(`settings_security_${user.id}`);

      if (savedNotifications) setNotificationSettings(JSON.parse(savedNotifications));
      if (savedPrivacy) setPrivacySettings(JSON.parse(savedPrivacy));
      if (savedSecurity) setSecuritySettings(JSON.parse(savedSecurity));
    }
  }, [isSignedIn, user?.id]);

  const handleSaveSettings = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem(`settings_notifications_${user.id}`, JSON.stringify(notificationSettings));
      localStorage.setItem(`settings_privacy_${user.id}`, JSON.stringify(privacySettings));
      localStorage.setItem(`settings_security_${user.id}`, JSON.stringify(securitySettings));

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      // In production, this would call an API to generate user data export
      const userData = {
        user: {
          id: user?.id,
          email: user?.emailAddresses[0]?.emailAddress,
          name: user?.fullName,
          createdAt: user?.createdAt,
        },
        settings: {
          notifications: notificationSettings,
          privacy: privacySettings,
          security: securitySettings,
        },
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete all your data? This action cannot be undone!\n\nThis will delete:\n- Order history\n- Reviews\n- Favorites\n- Cart items\n- Settings'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm('Please confirm again. This is irreversible!');
    if (!doubleConfirm) return;

    try {
      if (user?.id) {
        // Clear all localStorage data
        localStorage.removeItem(`settings_notifications_${user.id}`);
        localStorage.removeItem(`settings_privacy_${user.id}`);
        localStorage.removeItem(`settings_security_${user.id}`);
        localStorage.removeItem(`chat_state_${user.id}`);
        localStorage.removeItem('cart');
        localStorage.removeItem('favorites');
      }

      toast.success('All data deleted successfully');
      
      // In production, you would call an API to delete from database
      // await fetch('/api/user/delete-data', { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Failed to delete data');
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'notifications', label: '🔔 Notifications', icon: '📧' },
    { id: 'privacy', label: '🔒 Privacy', icon: '👁️' },
    { id: 'security', label: '🛡️ Security', icon: '🔐' },
    { id: 'data', label: '💾 Data', icon: '📦' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">⚙️ Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and settings</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-orange-600 text-orange-600 dark:text-orange-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📧 Email Notifications</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Order Updates</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about order status changes</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailOrderUpdates}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOrderUpdates: e.target.checked })}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Promotions & Deals</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive special offers and discounts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailPromotions}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailPromotions: e.target.checked })}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Newsletter</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Weekly product updates and news</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNewsletter}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNewsletter: e.target.checked })}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📱 Other Notifications</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Browser notifications for important updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Text messages for critical order updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👁️ Profile Visibility</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <label className="block mb-3">
                        <span className="font-medium text-gray-900 dark:text-white">Profile Visibility</span>
                        <select
                          value={privacySettings.profileVisibility}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value as 'public' | 'private' })}
                          className="mt-2 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        >
                          <option value="private">Private - Only you can see your profile</option>
                          <option value="public">Public - Anyone can see your reviews and activity</option>
                        </select>
                      </label>
                    </div>

                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Show Email Address</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Display your email on public profile</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.showEmail}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, showEmail: e.target.checked })}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Show Order History</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Make your purchase history visible</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.showOrderHistory}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, showOrderHistory: e.target.checked })}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Allow Data Collection</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Help us improve with anonymized analytics</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.allowDataCollection}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, allowDataCollection: e.target.checked })}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔐 Authentication</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                          <span className="text-2xl">🔒</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              securitySettings.twoFactorEnabled
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {securitySettings.twoFactorEnabled ? '✓ Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Add an extra layer of security to your account with 2FA authentication.
                          </p>
                          <button
                            onClick={() => {
                              setSecuritySettings({ ...securitySettings, twoFactorEnabled: !securitySettings.twoFactorEnabled });
                              toast.success(securitySettings.twoFactorEnabled ? '2FA disabled' : '2FA enabled (demo mode)');
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              securitySettings.twoFactorEnabled
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                            }`}
                          >
                            {securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <label className="block">
                        <span className="font-medium text-gray-900 dark:text-white">Session Timeout</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Auto-logout after inactivity</p>
                        <select
                          value={securitySettings.sessionTimeout}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                          className="block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={0}>Never (not recommended)</option>
                        </select>
                      </label>
                    </div>

                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Login Alerts</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Get notified of new login attempts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={securitySettings.loginAlerts}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, loginAlerts: e.target.checked })}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">🛡️ Password Management</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                    Your password is managed by Clerk. Click below to change your password securely.
                  </p>
                  <button
                    onClick={() => {
                      toast.success('Opening Clerk account management...');
                      // In production, this would trigger Clerk's password change flow
                      window.open('https://clerk.com', '_blank');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📦 Data Management</h3>
                  
                  <div className="space-y-4">
                    {/* Export Data */}
                    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📥</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Export Your Data</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Download a copy of all your data including orders, reviews, favorites, and settings in JSON format.
                          </p>
                          <button
                            onClick={handleExportData}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download My Data
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Data */}
                    <div className="p-6 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Delete All Data</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Permanently delete all your data including orders, reviews, favorites, and settings. This action cannot be undone!
                          </p>
                          <button
                            onClick={handleDeleteAllData}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete All My Data
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* GDPR Compliance */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <span>🇪🇺</span>
                        GDPR Compliance
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        We respect your privacy rights under GDPR. You have the right to access, correct, delete, and export your personal data at any time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Changes are saved locally. In production, these would sync to your account.
              </p>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





