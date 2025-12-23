import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Camera,
  Lock,
  Bell,
  Globe,
  MessageSquare,
  Palette,
  Activity,
  HelpCircle,
  AlertTriangle,
  Shield,
  CreditCard,
  Smartphone,
  Monitor,
  LogOut,
  Key,
  ChevronRight,
  Clock,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getImageUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

// Types
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  passportPhoto?: string;
  employeeId?: string;
  role: string;
  state?: string;
  lga?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details?: string;
}

// Settings Sections
type SettingsSection = 
  | 'profile' 
  | 'id-card' 
  | 'security' 
  | 'notifications' 
  | 'regional' 
  | 'communication' 
  | 'appearance' 
  | 'activity' 
  | 'support' 
  | 'deactivation';

export default function SecretarySettingsPage() {
  const { user: authUser } = useAuthStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    transactionAlerts: true,
    documentExpiry: true,
    clientUpdates: true,
    budgetAlerts: true,
    invoiceReminders: true,
    mdAnnouncements: true,
    meetingInvites: true,
    emailNotifications: true,
    smsNotifications: false,
    doNotDisturb: false,
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    dashboardLayout: 'spacious' as 'compact' | 'spacious',
    highContrast: false,
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/profile');
      const userData = response.data.user;
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        email: userData.email || '',
        emergencyContactName: userData.emergencyContactName || '',
        emergencyContactPhone: userData.emergencyContactPhone || '',
      });
      
      // Load mock activity logs
      setActivityLogs([
        { id: '1', action: 'Login', timestamp: new Date().toISOString(), details: 'Successful login from mobile device' },
        { id: '2', action: 'Profile Updated', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Updated phone number' },
        { id: '3', action: 'Document Uploaded', timestamp: new Date(Date.now() - 172800000).toISOString(), details: 'Uploaded contract document' },
      ]);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.patch('/users/profile', formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      loadUserProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully!');
      
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordForm(false);
      }, 3000);
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: User, description: 'Personal information' },
    { id: 'id-card' as const, label: 'ID Card', icon: CreditCard, description: 'View & print ID card' },
    { id: 'security' as const, label: 'Security', icon: Lock, description: 'Password & 2FA' },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, description: 'Alert preferences' },
    { id: 'regional' as const, label: 'Regional', icon: Globe, description: 'Display settings' },
    { id: 'communication' as const, label: 'Communication', icon: MessageSquare, description: 'Message preferences' },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette, description: 'Theme & layout' },
    { id: 'activity' as const, label: 'Activity Log', icon: Activity, description: 'Your activity' },
    { id: 'support' as const, label: 'Help & Support', icon: HelpCircle, description: 'Get help' },
    { id: 'deactivation' as const, label: 'Account', icon: AlertTriangle, description: 'Deactivation' },
  ];

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar Navigation - Horizontal scroll on mobile */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Mobile: Horizontal scroll */}
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible p-2 lg:p-0 gap-1 lg:gap-0 scrollbar-hide">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-none text-left whitespace-nowrap lg:whitespace-normal transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 lg:border-l-4 lg:border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 lg:hover:border-l-4 lg:hover:border-gray-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="hidden lg:block">
                      <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                        {section.label}
                      </p>
                      <p className="text-xs text-gray-500">{section.description}</p>
                    </div>
                    <span className="lg:hidden text-sm font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {user?.profilePhoto || user?.passportPhoto ? (
                      <img
                        src={getImageUrl(user.profilePhoto || user.passportPhoto)}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-200">
                        <User className="w-12 h-12 text-blue-600" />
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{user?.role}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {user?.employeeId || 'N/A'}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ID Card Section */}
            {activeSection === 'id-card' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">ID Card Generator</h2>
                  <p className="text-sm text-gray-600 mt-1">Generate and manage your professional ID card</p>
                </div>

                {/* Hero Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Your Professional ID Card</h3>
                      <p className="text-gray-600 mb-4">
                        Generate your official Javelin Security ID card with QR code verification and CR80 standard format.
                      </p>
                      <a
                        href="/secretary/id-cards"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        Generate ID Card
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">QR Verification</h4>
                      <p className="text-sm text-gray-600">Secure QR code for instant identity verification</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">CR80 Standard</h4>
                      <p className="text-sm text-gray-600">Industry standard 85.60 × 53.98 mm format</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">PDF Export</h4>
                      <p className="text-sm text-gray-600">Download high-quality PDF for printing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">1 Year Validity</h4>
                      <p className="text-sm text-gray-600">Valid for 12 months from issue date</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">6</p>
                    <p className="text-xs text-gray-600">Role Types</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">1</p>
                    <p className="text-xs text-gray-600">Year Validity</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">PDF</p>
                    <p className="text-xs text-gray-600">Export Format</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Account Security</h2>

                {/* Change Password */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <Key className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Change Password</h3>
                        <p className="text-sm text-gray-500 mt-1">Update your password regularly for security</p>
                      </div>
                    </div>
                    {!showPasswordForm && (
                      <button 
                        onClick={() => setShowPasswordForm(true)}
                        className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {/* Password Change Form */}
                  {showPasswordForm && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                          placeholder="Enter current password"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                          placeholder="Enter new password (min 8 characters)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                          placeholder="Confirm new password"
                        />
                      </div>

                      {/* Error and Success Messages */}
                      {passwordError && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                          <X className="w-5 h-5 flex-shrink-0" />
                          <span>{passwordError}</span>
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-4 py-3 rounded-lg">
                          <Check className="w-5 h-5 flex-shrink-0" />
                          <span>Password changed successfully!</span>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={handleChangePassword}
                          disabled={isChangingPassword}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Changing...
                            </>
                          ) : (
                            <>
                              <Shield className="w-5 h-5" />
                              Change Password
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowPasswordForm(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setPasswordError(null);
                            setPasswordSuccess(false);
                          }}
                          disabled={isChangingPassword}
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2 text-sm">Password Requirements:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span>At least 8 characters long</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span>Different from your current password</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Two-Factor Authentication */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Shield className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Login Devices */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Monitor className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Login Devices</h3>
                        <p className="text-sm text-gray-500 mt-1">Devices where you're currently logged in</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Current Device</p>
                          <p className="text-xs text-gray-500">Last active now</p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                    </div>
                  </div>
                </div>

                {/* Logout All Devices */}
                <button className="w-full p-4 border border-red-200 bg-red-50 rounded-xl text-left hover:bg-red-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-red-600" />
                    <div>
                      <h3 className="font-medium text-red-700">Logout All Devices</h3>
                      <p className="text-sm text-red-600 mt-1">Sign out from all devices except this one</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Activity Log Section */}
            {activeSection === 'activity' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{log.action}</p>
                        <p className="text-sm text-gray-600">{log.details}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder for other sections */}
            {['notifications', 'regional', 'communication', 'appearance', 'support', 'deactivation'].includes(activeSection) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {sections.find(s => s.id === activeSection)?.icon && 
                    React.createElement(sections.find(s => s.id === activeSection)!.icon, { 
                      className: "w-8 h-8 text-gray-400" 
                    })
                  }
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {sections.find(s => s.id === activeSection)?.label}
                </h3>
                <p className="text-gray-600">This section is under development</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
