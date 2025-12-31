import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User,
  Lock,
  Bell,
  Shield,
  Camera,
  Save,
  Eye,
  EyeOff,
  Upload,
  CheckCircle,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api, getImageUrl } from '../../lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneNumber: '',
  });

  // Supervisor-specific data
  const [supervisorData, setSupervisorData] = useState<any>(null);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    incidentAlerts: true,
    meetingReminders: true,
    operatorUpdates: true,
  });

  // Fetch complete profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        // Fetch user profile
        const userResponse = await api.get('/users/profile');
        const userData = userResponse.data;
        
        console.log('👤 User Profile Data:', userData);

        // Try to fetch supervisor-specific data
        try {
          const supervisorResponse = await api.get('/supervisors/my-profile');
          const supData = supervisorResponse.data;
          console.log('👨‍💼 Supervisor Data:', supData);
          setSupervisorData(supData);
          
          // Merge data, prioritizing supervisor data
          setProfileData({
            firstName: userData.firstName || supData.userId?.firstName || '',
            lastName: userData.lastName || supData.userId?.lastName || '',
            email: userData.email || supData.userId?.email || '',
            phone: userData.phone || userData.phoneNumber || supData.userId?.phone || supData.userId?.phoneNumber || '',
            phoneNumber: userData.phoneNumber || userData.phone || supData.userId?.phoneNumber || supData.userId?.phone || '',
          });
        } catch (error) {
          // If supervisor endpoint fails, just use user data
          console.log('ℹ️ Using user data only');
          setProfileData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || userData.phoneNumber || '',
            phoneNumber: userData.phoneNumber || userData.phone || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
        // Fallback to user from auth store
        if (user) {
          setProfileData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: (user as any).phone || (user as any).phoneNumber || '',
            phoneNumber: (user as any).phoneNumber || (user as any).phone || '',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone || profileData.phoneNumber,
      };
      
      const response = await api.put('/users/profile', updateData);
      updateUser(response.data.user || response.data);
      toast.success('Profile updated successfully');
      
      // Refetch data to ensure sync
      const userResponse = await api.get('/users/profile');
      const userData = userResponse.data;
      setProfileData({
        ...profileData,
        firstName: userData.firstName || profileData.firstName,
        lastName: userData.lastName || profileData.lastName,
        phone: userData.phone || userData.phoneNumber || profileData.phone,
        phoneNumber: userData.phoneNumber || userData.phone || profileData.phoneNumber,
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsSaving(true);
        const response = await api.put('/users/profile/photo', {
          photo: reader.result,
        });
        updateUser({ profilePhoto: response.data.profilePhoto });
        toast.success('Profile photo updated');
      } catch (error: any) {
        console.error('Error uploading photo:', error);
        toast.error(error.response?.data?.error || 'Failed to upload photo');
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'password', name: 'Password', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-green-600" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {user?.profilePhoto ? (
                      <img
                        src={getImageUrl(user.profilePhoto)}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-12 h-12 text-green-600" />
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Profile Photo</h3>
                    <p className="text-sm text-gray-500">
                      Upload a photo to personalize your profile
                    </p>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, firstName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, lastName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Password Requirements</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Include at least one number</li>
                    <li>• Include at least one special character</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePasswordChange}
                    disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <p className="text-gray-600 text-sm">
                  Manage how you receive notifications and alerts
                </p>

                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in browser' },
                    { key: 'incidentAlerts', label: 'Incident Alerts', desc: 'Get notified about incidents in your area' },
                    { key: 'meetingReminders', label: 'Meeting Reminders', desc: 'Receive reminders before scheduled meetings' },
                    { key: 'operatorUpdates', label: 'Operator Updates', desc: 'Get notified about operator activities' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">{item.label}</h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications({
                            ...notifications,
                            [item.key]: !notifications[item.key as keyof typeof notifications],
                          })
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications[item.key as keyof typeof notifications]
                            ? 'bg-green-600'
                            : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications[item.key as keyof typeof notifications]
                              ? 'translate-x-7'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => toast.success('Notification preferences saved')}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    Save Preferences
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
