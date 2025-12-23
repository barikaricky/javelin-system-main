import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Camera,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { api } from '../../lib/api';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  locationId: string;
  startDate: string;
  profilePhoto: string | null; // base64 string
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  startDate?: string;
  profilePhoto?: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  region?: string;
}

interface RegistrationResult {
  manager: {
    id: string;
    managerId: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    department: string | null;
    profilePhoto: string | null;
  };
  credentials: {
    email: string;
    password: string;
  };
  emailSent: boolean;
}

// Department options
const departments = [
  { id: 'north', name: 'North Division' },
  { id: 'south', name: 'South Division' },
  { id: 'east', name: 'East Division' },
  { id: 'west', name: 'West Division' },
  { id: 'central', name: 'Central Office' },
  { id: 'regional', name: 'Regional Office' },
  { id: 'head', name: 'Head Office' },
  { id: 'operations', name: 'Operations' },
  { id: 'administration', name: 'Administration' },
];

export default function RegisterManagerPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    locationId: '',
    startDate: new Date().toISOString().split('T')[0],
    profilePhoto: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [_locations, setLocations] = useState<Location[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.fullName !== '' ||
      formData.email !== '' ||
      formData.phone !== '' ||
      formData.department !== '' ||
      formData.profilePhoto !== null;
    setHasUnsavedChanges(hasChanges);
  }, [formData]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/managers/locations');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  // Debounced email check
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || !formData.email.includes('@')) {
        setEmailAvailable(null);
        return;
      }

      setEmailChecking(true);
      try {
        const response = await api.get(`/managers/check-email?email=${encodeURIComponent(formData.email)}`);
        setEmailAvailable(response.data.available);
        if (!response.data.available) {
          setErrors((prev) => ({ ...prev, email: 'This email is already registered' }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            if (newErrors.email === 'This email is already registered') {
              delete newErrors.email;
            }
            return newErrors;
          });
        }
      } catch (error) {
        console.error('Email check failed:', error);
      } finally {
        setEmailChecking(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, profilePhoto: 'File size must be under 2MB' }));
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setErrors((prev) => ({ ...prev, profilePhoto: 'Please upload JPG or PNG only' }));
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoPreview(base64String);
      setFormData((prev) => ({ ...prev, profilePhoto: base64String as any }));
      setErrors((prev) => ({ ...prev, profilePhoto: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePhoto: null }));
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    } else if (!/^[a-zA-Z\s\-']+$/.test(formData.fullName)) {
      newErrors.fullName = 'Please enter a valid name (letters only)';
    } else if (formData.fullName.trim().split(/\s+/).length < 2) {
      newErrors.fullName = 'Please enter both first and last name';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (emailAvailable === false) {
      newErrors.email = 'This email is already registered';
    }

    // Phone validation
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (phoneDigits.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    } else if (phoneDigits.length > 15) {
      newErrors.phone = 'Phone number is too long';
    }

    // Start date validation (max 1 year in future)
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      if (startDate > maxDate) {
        newErrors.startDate = 'Start date cannot be more than 1 year in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Send as JSON with base64 image
      const response = await api.post('/managers/register', {
        fullName: formData.fullName.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        department: formData.department || undefined,
        locationId: formData.locationId || undefined,
        startDate: formData.startDate || undefined,
        profilePhoto: formData.profilePhoto || undefined, // base64 string
      });

      setRegistrationResult(response.data);
      setShowSuccess(true);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setSubmitError(
          'The request is taking longer than expected. The manager may still be created in the background. ' +
          'Please check the Workers page in a few moments to verify. If the manager appears there, ' +
          'please contact support to retrieve the login credentials.'
        );
      } else {
        const message = error.response?.data?.message || error.response?.data?.error || 'Failed to register manager';
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Discard changes? Any entered data will be lost.')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const copyPassword = () => {
    if (registrationResult?.credentials.password) {
      navigator.clipboard.writeText(registrationResult.credentials.password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      department: '',
      locationId: '',
      startDate: new Date().toISOString().split('T')[0],
      profilePhoto: null,
    });
    setPhotoPreview(null);
    setErrors({});
    setEmailAvailable(null);
    setShowSuccess(false);
    setRegistrationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Success screen
  if (showSuccess && registrationResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-scale-in">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4 animate-bounce-in">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white">Success!</h1>
              <p className="text-green-100 mt-2">Manager Registered Successfully!</p>
            </div>

            {/* Manager Info */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
                  {registrationResult.manager.profilePhoto ? (
                    <img
                      src={registrationResult.manager.profilePhoto}
                      alt={registrationResult.manager.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{registrationResult.manager.fullName}</h2>
                  <p className="text-sm text-gray-500">Manager ID: {registrationResult.manager.managerId}</p>
                </div>
              </div>
            </div>

            {/* Credentials Section */}
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Login Credentials</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Email / Username</label>
                  <p className="text-sm font-mono bg-white px-3 py-2 rounded-lg border border-gray-200">
                    {registrationResult.credentials.email}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-medium">Password</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm overflow-hidden">
                      {showPassword ? registrationResult.credentials.password : '••••••••••••••••••••'}
                    </div>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={copyPassword}
                      className={`p-2 rounded-lg transition-all ${
                        passwordCopied
                          ? 'bg-green-100 text-green-600'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Copy password"
                    >
                      {passwordCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="p-6 border-b border-gray-100">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-700">Account created and activated</span>
                </div>
                <div className="flex items-center gap-3">
                  {registrationResult.emailSent ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700">Credentials sent to email</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-gray-700">Email delivery pending - share credentials manually</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-700">Manager can login immediately</span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="p-6 bg-yellow-50 border-b border-yellow-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Important:</p>
                  <p className="text-sm text-yellow-700">
                    Manager must change password on first login for security.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 space-y-3">
              <button
                onClick={() => navigate(`/director/personnel/managers/${registrationResult.manager.id}`)}
                className="w-full py-3 px-4 border-2 border-blue-500 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <User className="w-5 h-5" />
                View Manager Profile
              </button>

              <button
                onClick={resetForm}
                className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-semibold rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Register Another Manager
              </button>

              <button
                onClick={() => navigate('/director/personnel/all')}
                className="w-full py-3 px-4 border border-gray-300 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                Go to Personnel List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm animate-fade-in">
          <button onClick={() => navigate('/director')} className="text-gray-500 hover:text-blue-600 transition-colors">
            Home
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => navigate('/director/personnel')}
            className="text-gray-500 hover:text-blue-600 transition-colors"
          >
            Personnel Management
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">Register Manager</span>
        </nav>

        {/* Page Header */}
        <div className="mb-6 animate-fade-in-down">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Register New Manager</h1>
          </div>
          <p className="text-gray-600 text-sm ml-13">
            Create a new manager account. Login credentials will be automatically generated and sent via email.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Profile Photo Section */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Profile Photo
                <span className="text-gray-400 font-normal">(Optional)</span>
              </h2>

              <div className="flex flex-col items-center">
                {/* Photo Preview */}
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden mb-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* Upload/Remove Buttons */}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="profilePhoto"
                  />
                  <label
                    htmlFor="profilePhoto"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Upload Photo
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">Max size: 2MB • Accepted: JPG, PNG</p>
                {errors.profilePhoto && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.profilePhoto}
                  </p>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter manager's full name"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none ${
                      errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="manager@company.com"
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl text-base transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none ${
                      errors.email
                        ? 'border-red-300 bg-red-50'
                        : emailAvailable === true
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  {emailChecking && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                  )}
                  {!emailChecking && emailAvailable === true && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                  {!emailChecking && emailAvailable === false && (
                    <X className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+234 (XXX) XXX-XXXX"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none ${
                      errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Department/Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department/Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none bg-white hover:border-gray-300"
                  >
                    <option value="">Select department or location</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Location helps in organizing personnel and attendance tracking
                </p>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employment Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none ${
                      errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.startDate}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  When will this manager officially start? Leave blank if starting immediately
                </p>
              </div>

              {/* Manager ID (Auto-generated) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Manager ID
                  <span className="text-gray-400 font-normal ml-1">(Auto-generated)</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    readOnly
                    placeholder="Will be generated after registration"
                    className="w-full pl-12 pr-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-base bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Password Generation Info */}
            <div className="mx-6 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800 text-sm">Login Credentials</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    A secure password will be automatically generated with:
                  </p>
                  <ul className="text-sm text-blue-600 mt-2 space-y-1">
                    <li>• Prefix: "javelin"</li>
                    <li>• Unique Manager ID</li>
                    <li>• Random characters</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-2 font-mono bg-blue-100 px-2 py-1 rounded inline-block">
                    Example: javelin_MGR00123_Xy9Pq2Rt
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    Credentials will be sent to the manager's email address.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Error Display */}
            {submitError && (
              <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">Registration Failed</p>
                    <p className="text-red-600 text-sm mt-1">{submitError}</p>
                    
                    {/* Show button to check Workers page if it's a timeout */}
                    {(submitError.includes('timeout') || submitError.includes('taking longer')) && (
                      <button
                        onClick={() => navigate('/director/personnel')}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Check Workers Page
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4 sticky bottom-0">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()}
                className={`px-6 py-3 font-semibold rounded-xl transition-all flex items-center gap-2 shadow-md ${
                  isSubmitting || !formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600 hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Register Manager
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
