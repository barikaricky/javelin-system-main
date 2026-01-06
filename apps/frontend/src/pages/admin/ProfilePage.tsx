import { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Bell,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Save,
  Camera,
  CheckCircle,
  AlertCircle,
  Settings,
  Shield,
  Globe,
  Moon,
  Sun,
  Loader2,
  CreditCard,
  Clock,
  Briefcase,
  MapPin,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { api, getImageUrl } from '../../lib/api';

interface ProfileSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  profilePhoto: string | null;
  staffId: string;
  jobTitle: string;
  department: string;
  adminRoleLevel: string;
  employmentStartDate: string;
  stateOfOrigin?: string;
  lga?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  systemUpdates: boolean;
  messageAlerts: boolean;
}

export default function AdminProfilePage() {
  const { user: _user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'preferences' | 'login-history'>('profile');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile State
  const [profile, setProfile] = useState<ProfileSettings>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    profilePhoto: null,
    staffId: '',
    jobTitle: '',
    department: '',
    adminRoleLevel: '',
    employmentStartDate: '',
    stateOfOrigin: '',
    lga: '',
  });

  // Password State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Notification State
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    systemUpdates: false,
    messageAlerts: true,
  });

  // Preferences State
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY'
  });

  // Login History State
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('adminPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('adminNotificationSettings');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
  }, []);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('🔄 Fetching admin profile...');
        
        // Get user profile first
        const userResponse = await api.get('/users/profile');
        console.log('👤 User Response:', userResponse.data);
        const userData = userResponse.data.user || userResponse.data;
        
        // Get admin-specific data
        let adminData = null;
        try {
          const adminResponse = await api.get('/admins/my-profile');
          console.log('👨‍💼 Admin Response:', adminResponse.data);
          adminData = adminResponse.data.admin || adminResponse.data;
          console.log('👨‍💼 Admin Data Extracted:', adminData);
        } catch (err) {
          console.log('ℹ️ No admin-specific data available', err);
        }
        
        // Extract profile photo - check multiple possible locations
        const profilePhoto = userData?.profilePhoto || 
                            userData?.passportPhoto || 
                            adminData?.passportPhotoUrl || 
                            (adminData?.userId as any)?.profilePhoto ||
                            (adminData?.userId as any)?.passportPhoto ||
                            null;
        
        console.log('📸 Profile Photo Sources:');
        console.log('  - userData.profilePhoto:', userData?.profilePhoto);
        console.log('  - userData.passportPhoto:', userData?.passportPhoto);
        console.log('  - adminData.passportPhotoUrl:', adminData?.passportPhotoUrl);
        console.log('  - adminData.userId.profilePhoto:', (adminData?.userId as any)?.profilePhoto);
        console.log('  - adminData.userId.passportPhoto:', (adminData?.userId as any)?.passportPhoto);
        console.log('📸 Final Profile Photo:', profilePhoto);
        console.log('🆔 Staff ID:', adminData?.staffId);
        console.log('🏢 Admin Data Full:', adminData);
        
        // Merge data
        const profileData = {
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
          email: userData?.email || '',
          phone: userData?.phone || userData?.phoneNumber || (adminData?.userId as any)?.phone || (adminData?.userId as any)?.phoneNumber || '',
          address: userData?.address || adminData?.address || '',
          profilePhoto: profilePhoto,
          staffId: adminData?.staffId || '',
          jobTitle: adminData?.jobTitle || '',
          department: adminData?.department || '',
          adminRoleLevel: adminData?.adminRoleLevel || '',
          employmentStartDate: adminData?.employmentStartDate || '',
          stateOfOrigin: adminData?.stateOfOrigin || '',
          lga: adminData?.lga || '',
        };
        
        console.log('✅ Final Profile Data:', profileData);
        setProfile(profileData);

        // Fetch login history if available
        if (adminData?.loginHistory) {
          setLoginHistory(adminData.loginHistory.slice(0, 10)); // Last 10 logins
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save profile if on profile tab
      if (activeTab === 'profile') {
        await api.put('/users/profile', {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          address: profile.address
        });
        toast.success('Profile updated successfully!');
      }
      
      // Save notifications if on notifications tab
      if (activeTab === 'notifications') {
        localStorage.setItem('adminNotificationSettings', JSON.stringify(notifications));
        toast.success('Notification settings saved successfully!');
      }
      
      // Save preferences if on preferences tab
      if (activeTab === 'preferences') {
        localStorage.setItem('adminPreferences', JSON.stringify(preferences));
        toast.success('Preferences saved successfully!');
      }
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match!');
      return;
    }
    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters long!');
      return;
    }
    if (!passwords.current) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwords.current === passwords.new) {
      toast.error('New password must be different from current password');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success('Password changed successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'password', label: 'Password', icon: Lock },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'preferences', label: 'Preferences', icon: Settings },
    { key: 'login-history', label: 'Login History', icon: Clock }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">Manage your profile and account preferences</p>
      </div>

      {/* Settings Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-600">Update your personal information (view-only for some fields)</p>
                </div>

                {/* Profile Photo */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                  <div className="relative">
                    {profile.profilePhoto ? (
                      <img
                        src={getImageUrl(profile.profilePhoto)}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + 
                            encodeURIComponent(`${profile.firstName} ${profile.lastName}`) + 
                            '&size=200&background=06B6D4&color=fff';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                        {profile.firstName && profile.lastName ? `${profile.firstName[0]}${profile.lastName[0]}` : 'AD'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{profile.firstName} {profile.lastName}</h3>
                    <p className="text-sm text-gray-600">{profile.jobTitle || 'Admin'}</p>
                    <p className="text-xs text-gray-500 mt-1">Staff ID: {profile.staffId || 'N/A'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-cyan-50 text-cyan-700 rounded-full font-medium">
                        {profile.adminRoleLevel || 'Admin'}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-full font-medium">
                        {profile.department || 'Operations'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Work Information (View-only) */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Work Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Briefcase className="w-4 h-4" />
                        Job Title
                      </label>
                      <p className="font-medium text-gray-900">{profile.jobTitle || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Shield className="w-4 h-4" />
                        Role Level
                      </label>
                      <p className="font-medium text-gray-900">{profile.adminRoleLevel || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        Employment Start
                      </label>
                      <p className="font-medium text-gray-900">
                        {profile.employmentStartDate ? new Date(profile.employmentStartDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MapPin className="w-4 h-4" />
                        State of Origin
                      </label>
                      <p className="font-medium text-gray-900">{profile.stateOfOrigin || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information (Editable) */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                  <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900 mb-1">Password Requirements</h3>
                      <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                        <li>At least 8 characters long</li>
                        <li>Must be different from current password</li>
                        <li>Recommended: Include uppercase, lowercase, numbers, and symbols</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handlePasswordChange}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-600">Manage how you receive notifications</p>
                </div>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-600">
                          Receive {key.replace(/([A-Z])/g, ' $1').toLowerCase()} notifications
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Application Preferences</h2>
                  <p className="text-sm text-gray-600">Customize your application experience</p>
                </div>

                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                          preferences.theme === 'light'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Sun className="w-5 h-5" />
                        <span className="font-medium">Light</span>
                      </button>
                      <button
                        onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                          preferences.theme === 'dark'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Moon className="w-5 h-5" />
                        <span className="font-medium">Dark</span>
                      </button>
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Africa/Lagos">Lagos (WAT)</option>
                      <option value="Africa/Cairo">Cairo (EET)</option>
                      <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                      <option value="America/New_York">New York (EST)</option>
                      <option value="Europe/London">London (GMT)</option>
                    </select>
                  </div>

                  {/* Date Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Login History Tab */}
            {activeTab === 'login-history' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Login History</h2>
                  <p className="text-sm text-gray-600">Recent account activity and login sessions</p>
                </div>

                {loginHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No login history available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loginHistory.map((login, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          {login.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {login.success ? 'Successful Login' : 'Failed Login Attempt'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {login.device || 'Unknown device'} • {login.ipAddress || 'Unknown IP'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(login.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
