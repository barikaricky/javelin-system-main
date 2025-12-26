import { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Upload,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Shield,
  Clock,
  Home,
  Camera,
  X,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';

// Image compression utility
const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

interface Location {
  id: string;
  name: string;
  address: string;
}

export default function RegisterOperatorPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [registeredOperator, setRegisteredOperator] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [captureType, setCaptureType] = useState<'applicant' | 'guarantor1' | 'guarantor2' | null>(null);

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    state: '',
    lga: '',
    
    // Work Assignment
    locationId: '',
    shiftType: 'DAY',
    
    // First Guarantor
    guarantor1Name: '',
    guarantor1Phone: '',
    guarantor1Address: '',
    guarantor1Photo: '',
    
    // Second Guarantor
    guarantor2Name: '',
    guarantor2Phone: '',
    guarantor2Address: '',
    guarantor2Photo: '',
    
    // Additional Info
    previousExperience: '',
    medicalFitness: false,
    
    // Documents
    applicantPhoto: '',
    ninNumber: '',
    ninDocument: '',
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations', {
        params: {
          isActive: true,
          limit: 100,
        }
      });
      
      const locationsList = response.data.locations || [];
      console.log('Raw locations from API:', locationsList);
      
      const mappedLocations = locationsList.map((loc: any) => ({
        id: loc._id?.toString() || loc.id?.toString() || '',
        name: loc.locationName || loc.name || 'Unknown Location',
        address: loc.address || `${loc.city || ''}, ${loc.state || ''}`,
      }));
      
      console.log('Mapped locations:', mappedLocations);
      setLocations(mappedLocations);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleNINDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please select an image or PDF file');
      return;
    }

    // Check file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Please select a file under 5MB');
      return;
    }

    try {
      // If it's an image, compress it
      if (file.type.startsWith('image/')) {
        const compressedImage = await compressImage(file, 800, 0.7);
        setFormData({ ...formData, ninDocument: compressedImage });
        toast.success('NIN document uploaded and compressed successfully');
      } else {
        // For PDF, convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          setFormData({ ...formData, ninDocument: reader.result as string });
          toast.success('NIN document uploaded successfully');
        };
        reader.onerror = () => {
          toast.error('Failed to read file');
        };
      }
    } catch (error) {
      console.error('Error uploading NIN document:', error);
      toast.error('Failed to process file');
    }
  };

  const startCamera = async (type: 'applicant' | 'guarantor1' | 'guarantor2') => {
    setCaptureType(type);
    setIsCameraActive(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast.error('Failed to access camera');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !captureType) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    const maxWidth = 800;
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    if (width > height) {
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
    } else {
      if (height > maxWidth) {
        width = (width * maxWidth) / height;
        height = maxWidth;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      
      if (captureType === 'applicant') {
        setFormData({ ...formData, applicantPhoto: base64 });
      } else if (captureType === 'guarantor1') {
        setFormData({ ...formData, guarantor1Photo: base64 });
      } else if (captureType === 'guarantor2') {
        setFormData({ ...formData, guarantor2Photo: base64 });
      }
      
      stopCamera();
      toast.success('Photo captured successfully');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
    setCaptureType(null);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'applicant' | 'guarantor1' | 'guarantor2') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file is too large. Please select an image under 5MB');
      return;
    }

    try {
      // Compress image
      const compressedImage = await compressImage(file, 800, 0.7);
      
      // Check compressed size
      const base64Size = (compressedImage.length * 3) / 4 / 1024; // Size in KB
      console.log(`Compressed image size: ${base64Size.toFixed(2)} KB`);

      if (type === 'applicant') {
        setFormData({ ...formData, applicantPhoto: compressedImage });
      } else if (type === 'guarantor1') {
        setFormData({ ...formData, guarantor1Photo: compressedImage });
      } else if (type === 'guarantor2') {
        setFormData({ ...formData, guarantor2Photo: compressedImage });
      }

      toast.success('Photo uploaded and compressed successfully');
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Failed to process image');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
          toast.error('Please fill in all required personal information');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        return true;
      case 2:
        if (!formData.locationId || !formData.shiftType) {
          toast.error('Please select location and shift type');
          return false;
        }
        return true;
      case 3:
        if (!formData.guarantor1Name || !formData.guarantor1Phone || !formData.guarantor1Address) {
          toast.error('Please fill in first guarantor information');
          return false;
        }
        if (!formData.guarantor2Name || !formData.guarantor2Phone || !formData.guarantor2Address) {
          toast.error('Please fill in second guarantor information');
          return false;
        }
        return true;
      case 4:
        if (!formData.applicantPhoto) {
          toast.error('Please provide applicant photo');
          return false;
        }
        if (!formData.ninNumber) {
          toast.error('Please provide NIN number');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/director/operators/register', {
        ...formData,
        status: 'ACTIVE', // Director can directly activate operators
      });

      setRegisteredOperator(response.data.operator);
      setShowSuccess(true);
      toast.success('Operator registered successfully!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to register operator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Work Assignment', icon: Briefcase },
    { number: 3, title: 'Guarantors', icon: Shield },
    { number: 4, title: 'Documents', icon: FileText },
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Operator has been registered successfully. The operator is now active and can start working.
          </p>
          {registeredOperator && (
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-600 mb-2">Registered Operator:</p>
                <p className="font-semibold text-gray-900">
                  {registeredOperator.fullName}
                </p>
                <p className="text-sm text-gray-600">{registeredOperator.email}</p>
                {registeredOperator.phone && (
                  <p className="text-sm text-gray-600">{registeredOperator.phone}</p>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="text-sm font-medium text-blue-900 mb-2">Credentials:</p>
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Employee ID:</span> {registeredOperator.employeeId}
                </p>
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Location:</span> {registeredOperator.locationName}
                </p>
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Password:</span> {registeredOperator.temporaryPassword}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-800 flex items-center gap-2">
                  <span className="text-base">📧</span>
                  <span>Welcome email with credentials has been sent to: <strong>{registeredOperator.email}</strong></span>
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-blue-700">
                  💡 The operator should check their email inbox for login credentials and instructions.
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/director/personnel/all')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View All Personnel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Register New Operator</h1>
          <p className="text-gray-600 mt-2">Fill in the operator information step by step</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      currentStep >= step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs mt-2 font-medium text-center">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LGA
                    </label>
                    <input
                      type="text"
                      name="lga"
                      value={formData.lga}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Work Assignment */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Work Assignment</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Location</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name} - {location.address}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift Type *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                      name="shiftType"
                      value={formData.shiftType}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="DAY">Day Shift (6 AM - 6 PM)</option>
                      <option value="NIGHT">Night Shift (6 PM - 6 AM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Experience
                  </label>
                  <textarea
                    name="previousExperience"
                    value={formData.previousExperience}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe previous security or related work experience..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="medicalFitness"
                    checked={formData.medicalFitness}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Medically fit for security duty
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Guarantors */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Guarantor Information</h2>
                
                {/* First Guarantor */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">First Guarantor *</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="guarantor1Name"
                        value={formData.guarantor1Name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="guarantor1Phone"
                        value={formData.guarantor1Phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="guarantor1Address"
                        value={formData.guarantor1Address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Photo
                      </label>
                      {formData.guarantor1Photo ? (
                        <div className="relative">
                          <img
                            src={formData.guarantor1Photo}
                            alt="Guarantor 1"
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, guarantor1Photo: '' })}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startCamera('guarantor1')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Camera className="w-5 h-5" />
                            Take Photo
                          </button>
                          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                            <Upload className="w-5 h-5" />
                            Upload Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, 'guarantor1')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Second Guarantor */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Second Guarantor *</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="guarantor2Name"
                        value={formData.guarantor2Name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="guarantor2Phone"
                        value={formData.guarantor2Phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="guarantor2Address"
                        value={formData.guarantor2Address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Photo
                      </label>
                      {formData.guarantor2Photo ? (
                        <div className="relative">
                          <img
                            src={formData.guarantor2Photo}
                            alt="Guarantor 2"
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, guarantor2Photo: '' })}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startCamera('guarantor2')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Camera className="w-5 h-5" />
                            Take Photo
                          </button>
                          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                            <Upload className="w-5 h-5" />
                            Upload Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, 'guarantor2')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents & Identification</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Applicant Photo *
                  </label>
                  {formData.applicantPhoto ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.applicantPhoto}
                        alt="Applicant"
                        className="w-48 h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, applicantPhoto: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera('applicant')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Camera className="w-5 h-5" />
                        Take Photo
                      </button>
                      <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                        <Upload className="w-5 h-5" />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, 'applicant')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIN Number *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ninNumber"
                      value={formData.ninNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 11-digit NIN"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIN Document (Optional)
                  </label>
                  {formData.ninDocument ? (
                    <div className="relative inline-block">
                      <div className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center p-4">
                        <FileText className="w-12 h-12 text-gray-400" />
                        <span className="text-xs text-gray-600 ml-2">Document Attached</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ninDocument: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer w-fit">
                      <Upload className="w-5 h-5" />
                      Upload Document
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleNINDocumentUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Upload image or PDF (max 5MB)</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Previous
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-auto flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Operator'}
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Camera Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Capture Photo</h3>
              <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Capture Photo
              </button>
              <button
                onClick={stopCamera}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
