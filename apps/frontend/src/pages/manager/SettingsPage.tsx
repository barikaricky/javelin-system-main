import { useState, useEffect, useRef } from 'react';
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
  Printer,
  Download,
  Eye,
  ChevronRight,
  X,
  Edit3,
  Save,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  LogOut,
  Key,
  QrCode,
  FileText,
  Clock,
  Check,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getImageUrl } from '../../lib/api';

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
  managers?: {
    id: string;
    regionAssigned?: string;
    salary?: number;
    startDate?: string;
  };
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

export default function ManagerSettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
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
    supervisorMessages: true,
    generalSupervisorUpdates: true,
    attendanceAlerts: true,
    incidentReports: true,
    locationAlerts: true,
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

  const idCardRef = useRef<HTMLDivElement>(null);

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
        { id: '3', action: 'Supervisor Registered', timestamp: new Date(Date.now() - 172800000).toISOString(), details: 'Registered John Doe as Supervisor' },
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

  const handlePrintIdCard = (format: 'cr80' | 'a4') => {
    window.print();
    toast.success(`Printing ID card in ${format === 'cr80' ? 'standard' : 'A4'} format`);
  };

  const handleDownloadPdf = () => {
    toast.success('Downloading ID card as PDF...');
    // In real implementation, would use a library like html2pdf
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
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-5 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-5 lg:gap-6">
        {/* Sidebar Navigation - Responsive for all screen sizes */}
        <div className="md:w-56 lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Mobile/Portrait: Horizontal scroll, Landscape/Tablet+: Vertical sidebar */}
            <div className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-0 gap-1 md:gap-0 scrollbar-hide">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 lg:py-3 rounded-lg md:rounded-none text-left whitespace-nowrap md:whitespace-normal transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 md:border-l-4 md:border-emerald-600'
                        : 'text-gray-600 hover:bg-gray-50 md:hover:border-l-4 md:hover:border-gray-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <div className="hidden md:block">
                      <p className={`text-sm font-medium ${isActive ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {section.label}
                      </p>
                      <p className="text-xs text-gray-500 hidden lg:block">{section.description}</p>
                    </div>
                    <span className="md:hidden text-xs sm:text-sm font-medium">{section.label}</span>
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
                  <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Photo */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative">
                    {user?.profilePhoto || user?.passportPhoto ? (
                      <img
                        src={getImageUrl(user.profilePhoto || user.passportPhoto)}
                        alt="Profile"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-100"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-gray-100">
                        <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 shadow-lg">
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h3>
                    <p className="text-sm text-emerald-600 font-medium">Manager</p>
                    <p className="text-xs text-gray-500 mt-1">Employee ID: {user?.employeeId || 'N/A'}</p>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {/* Locked Fields */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">Read-Only Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">Employee ID</span>
                      <p className="text-sm font-medium text-gray-900">{user?.employeeId || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">Role</span>
                      <p className="text-sm font-medium text-gray-900">Manager</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">Region Assigned</span>
                      <p className="text-sm font-medium text-gray-900">{user?.managers?.regionAssigned || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">Start Date</span>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.managers?.startDate 
                          ? new Date(user.managers.startDate).toLocaleDateString() 
                          : user?.createdAt 
                            ? new Date(user.createdAt).toLocaleDateString() 
                            : 'N/A'}
                      </p>
                    </div>
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
                <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Your Professional ID Card</h3>
                      <p className="text-gray-600 mb-4">
                        Generate your official Javelin Security ID card with QR code verification and CR80 standard format.
                      </p>
                      <a
                        href="/manager/id-cards"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">QR Verification</h4>
                      <p className="text-sm text-gray-600">Secure QR code for instant identity verification</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">CR80 Standard</h4>
                      <p className="text-sm text-gray-600">Industry standard 85.60 × 53.98 mm format</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Download className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">PDF Export</h4>
                      <p className="text-sm text-gray-600">Download high-quality PDF for printing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Printer className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Print Ready</h4>
                      <p className="text-sm text-gray-600">Print directly or send to card printer</p>
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

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Role Identification</h4>
                      <p className="text-sm text-gray-600">Color-coded role indicators for easy identification</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">6</p>
                    <p className="text-xs text-gray-600">Role Types</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">1</p>
                    <p className="text-xs text-gray-600">Year Validity</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">PDF</p>
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
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Key className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Change Password</h3>
                        <p className="text-sm text-gray-500 mt-1">Update your password regularly for security</p>
                      </div>
                    </div>
                    {!showPasswordForm && (
                      <button 
                        onClick={() => setShowPasswordForm(true)}
                        className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
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
                          <p className="text-sm font-medium text-gray-900">iPhone 13</p>
                          <p className="text-xs text-gray-500">Current device • Lagos, Nigeria</p>
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

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>

                <div className="space-y-4">
                  {[
                    { key: 'supervisorMessages', label: 'Supervisor Messages', desc: 'Messages from supervisors' },
                    { key: 'generalSupervisorUpdates', label: 'General Supervisor Updates', desc: 'Updates from general supervisors' },
                    { key: 'attendanceAlerts', label: 'Attendance Alerts', desc: 'Late arrivals and absences' },
                    { key: 'incidentReports', label: 'Incident Reports', desc: 'New incident notifications' },
                    { key: 'locationAlerts', label: 'Location Alerts', desc: 'Location and bit changes' },
                    { key: 'mdAnnouncements', label: 'MD Announcements', desc: 'Announcements from management' },
                    { key: 'meetingInvites', label: 'Meeting Invites', desc: 'New meeting invitations' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            [item.key]: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-4">Delivery Methods</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications' },
                      { key: 'smsNotifications', label: 'SMS Notifications' },
                      { key: 'doNotDisturb', label: 'Do Not Disturb Mode' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              [item.key]: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Regional Section */}
            {activeSection === 'regional' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Regional Display Settings</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Region View</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                      <option>All Regions</option>
                      <option>Lagos</option>
                      <option>Abuja</option>
                      <option>Port Harcourt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Sorting Method</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                      <option>By Name</option>
                      <option>By Activity</option>
                      <option>By Performance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Location View</label>
                    <div className="flex gap-3">
                      <button className="flex-1 p-3 border-2 border-emerald-500 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                        Grid View
                      </button>
                      <button className="flex-1 p-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                        List View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Communication Section */}
            {activeSection === 'communication' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Communication Preferences</h2>

                <div className="space-y-4">
                  {[
                    { key: 'voiceNotes', label: 'Allow Voice Notes', desc: 'Receive and send voice messages' },
                    { key: 'attachments', label: 'Allow Attachments', desc: 'Receive files and documents' },
                    { key: 'autoSave', label: 'Auto-save Messages', desc: 'Save draft messages automatically' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Appearance & Interface</h2>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: theme.value as any })}
                          className={`p-4 rounded-xl border-2 transition-colors ${
                            appearanceSettings.theme === theme.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${
                            appearanceSettings.theme === theme.value ? 'text-emerald-600' : 'text-gray-400'
                          }`} />
                          <p className={`text-sm font-medium ${
                            appearanceSettings.theme === theme.value ? 'text-emerald-700' : 'text-gray-700'
                          }`}>{theme.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Font Size</label>
                  <div className="flex gap-2">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setAppearanceSettings({ ...appearanceSettings, fontSize: size as any })}
                        className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                          appearanceSettings.fontSize === size
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className={size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'}>
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dashboard Layout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Dashboard Layout</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAppearanceSettings({ ...appearanceSettings, dashboardLayout: 'compact' })}
                      className={`flex-1 p-4 rounded-xl border-2 transition-colors ${
                        appearanceSettings.dashboardLayout === 'compact'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col gap-1 mb-2">
                        <div className="h-2 bg-gray-300 rounded w-full"></div>
                        <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Compact</p>
                    </button>
                    <button
                      onClick={() => setAppearanceSettings({ ...appearanceSettings, dashboardLayout: 'spacious' })}
                      className={`flex-1 p-4 rounded-xl border-2 transition-colors ${
                        appearanceSettings.dashboardLayout === 'spacious'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col gap-2 mb-2">
                        <div className="h-3 bg-gray-300 rounded w-full"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Spacious</p>
                    </button>
                  </div>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">High Contrast Mode</p>
                    <p className="text-sm text-gray-500">Increase visibility and readability</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearanceSettings.highContrast}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, highContrast: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Activity Log Section */}
            {activeSection === 'activity' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
                <p className="text-sm text-gray-500">Your recent activity on the platform</p>

                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Activity className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{log.action}</p>
                        <p className="text-sm text-gray-500">{log.details}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help & Support Section */}
            {activeSection === 'support' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Help & Support</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: HelpCircle, label: 'FAQs', desc: 'Frequently asked questions' },
                    { icon: FileText, label: 'Video Tutorials', desc: 'Learn how to use the app' },
                    { icon: Mail, label: 'Contact Admin', desc: 'Get help from system admin' },
                    { icon: AlertTriangle, label: 'Report Issue', desc: 'Report a problem or bug' },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-left transition-colors"
                      >
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Icon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-900">Version:</span> Manager Portal v1.0.0
                  </p>
                </div>
              </div>
            )}

            {/* Account Deactivation Section */}
            {activeSection === 'deactivation' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Account Deactivation</h2>
                <p className="text-sm text-gray-500">Submit a request to temporarily suspend or permanently deactivate your account</p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Important Notice</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Account deactivation requests must be approved by the Managing Director. This action cannot be undone immediately.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button className="w-full p-4 border border-amber-200 bg-amber-50 rounded-xl text-left hover:bg-amber-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <div>
                          <h3 className="font-medium text-amber-800">Temporary Suspension</h3>
                          <p className="text-sm text-amber-600">Suspend your account temporarily</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-amber-400" />
                    </div>
                  </button>

                  <button className="w-full p-4 border border-red-200 bg-red-50 rounded-xl text-left hover:bg-red-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <h3 className="font-medium text-red-800">Permanent Deactivation</h3>
                          <p className="text-sm text-red-600">Permanently delete your account</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-red-400" />
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ID Card Full Preview Modal */}
      {showIdCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">ID Card Preview</h3>
              <button
                onClick={() => setShowIdCard(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-gray-100 rounded-xl mb-4">
              <div
                className="w-[340px] h-[215px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700 rounded-xl shadow-2xl overflow-hidden relative transform scale-110"
              >
                {/* Same ID Card Content */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                </div>
                <div className="relative h-full p-4 flex">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-20 h-24 bg-white rounded-lg overflow-hidden shadow-lg">
                      {user?.profilePhoto || user?.passportPhoto ? (
                        <img
                          src={getImageUrl(user.profilePhoto || user.passportPhoto)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 pl-4 flex flex-col justify-between">
                    <div>
                      <p className="text-white/70 text-[10px] uppercase tracking-wider">Javelin Security</p>
                      <h3 className="text-white font-bold text-lg leading-tight">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-emerald-200 text-sm font-medium">Manager</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-[10px]">ID:</span>
                        <span className="text-white text-xs font-mono">{user?.employeeId || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-[10px]">Region:</span>
                        <span className="text-white text-xs">{user?.managers?.regionAssigned || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-[10px]">Joined:</span>
                        <span className="text-white text-xs">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center">
                      <QrCode className="w-9 h-9 text-gray-800" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handlePrintIdCard('cr80')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #id-card-print, #id-card-print * {
            visibility: visible;
          }
          #id-card-print {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}
