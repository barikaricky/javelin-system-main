import { useState, useRef } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Camera, 
  Upload, 
  Trash2, 
  Check, 
  X, 
  Loader2,
  CreditCard,
  Save
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api, getImageUrl } from '../../lib/api';

export default function SettingsPage() {
  const { user, setAuth, updateUser: _updateUser, token, refreshToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'system' | 'idcard'>('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const response = await api.post('/users/profile/photo', {
          photo: base64String,
        });

        // Update auth store with new user data
        if (response.data.user && token) {
          setAuth(response.data.user, token, refreshToken || undefined);
        }

        setUploadSuccess(true);
        setPreviewUrl(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        setUploadError('Failed to read file');
        setPreviewUrl(null);
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.error || 'Failed to upload photo');
      setPreviewUrl(null);
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.profilePhoto) return;
    
    if (!confirm('Are you sure you want to delete your profile photo?')) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await api.delete('/users/profile/photo');

      // Update auth store
      if (user && token) {
        setAuth({ ...user, profilePhoto: undefined }, token, refreshToken || undefined);
      }

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      console.error('Delete error:', error);
      setUploadError(error.response?.data?.error || 'Failed to delete photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setUploadError(null);

    try {
      const response = await api.patch('/users/profile', {
        firstName,
        lastName,
        phone: phone || null,
      });

      // Update auth store
      if (response.data.user && token) {
        setAuth(response.data.user, token, refreshToken || undefined);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Save error:', error);
      setUploadError(error.response?.data?.error || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
      
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (error: any) {
      console.error('Password change error:', error);
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-600" />
            Settings
          </h1>
          <p className="text-slate-600 mt-1">Manage your account and system preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <TabButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')}
            icon={User}
            label="Profile"
          />
          <TabButton 
            active={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')}
            icon={Bell}
            label="Notifications"
          />
          <TabButton 
            active={activeTab === 'security'} 
            onClick={() => setActiveTab('security')}
            icon={Shield}
            label="Security"
          />
          <TabButton 
            active={activeTab === 'system'} 
            onClick={() => setActiveTab('system')}
            icon={Database}
            label="System"
          />
          <TabButton 
            active={activeTab === 'idcard'} 
            onClick={() => setActiveTab('idcard')}
            icon={CreditCard}
            label="ID Cards"
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-500" />
                Profile Picture
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Upload a professional photo for your ID card and profile. Max file size: 5MB
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Photo Preview */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : user?.profilePhoto ? (
                      <img 
                        src={getImageUrl(user.profilePhoto)} 
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-blue-600">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  {/* Upload overlay on hover */}
                  <button
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="absolute inset-0 w-32 h-32 rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-white" />
                    )}
                  </button>
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={triggerFileInput}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </button>

                    {user?.profilePhoto && (
                      <button
                        onClick={handleDeletePhoto}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Status Messages */}
                  {uploadError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                      <X className="w-4 h-4" />
                      {uploadError}
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                      <Check className="w-4 h-4" />
                      Photo updated successfully!
                    </div>
                  )}

                  <p className="text-xs text-slate-400">
                    Supported formats: JPEG, PNG, GIF, WebP
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-500" />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                
                {saveSuccess && (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Saved!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
                <p className="text-sm text-slate-500">Configure how you receive notifications</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <NotificationToggle label="Email Notifications" description="Receive updates via email" defaultChecked />
              <NotificationToggle label="Push Notifications" description="Receive push notifications" defaultChecked />
              <NotificationToggle label="SMS Alerts" description="Receive important alerts via SMS" />
              <NotificationToggle label="Weekly Reports" description="Receive weekly summary reports" defaultChecked />
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Password Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
                  <p className="text-sm text-slate-500">Update your password regularly for security</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter current password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Confirm new password"
                  />
                </div>

                {/* Error and Success Messages */}
                {passwordError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                    <X className="w-5 h-5" />
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-4 py-3 rounded-lg">
                    <Check className="w-5 h-5" />
                    Password changed successfully!
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Change Password
                    </>
                  )}
                </button>

                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm">Password Requirements:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      At least 8 characters long
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Different from your current password
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication (Future Feature) */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 opacity-60">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-slate-900 mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-slate-500 mb-4">Add an extra layer of security to your account</p>
                <button 
                  disabled
                  className="px-4 py-2 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">System Settings</h2>
                <p className="text-sm text-slate-500">System configuration and data management</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-slate-900 mb-2">Export Data</h3>
                <p className="text-sm text-slate-500 mb-4">Download all your organization data</p>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                  Export Data
                </button>
              </div>
              
              <div className="p-4 bg-red-50 rounded-xl">
                <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600 mb-4">Irreversible actions - proceed with caution</p>
                <button className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'idcard' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">ID Card Management</h2>
                <p className="text-sm text-slate-500">Generate and manage staff ID cards</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-yellow-50 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-slate-900 mb-2">Security-Grade ID Cards</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Generate professional CR80 standard ID cards with QR code verification, anti-copy patterns, and role-based color coding.
                </p>
                <ul className="text-sm text-slate-600 space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>International CR80 standard (85.60 × 53.98 mm)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>QR code verification with live status</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Role-based color identification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Anti-copy security patterns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Export as PDF or print directly</span>
                  </li>
                </ul>
                <a 
                  href="/director/id-cards"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  <CreditCard className="w-5 h-5" />
                  Open ID Card Generator
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-slate-900 mb-1">6</div>
                  <div className="text-sm text-slate-600">Role Types</div>
                  <div className="text-xs text-slate-500 mt-1">Operator to Director</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-slate-900 mb-1">1 Year</div>
                  <div className="text-sm text-slate-600">Validity Period</div>
                  <div className="text-xs text-slate-500 mt-1">Auto-expiry tracking</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-slate-900 mb-1">PDF</div>
                  <div className="text-sm text-slate-600">Export Format</div>
                  <div className="text-xs text-slate-500 mt-1">Print-ready quality</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
        active 
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
          : 'bg-white text-slate-600 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// Notification Toggle Component
function NotificationToggle({ 
  label, 
  description, 
  defaultChecked = false 
}: { 
  label: string; 
  description: string; 
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div>
        <h3 className="font-medium text-slate-900">{label}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span 
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
