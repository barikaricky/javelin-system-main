import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  DollarSign,
  CreditCard,
  Shield,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Upload,
  FileText,
  Copy,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supervisorService, SupervisorCredentials } from '../../services/supervisorService';

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

// Regions
const REGIONS = [
  'Port Harcourt East',
  'Port Harcourt West',
  'Port Harcourt Central',
  'Aba Axis',
  'Owerri Zone',
  'Uyo Region',
  'Calabar Zone',
  'Warri Axis',
  'Benin Zone',
];

// Visit Frequencies
const VISIT_FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'TWICE_WEEKLY', label: 'Twice Weekly' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
];

// Report Types
const REPORT_TYPES = [
  { value: 'SUPERVISOR_REPORTS', label: 'Supervisor Reports' },
  { value: 'LOCATION_REPORTS', label: 'Location Reports' },
  { value: 'BOTH', label: 'Both' },
];

// Escalation Rights
const ESCALATION_RIGHTS = [
  { value: 'MANAGER_ONLY', label: 'Manager Only' },
  { value: 'MD_DIRECT', label: 'Direct to MD' },
  { value: 'BOTH', label: 'Both Manager and MD' },
];

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
  
  // Supervisor Type
  supervisorType: 'GENERAL_SUPERVISOR' | 'SUPERVISOR';
  
  // Employment Details
  startDate: string;
  
  // Salary Details
  salaryCategory: string;
  salary: string;
  allowance: string;
  bankName: string;
  bankAccountNumber: string;
  
  // General Supervisor Fields
  regionAssigned: string;
  subordinateSupervisorIds: string[];
  expectedVisitFrequency: string;
  reportSubmissionType: string;
  escalationRights: string;
  
  // Supervisor Fields
  locationId: string;
  locationsAssigned: string[];
  bitsAssigned: string[];
  generalSupervisorId: string;
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
  supervisorType: 'SUPERVISOR',
  startDate: new Date().toISOString().split('T')[0],
  salaryCategory: '',
  salary: '',
  allowance: '',
  bankName: '',
  bankAccountNumber: '',
  regionAssigned: '',
  subordinateSupervisorIds: [],
  expectedVisitFrequency: '',
  reportSubmissionType: '',
  escalationRights: '',
  locationId: '',
  locationsAssigned: [],
  bitsAssigned: [],
  generalSupervisorId: '',
  visitSchedule: '',
  shiftType: '',
  isMotorbikeOwner: false,
  transportAllowanceEligible: false,
};

export default function RegisterSupervisorPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  // Force supervisor type to GENERAL_SUPERVISOR - Managers can only register General Supervisors
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    supervisorType: 'GENERAL_SUPERVISOR', // Fixed: Managers can only register General Supervisors
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<SupervisorCredentials | null>(null);
  const [availableSupervisors, setAvailableSupervisors] = useState<any[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Manager only registers General Supervisors - 5 steps (no supervisor type selection step)
  const totalSteps = 5;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const allSupervisorsData = await supervisorService.getAll({ supervisorType: 'SUPERVISOR' });
      setAvailableSupervisors(allSupervisorsData.filter(s => !s.generalSupervisorId));
    } catch (error) {
      console.error('Error loading initial data:', error);
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

  const handleSupervisorToggle = (supervisorId: string) => {
    setFormData(prev => {
      const current = prev.subordinateSupervisorIds;
      if (current.includes(supervisorId)) {
        return { ...prev, subordinateSupervisorIds: current.filter(id => id !== supervisorId) };
      } else {
        return { ...prev, subordinateSupervisorIds: [...current, supervisorId] };
      }
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Details
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone && formData.gender && formData.dateOfBirth);
      case 2: // Address & Origin
        return !!(formData.address && formData.state && formData.lga);
      case 3: // Employment Details (was step 4)
        return !!formData.startDate;
      case 4: // Salary Details (was step 5)
        return !!(formData.salary && formData.salaryCategory && formData.bankName && formData.bankAccountNumber);
      case 5: // General Supervisor Setup (was step 6)
        return !!(formData.regionAssigned && formData.expectedVisitFrequency);
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
      const submitData: any = {
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
        supervisorType: formData.supervisorType,
        startDate: formData.startDate,
        salary: parseFloat(formData.salary),
        salaryCategory: formData.salaryCategory,
        allowance: formData.allowance ? parseFloat(formData.allowance) : undefined,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
      };

      if (formData.supervisorType === 'GENERAL_SUPERVISOR') {
        submitData.regionAssigned = formData.regionAssigned;
        submitData.subordinateSupervisorIds = formData.subordinateSupervisorIds;
        submitData.expectedVisitFrequency = formData.expectedVisitFrequency;
        submitData.reportSubmissionType = formData.reportSubmissionType;
        submitData.escalationRights = formData.escalationRights;
      } else {
        submitData.locationId = formData.locationId || undefined;
        submitData.locationsAssigned = formData.locationsAssigned;
        submitData.bitsAssigned = formData.bitsAssigned;
        submitData.generalSupervisorId = formData.generalSupervisorId || undefined;
        submitData.visitSchedule = formData.visitSchedule;
        submitData.shiftType = formData.shiftType;
        submitData.isMotorbikeOwner = formData.isMotorbikeOwner;
        submitData.transportAllowanceEligible = formData.transportAllowanceEligible;
      }

      const result = await supervisorService.register(submitData);
      setCredentials(result.credentials);
      setShowCredentials(true);
      toast.success('Supervisor registered successfully!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Failed to register supervisor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getStepTitle = (step: number): string => {
    const titles = [
      'Personal Details',
      'Address & Origin',
      'Employment Details',
      'Salary Details',
      'General Supervisor Setup',
    ];
    return titles[step - 1] || '';
  };

  // Pending Approval Modal - credentials will be received after Director approval
  if (showCredentials && credentials) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Registration Submitted!</h2>
            <p className="text-gray-600 mt-2">
              {formData.supervisorType === 'GENERAL_SUPERVISOR' ? 'General Supervisor' : 'Supervisor'} registration is pending Director approval.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Awaiting Director Approval</p>
                <p className="text-xs text-amber-700 mt-1">
                  You will receive a notification with the login credentials once the Director approves this registration.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Employee ID</label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-semibold text-gray-900">{credentials.employeeId}</span>
                <button
                  onClick={() => copyToClipboard(credentials.employeeId, 'Employee ID')}
                  className="p-2 text-gray-500 hover:text-emerald-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium text-gray-900">{credentials.email}</span>
                <button
                  onClick={() => copyToClipboard(credentials.email, 'Email')}
                  className="p-2 text-gray-500 hover:text-emerald-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-gray-100 rounded-xl p-4">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Approval Status</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Pending Approval
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">What Happens Next?</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• Director will review the registration</li>
                    <li>• Upon approval, you'll receive login credentials</li>
                    <li>• Share the credentials securely with the supervisor</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setShowCredentials(false);
                setCredentials(null);
                setFormData(initialFormData);
                setCurrentStep(1);
                setPhotoPreview(null);
              }}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Register Another
            </button>
            <button
              onClick={() => navigate('/manager/supervisors')}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register General Supervisor</h1>
          <p className="text-gray-600 mt-1">Add a new General Supervisor to manage supervisors and regions</p>
        </div>
        <button
          onClick={() => navigate('/manager/supervisors')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to List
        </button>
      </div>

      {/* Info Banner about Registration Flow */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Registration Approval Flow</p>
            <p className="text-xs text-blue-700 mt-1">
              General Supervisors you register will be submitted for Director approval. Once approved, login credentials will be generated and you'll receive a notification.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step < currentStep
                    ? 'bg-emerald-500 text-white'
                    : step === currentStep
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step < currentStep ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < totalSteps && (
                <div
                  className={`w-full h-1 mx-2 rounded ${
                    step < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                  style={{ minWidth: '40px' }}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
        </p>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            </div>

            {/* Photo Upload */}
            <div className="flex items-start gap-6 pb-6 border-b border-gray-100">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Passport Photograph</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
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

        {/* Step 3: Employment Details (previously step 4) */}
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
                    Employee ID, Username, and Temporary Password will be automatically generated after registration.
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
                  value="Active"
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Salary Details (previously step 5) */}
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
                    Salary details will be view-only for Manager after registration. Only Director can modify.
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

        {/* Step 5: General Supervisor Setup (previously step 6) */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">General Supervisor Setup</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region Assigned *</label>
                <select
                  name="regionAssigned"
                  value={formData.regionAssigned}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select region</option>
                  {REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Visit Frequency *</label>
                <select
                  name="expectedVisitFrequency"
                  value={formData.expectedVisitFrequency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select frequency</option>
                  {VISIT_FREQUENCIES.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Submission Type</label>
                <select
                  name="reportSubmissionType"
                  value={formData.reportSubmissionType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select type</option>
                  {REPORT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Escalation Rights</label>
                <select
                  name="escalationRights"
                  value={formData.escalationRights}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select rights</option>
                  {ESCALATION_RIGHTS.map(right => (
                    <option key={right.value} value={right.value}>{right.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subordinate Supervisors Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Supervisors (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select supervisors to manage under this General Supervisor. You can also assign later.
              </p>
              <div className="border border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                {availableSupervisors.length > 0 ? (
                  <div className="space-y-2">
                    {availableSupervisors.map(sup => (
                      <label
                        key={sup.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.subordinateSupervisorIds.includes(sup.id)}
                          onChange={() => handleSupervisorToggle(sup.id)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {sup.users.firstName} {sup.users.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{sup.employeeId}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No unassigned supervisors available</p>
                )}
              </div>
              {formData.subordinateSupervisorIds.length > 0 && (
                <p className="text-sm text-emerald-600 mt-2">
                  {formData.subordinateSupervisorIds.length} supervisor(s) selected
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register General Supervisor
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
