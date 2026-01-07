import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  DollarSign,
  CreditCard,
  Shield,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Upload,
  Bike,
  FileText,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

// Nigerian States
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

// Nigerian Banks
const NIGERIAN_BANKS = [
  'Access Bank', 'Citibank', 'Ecobank', 'Fidelity Bank', 'First Bank',
  'First City Monument Bank (FCMB)', 'Globus Bank', 'Guaranty Trust Bank (GTBank)',
  'Heritage Bank', 'Keystone Bank', 'Kuda Bank', 'Opay', 'Palmpay',
  'Polaris Bank', 'Providus Bank', 'Stanbic IBTC Bank', 'Standard Chartered Bank',
  'Sterling Bank', 'SunTrust Bank', 'Titan Trust Bank', 'Union Bank',
  'United Bank for Africa (UBA)', 'Unity Bank', 'Wema Bank', 'Zenith Bank'
];

// Salary Categories
const SALARY_CATEGORIES = [
  { value: 'LEVEL_1', label: 'Level 1 - Entry' },
  { value: 'LEVEL_2', label: 'Level 2 - Junior' },
  { value: 'LEVEL_3', label: 'Level 3 - Mid-Level' },
  { value: 'LEVEL_4', label: 'Level 4 - Senior' },
  { value: 'LEVEL_5', label: 'Level 5 - Lead' },
];

// Shift Types
const SHIFT_TYPES = [
  { value: 'DAY', label: 'Day Supervisor' },
  { value: 'NIGHT', label: 'Night Supervisor' },
  { value: 'ROTATING', label: 'Rotating Shift' },
];

interface Location {
  id: string;
  name: string;
  address?: string;
  region?: string;
}

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  state: string;
  lga: string;
  nationalId: string;
  passportPhoto: string;
  
  // Employment Details
  startDate: string;
  
  // Salary Details
  salaryCategory: string;
  salary: string;
  allowance: string;
  bankName: string;
  bankAccountNumber: string;
  
  // Supervisor Fields
  locationId: string;
  locationsAssigned: string[];
  bitsAssigned: string[];
  visitSchedule: string;
  shiftType: string;
  isMotorbikeOwner: boolean;
  transportAllowanceEligible: boolean;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  state: '',
  lga: '',
  nationalId: '',
  passportPhoto: '',
  startDate: new Date().toISOString().split('T')[0],
  salaryCategory: '',
  salary: '',
  allowance: '',
  bankName: '',
  bankAccountNumber: '',
  locationId: '',
  locationsAssigned: [],
  bitsAssigned: [],
  visitSchedule: '',
  shiftType: '',
  isMotorbikeOwner: false,
  transportAllowanceEligible: false,
};

export default function GSRegisterSupervisorPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredSupervisor, setRegisteredSupervisor] = useState<any>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // 5 steps for supervisor registration
  const totalSteps = 5;

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await api.get('/supervisors/locations');
      const locationsData = response.data.locations || response.data || [];
      
      // Map backend format (_id, locationName) to frontend format (id, name)
      const mappedLocations = locationsData.map((loc: any) => ({
        id: loc._id,
        name: loc.locationName,
        address: loc.address,
        region: loc.region,
      }));
      
      setLocations(mappedLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, passportPhoto: base64 }));
        setPhotoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationToggle = (locationId: string) => {
    setFormData(prev => {
      const current = prev.locationsAssigned;
      if (current.includes(locationId)) {
        return { ...prev, locationsAssigned: current.filter(id => id !== locationId) };
      } else {
        return { ...prev, locationsAssigned: [...current, locationId] };
      }
    });
  };

  const handleSupervisedLocationToggle = (locationId: string) => {
    setFormData(prev => {
      const current = prev.bitsAssigned;
      if (current.includes(locationId)) {
        return { ...prev, bitsAssigned: current.filter(id => id !== locationId) };
      } else {
        return { ...prev, bitsAssigned: [...current, locationId] };
      }
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Details
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone && formData.gender && formData.dateOfBirth);
      case 2: // Address & Origin
        return !!(formData.address && formData.state && formData.lga);
      case 3: // Employment Details
        return !!formData.startDate;
      case 4: // Salary Details
        return !!(formData.salary && formData.salaryCategory && formData.bankName && formData.bankAccountNumber);
      case 5: // Supervisor Assignment
        return !!(formData.visitSchedule && formData.shiftType);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        state: formData.state,
        lga: formData.lga,
        nationalId: formData.nationalId || undefined,
        passportPhoto: formData.passportPhoto || undefined,
        supervisorType: 'SUPERVISOR', // Always SUPERVISOR when GS registers
        startDate: formData.startDate,
        salary: parseFloat(formData.salary),
        salaryCategory: formData.salaryCategory,
        allowance: formData.allowance ? parseFloat(formData.allowance) : undefined,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        locationId: formData.locationId || undefined,
        locationsAssigned: formData.locationsAssigned,
        bitsAssigned: formData.bitsAssigned,
        visitSchedule: formData.visitSchedule,
        shiftType: formData.shiftType,
        isMotorbikeOwner: formData.isMotorbikeOwner,
        transportAllowanceEligible: formData.transportAllowanceEligible,
      };

      // Call the GS-specific registration endpoint
      const response = await api.post('/supervisors/register-supervisor', submitData);
      setRegisteredSupervisor(response.data.supervisor);
      setShowSuccess(true);
      toast.success('Supervisor registration submitted successfully!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to register supervisor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = (step: number): string => {
    const titles = [
      'Personal Details',
      'Address & Origin',
      'Employment Details',
      'Salary Details',
      'Supervisor Assignment',
    ];
    return titles[step - 1] || '';
  };

  // Success Modal - Awaiting Manager Approval
  if (showSuccess && registeredSupervisor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Registration Submitted!</h2>
            <p className="text-gray-600 mt-2">
              Supervisor registration is pending Manager approval.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Awaiting Manager Approval</p>
                <p className="text-xs text-amber-700 mt-1">
                  You will receive a notification with the login credentials once the Manager approves this registration.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Supervisor Name</label>
              <p className="font-semibold text-gray-900 mt-1">{registeredSupervisor.fullName}</p>
            </div>

            <div className="bg-gray-100 rounded-xl p-4">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Approval Status</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Pending Manager Approval
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">What Happens Next?</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• Manager will review the registration</li>
                    <li>• Upon approval, login credentials will be generated</li>
                    <li>• You'll receive a notification with the credentials</li>
                    <li>• The supervisor will be assigned under your management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setShowSuccess(false);
                setRegisteredSupervisor(null);
                setFormData(initialFormData);
                setCurrentStep(1);
                setPhotoPreview(null);
              }}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Register Another
            </button>
            <button
              onClick={() => navigate('/general-supervisor/supervisors')}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              View Supervisors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Register Supervisor</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Add a new supervisor to your team</p>
        </div>
        <button
          onClick={() => navigate('/general-supervisor/supervisors')}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back to List
        </button>
      </div>

      {/* Info Banner about Registration Flow */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm font-medium text-blue-800">Registration Approval Flow</p>
            <p className="text-xs text-blue-700 mt-1">
              Supervisors you register will be submitted for Manager approval. Once approved, login credentials will be generated and you'll receive a notification. The supervisor will be automatically assigned under your management.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 border border-gray-200">
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-max">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-colors ${
                    step < currentStep
                      ? 'bg-emerald-500 text-white'
                      : step === currentStep
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step < currentStep ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`w-full h-1 mx-1 sm:mx-2 rounded ${
                      step < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                    style={{ minWidth: '30px' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">
          Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
        </p>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6">
        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Personal Information</h2>
            </div>

            {/* Photo Upload */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-gray-100">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg sm:rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Passport Photograph</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                <p className="text-xs text-gray-500 mt-2">Upload a clear passport photograph (JPG, PNG, max 5MB)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="08012345678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">National ID / NIN (Optional)</label>
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter NIN (11 digits)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Address & Origin */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Address & Origin</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Home Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State of Origin *</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Local Government (LGA) *</label>
                <input
                  type="text"
                  name="lga"
                  value={formData.lga}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter LGA"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Employment Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Employment Details</h2>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Auto-Generated Credentials</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Employee ID, Username, and Temporary Password will be automatically generated after Manager approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
                <input
                  type="text"
                  value="Active (After Approval)"
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Salary Details */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Salary Details</h2>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">View-Only After Registration</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Salary details will be view-only after registration. Only Manager or Director can modify.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Category *</label>
                <select
                  name="salaryCategory"
                  value={formData.salaryCategory}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select category</option>
                  {SALARY_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Amount (₦) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowance (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    name="allowance"
                    value={formData.allowance}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                <select
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select bank</option>
                  {NIGERIAN_BANKS.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number *</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleInputChange}
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="10-digit account number"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Supervisor Assignment */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Supervisor Assignment</h2>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Auto-Assignment</p>
                  <p className="text-xs text-green-700 mt-1">
                    This supervisor will be automatically assigned to you as their General Supervisor.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Location</label>
                <select
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select primary location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visit Schedule *</label>
                <select
                  name="visitSchedule"
                  value={formData.visitSchedule}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select schedule</option>
                  <option value="DAILY">Daily</option>
                  <option value="ALTERNATE">Alternate Days</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type *</label>
                <select
                  name="shiftType"
                  value={formData.shiftType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select shift</option>
                  {SHIFT_TYPES.map(shift => (
                    <option key={shift.value} value={shift.value}>{shift.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Locations Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Locations (Optional)</label>
              <div className="border border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {locations.map(loc => (
                    <label
                      key={loc.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.locationsAssigned.includes(loc.id)}
                        onChange={() => handleLocationToggle(loc.id)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{loc.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Supervised Locations Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supervised Locations (Select all locations this supervisor will oversee)</label>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Select all locations where this supervisor will manage guards and operations. They will receive updates and reports from these locations.
                  </p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                {locations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No locations available</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {locations.map(loc => (
                      <label
                        key={loc.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.bitsAssigned.includes(loc.id)}
                          onChange={() => handleSupervisedLocationToggle(loc.id)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 block">{loc.name}</span>
                          {loc.address && (
                            <span className="text-xs text-gray-500 block mt-0.5">{loc.address}</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formData.bitsAssigned.length > 0 && (
                <p className="text-sm text-emerald-600 mt-2">
                  ✓ {formData.bitsAssigned.length} location(s) selected for supervision
                </p>
              )}
            </div>

            {/* Transportation */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <Bike className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Transportation Information</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isMotorbikeOwner"
                    checked={formData.isMotorbikeOwner}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Motorbike Owner</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="transportAllowanceEligible"
                    checked={formData.transportAllowanceEligible}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Eligible for Transport Allowance</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-emerald-600 text-white rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-colors order-1 sm:order-2"
            >
              Next
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-emerald-600 text-white rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register Supervisor
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
