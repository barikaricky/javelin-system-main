import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  QrCode,
  Download,
  Clock,
  ArrowRight
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
  employeeId: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  incidentAlerts: boolean;
  attendanceAlerts: boolean;
  systemUpdates: boolean;
  weeklyReports: boolean;
}

export default function EnhancedSettingsPage() {
  const { user: _user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'id-card' | 'password' | 'notifications' | 'preferences'>('profile');
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
    employeeId: ''
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
    incidentAlerts: true,
    attendanceAlerts: true,
    systemUpdates: false,
    weeklyReports: true
  });

  // Preferences State
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY'
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('🔄 Fetching supervisor profile...');
        
        // Try to get user profile first
        const userResponse = await api.get('/users/profile');
        console.log('👤 User Response:', userResponse.data);
        const userData = userResponse.data.user || userResponse.data;
        
        // Try to get supervisor-specific data
        let supervisorData = null;
        try {
          const supervisorResponse = await api.get('/supervisors/my-profile');
          console.log('👨‍💼 Supervisor Response:', supervisorResponse.data);
          supervisorData = supervisorResponse.data.supervisor || supervisorResponse.data;
        } catch (err) {
          console.log('ℹ️ No supervisor-specific data available');
        }
        
        // Extract profile photo - check multiple possible locations
        const profilePhoto = userData?.profilePhoto || 
                            userData?.passportPhoto || 
                            supervisorData?.passportPhoto || 
                            (supervisorData?.userId as any)?.profilePhoto ||
                            (supervisorData?.userId as any)?.passportPhoto ||
                            null;
        
        // Extract employee ID from supervisor data
        const employeeId = supervisorData?.employeeId || '';
        
        console.log('📸 Profile Photo:', profilePhoto);
        console.log('🆔 Employee ID:', employeeId);
        
        // Merge data with priority to supervisor-specific fields
        const profileData = {
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
          email: userData?.email || '',
          phone: supervisorData?.phone || supervisorData?.phoneNumber || userData?.phone || userData?.phoneNumber || '',
          address: userData?.address || supervisorData?.address || '',
          profilePhoto: profilePhoto,
          employeeId: employeeId
        };
        
        console.log('✅ Final Profile Data:', profileData);
        setProfile(profileData);
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
      await api.put('/users/profile', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        address: profile.address
      });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
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
    { key: 'id-card', label: 'ID Card', icon: CreditCard },
    { key: 'password', label: 'Password', icon: Lock },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'preferences', label: 'Preferences', icon: Settings }
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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Settings Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-500">Update your personal information</p>
                </div>

                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profile.profilePhoto ? (
                      <img
                        src={getImageUrl(profile.profilePhoto)}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + 
                            encodeURIComponent(`${profile.firstName} ${profile.lastName}`) + 
                            '&size=200&background=3B82F6&color=fff';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                        {profile.firstName && profile.lastName ? `${profile.firstName[0]}${profile.lastName[0]}` : 'SV'}
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <Camera size={16} className="text-gray-600" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{profile.firstName} {profile.lastName}</h3>
                    <p className="text-sm text-gray-500">Supervisor</p>
                    <p className="text-xs text-gray-400 mt-1">Employee ID: {profile.employeeId || 'N/A'}</p>
                  </div>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ID Card Tab */}
            {activeTab === 'id-card' && (
              <div className="space-y-8">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <CreditCard className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Professional ID Card</h2>
                        <p className="text-blue-100 text-sm">Generate and manage your digital identification</p>
                      </div>
                    </div>
                    <p className="text-blue-50 max-w-2xl">
                      Create your professional ID card with QR code verification, compliant with CR80 standard specifications. 
                      Perfect for security access and official identification purposes.
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <QrCode className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">QR Verification</h3>
                    <p className="text-sm text-gray-600">Secure QR code for instant identity verification</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                      <CreditCard className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">CR80 Standard</h3>
                    <p className="text-sm text-gray-600">Industry-standard 85.60×53.98mm format</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <Download className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">PDF Export</h3>
                    <p className="text-sm text-gray-600">Download high-quality PDF for printing</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">1 Year Validity</h3>
                    <p className="text-sm text-gray-600">Valid for one year from issue date</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 p-6 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">6</div>
                    <div className="text-sm text-gray-600">Role Types</div>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <div className="text-3xl font-bold text-blue-600 mb-1">1 Year</div>
                    <div className="text-sm text-gray-600">Validity Period</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">PDF</div>
                    <div className="text-sm text-gray-600">Export Format</div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-center">
                  <Link
                    to="/supervisor/id-cards"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-semibold">Generate My ID Card</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>

                {/* Info Box */}
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Features
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Anti-copy pattern overlay for security</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>QR code links to secure verification page</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Role-based color coding for quick identification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Expiry date tracking for validity management</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                  <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
                </div>

                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
                    <ul className="space-y-1 text-sm">
                      <li className={`flex items-center gap-2 ${passwords.new.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwords.new.length >= 8 ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        At least 8 characters
                      </li>
                      <li className={`flex items-center gap-2 ${/[A-Z]/.test(passwords.new) ? 'text-green-600' : 'text-gray-500'}`}>
                        {/[A-Z]/.test(passwords.new) ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        One uppercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${/[0-9]/.test(passwords.new) ? 'text-green-600' : 'text-gray-500'}`}>
                        {/[0-9]/.test(passwords.new) ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        One number
                      </li>
                      <li className={`flex items-center gap-2 ${passwords.new === passwords.confirm && passwords.confirm.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwords.new === passwords.confirm && passwords.confirm.length > 0 ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        Passwords match
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handlePasswordChange}
                    disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>Updating...</>
                    ) : (
                      <>
                        <Shield size={18} />
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
                  <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                  <p className="text-sm text-gray-500">Configure how you receive notifications</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                    { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications on your device' },
                    { key: 'incidentAlerts', label: 'Incident Alerts', description: 'Get notified about new incidents immediately' },
                    { key: 'attendanceAlerts', label: 'Attendance Alerts', description: 'Get notified about attendance issues' },
                    { key: 'systemUpdates', label: 'System Updates', description: 'Receive updates about system changes' },
                    { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly summary reports' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{setting.label}</p>
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[setting.key as keyof NotificationSettings]}
                          onChange={(e) => setNotifications({ ...notifications, [setting.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Settings
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
                  <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
                  <p className="text-sm text-gray-500">Customize your experience</p>
                </div>

                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                        className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg transition-colors ${
                          preferences.theme === 'light' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <Sun size={20} className={preferences.theme === 'light' ? 'text-blue-600' : 'text-gray-400'} />
                        <span className={preferences.theme === 'light' ? 'text-blue-600 font-medium' : 'text-gray-600'}>Light</span>
                      </button>
                      <button
                        onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                        className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg transition-colors ${
                          preferences.theme === 'dark' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <Moon size={20} className={preferences.theme === 'dark' ? 'text-blue-600' : 'text-gray-400'} />
                        <span className={preferences.theme === 'dark' ? 'text-blue-600 font-medium' : 'text-gray-600'}>Dark</span>
                      </button>
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <div className="relative max-w-xs">
                      <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    </select>
                  </div>

                  {/* Date Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
