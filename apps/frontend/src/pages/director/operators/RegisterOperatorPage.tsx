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
  Printer,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';
import { nigerianStates, nigerianLGAs } from '@/data/nigeriaStatesLGA';
import logoImage from '../../../logo.png';
import QRCode from 'qrcode';

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

interface Beat {
  _id: string;
  beatCode: string;
  beatName: string;
  locationId: string | { _id: string; locationName: string };
  numberOfOperators: number;
}

interface Supervisor {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
  };
}

export default function RegisterOperatorPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [beats, setBits] = useState<Beat[]>([]);
  const [filteredBits, setFilteredBits] = useState<Beat[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [registeredOperator, setRegisteredOperator] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [captureType, setCaptureType] = useState<'applicant' | 'guarantor1' | 'guarantor2' | null>(null);
  const [allowIncomplete, setAllowIncomplete] = useState(false);

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
    beatId: '',
    supervisorId: '',
    shiftType: 'DAY',
    
    // Salary
    salary: '',
    salaryCategory: 'STANDARD',
    
    // First Guarantor
    guarantor1Name: '',
    guarantor1Phone: '',
    guarantor1Address: '',
    guarantor1Photo: '',
    guarantor1IdType: '',
    guarantor1IdNumber: '',
    guarantor1Occupation: '',
    guarantor1Relationship: '',
    
    // Second Guarantor
    guarantor2Name: '',
    guarantor2Phone: '',
    guarantor2Address: '',
    guarantor2Photo: '',
    guarantor2IdType: '',
    guarantor2IdNumber: '',
    guarantor2Occupation: '',
    guarantor2Relationship: '',
    
    // Additional Info
    previousExperience: '',
    medicalFitness: false,
    
    // Documents
    applicantPhoto: '',
    ninNumber: '',
    ninDocument: '',
  });

  const [availableLGAs, setAvailableLGAs] = useState<string[]>([]);

  // Update available LGAs when state changes
  useEffect(() => {
    if (formData.state) {
      setAvailableLGAs(nigerianLGAs[formData.state] || []);
    } else {
      setAvailableLGAs([]);
    }
  }, [formData.state]);

  useEffect(() => {
    if (!registeredOperator?.employeeId) {
      setQrCodeUrl('');
      return;
    }

    let isActive = true;

    const generateQrCode = async () => {
      try {
        const verificationUrl = `${window.location.origin}/verify-operator/${registeredOperator.employeeId}`;
        console.log('Generating QR code for URL:', verificationUrl);
        const dataUrl = await QRCode.toDataURL(verificationUrl, { width: 140, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });
        console.log('QR code generated successfully');
        if (isActive) {
          setQrCodeUrl(dataUrl);
        }
      } catch (error) {
        console.error('Failed to generate verification QR code:', error);
        if (isActive) {
          setQrCodeUrl('');
        }
      }
    };

    generateQrCode();

    return () => {
      isActive = false;
    };
  }, [registeredOperator?.employeeId]);

  useEffect(() => {
    fetchLocations();
    fetchBits();
    fetchSupervisors();
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

  const fetchBits = async () => {
    try {
      const response = await api.get('/beats', {
        params: {
          isActive: 'all',
          limit: 500,
        }
      });
      
      const bitsList = response.data.beats || [];
      console.log('Fetched beats:', bitsList);
      setBits(bitsList);
    } catch (error) {
      console.error('Failed to fetch beats:', error);
      toast.error('Failed to load BEATs');
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/director/supervisors', {
        params: {
          approvalStatus: 'APPROVED',
          limit: 500,
        }
      });
      
      const supervisorsList = response.data.supervisors || [];
      console.log('Fetched supervisors:', supervisorsList);
      setSupervisors(supervisorsList);
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
      toast.error('Failed to load supervisors');
    }
  };

  // Filter beats when location changes
  useEffect(() => {
    if (formData.locationId) {
      const filtered = beats.filter(bit => {
        const bitLocationId = typeof bit.locationId === 'string' 
          ? bit.locationId 
          : bit.locationId._id;
        return bitLocationId === formData.locationId;
      });
      setFilteredBits(filtered);
      
      // Reset beatId if currently selected bit is not in filtered list
      if (formData.beatId && !filtered.find(b => b._id === formData.beatId)) {
        setFormData(prev => ({ ...prev, beatId: '' }));
      }
    } else {
      setFilteredBits([]);
      setFormData(prev => ({ ...prev, beatId: '' }));
    }
  }, [formData.locationId, beats]);

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
        // Only require firstName and lastName - most basic info
        if (!formData.firstName || !formData.lastName) {
          toast.error('First name and last name are required');
          return false;
        }
        // Validate email format only if provided
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        return true;
      case 2:
        // Location and shift type are optional when allowing incomplete
        if (!allowIncomplete && (!formData.locationId || !formData.shiftType)) {
          toast.error('Please select location and shift type (or enable "Allow Incomplete Registration")');
          return false;
        }
        return true;
      case 3:
        // Guarantor info is optional when allowing incomplete
        if (!allowIncomplete && (!formData.guarantor1Name || !formData.guarantor1Phone || !formData.guarantor1Address)) {
          toast.error('Please fill in first guarantor information (or enable "Allow Incomplete Registration")');
          return false;
        }
        if (!allowIncomplete && (!formData.guarantor2Name || !formData.guarantor2Phone || !formData.guarantor2Address)) {
          toast.error('Please fill in second guarantor information (or enable "Allow Incomplete Registration")');
          return false;
        }
        return true;
      case 4:
        // Applicant photo is now optional
        // NIN number is also optional when allowing incomplete
        if (!allowIncomplete && !formData.ninNumber) {
          toast.error('Please provide NIN number (or enable "Allow Incomplete Registration")');
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

    // Guarantor 1 validation (only if not allowing incomplete)
    if (!allowIncomplete && (!formData.guarantor1Name || !formData.guarantor1Phone || !formData.guarantor1Address)) {
      toast.error('Please fill all Guarantor 1 information (Name, Phone, Address) or enable "Allow Incomplete Registration"');
      setCurrentStep(3); // Go to guarantor step
      return;
    }
    
    // Guarantor 2 validation (only if not allowing incomplete)
    if (!allowIncomplete && (!formData.guarantor2Name || !formData.guarantor2Phone || !formData.guarantor2Address)) {
      toast.error('Please fill all Guarantor 2 information (Name, Phone, Address) or enable "Allow Incomplete Registration"');
      setCurrentStep(3); // Go to guarantor step
      return;
    }

    if (!validateStep(4)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data - only include optional fields if they have values
      const submitData: any = {
        ...formData,
        status: 'ACTIVE', // Director can directly activate operators
        allowIncomplete, // Send the allow incomplete flag to backend
      };

      // Only send beatId if it's not empty
      if (!formData.beatId || formData.beatId === '') {
        delete submitData.beatId;
      }

      // Only send supervisorId if it's not empty
      if (!formData.supervisorId || formData.supervisorId === '') {
        delete submitData.supervisorId;
      }

      console.log('Submitting operator registration:', {
        hasBitId: !!submitData.beatId,
        hasLocationId: !!submitData.locationId,
        hasSupervisorId: !!submitData.supervisorId,
        allowIncomplete,
      });

      const response = await api.post('/director/operators/register', submitData);

      // Merge the response data with the submitted form data to ensure all info is available
      const operatorData = {
        ...response.data.operator,
        dateOfBirth: formData.dateOfBirth,
        state: formData.state,
        lga: formData.lga,
        address: formData.address,
        phone: formData.phone,
        fullName: formData.fullName,
        email: formData.email,
      };

      setRegisteredOperator(operatorData);
      setShowSuccess(true);
      
      // Show appropriate success message based on profile completeness
      if (response.data.operator.profileComplete) {
        toast.success('Operator registered successfully with complete profile!');
      } else {
        const missingCount = response.data.operator.missingFields?.length || 0;
        toast.success(
          `Operator registered successfully! ${missingCount} field${missingCount !== 1 ? 's' : ''} incomplete.`,
          { duration: 5000 }
        );
        toast.error(
          `Warning: Missing ${response.data.operator.missingFields?.join(', ')}. Complete profile in "Incomplete Operators" page.`,
          { duration: 8000 }
        );
      }
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

  const printReceipt = () => {
    window.print();
  };

  const downloadReceipt = () => {
    const receiptElement = document.getElementById('registration-receipt');
    if (!receiptElement) return;

    // Use browser print functionality with PDF save option
    window.print();
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Print Button Bar - Hide when printing */}
        <div className="max-w-4xl mx-auto mb-4 print:hidden">
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-lg font-semibold text-gray-900">Registration Successful!</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={printReceipt}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer className="w-5 h-5" />
                Print Receipt
              </button>
              <button
                onClick={() => navigate('/director/personnel/all')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                View All Personnel
              </button>
            </div>
          </div>
        </div>

        {/* Registration Receipt */}
        <div 
          id="registration-receipt"
          className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg"
          style={{
            position: 'relative',
            overflow: 'visible',
            paddingBottom: '40px'
          }}
        >
          {/* Watermark Logo */}
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.05,
              width: '400px',
              height: '400px',
              backgroundImage: `url(${logoImage})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              zIndex: 0,
              pointerEvents: 'none'
            }}
          />

          {/* Receipt Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Header with Logo */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img 
                    src={logoImage} 
                    alt="Company Logo" 
                    className="w-20 h-20 object-contain bg-white rounded-lg p-2"
                  />
                  <div>
                    <h1 className="text-3xl font-bold">JAVELIN SECURITY SYSTEMS</h1>
                    <p className="text-blue-100 text-sm mt-1">Professional Security Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Registration Date</p>
                  <p className="text-lg font-semibold">{new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>
              <div className="border-t border-blue-400 pt-4">
                <h2 className="text-2xl font-bold text-center">OPERATOR REGISTRATION RECEIPT</h2>
                <p className="text-center text-blue-100 mt-2">Official Proof of Registration</p>
              </div>
            </div>

            {/* Operator Information */}
            {registeredOperator && (
              <div className="p-8">
                {/* Operator ID Badge */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 p-4 rounded-lg mb-6 text-center">
                  <p className="text-sm font-medium mb-1">EMPLOYEE ID</p>
                  <p className="text-3xl font-bold tracking-wider">{registeredOperator.employeeId}</p>
                </div>

                {/* Personal Information Section */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">
                    PERSONAL INFORMATION
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Full Name</p>
                      <p className="text-base font-semibold text-gray-900">{registeredOperator.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Email Address</p>
                      <p className="text-base font-semibold text-gray-900">{registeredOperator.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Phone Number</p>
                      <p className="text-base font-semibold text-gray-900">{registeredOperator.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Date of Birth</p>
                      <p className="text-base font-semibold text-gray-900">{registeredOperator.dateOfBirth ? new Date(registeredOperator.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">State</p>
                      <p className="text-base font-semibold text-gray-900">{registeredOperator.state || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">LGA</p>
                      <p className="text-base font-semibold text-gray-900">{registeredOperator.lga || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 font-medium">Home Address</p>
                      <p className="text-base font-semibold text-gray-900">{registeredOperator.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Work Assignment Section */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">
                    WORK ASSIGNMENT
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Assigned Location</p>
                      <p className="text-base font-semibold text-gray-900">{registeredOperator.locationName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Position</p>
                      <p className="text-base font-semibold text-gray-900">Security Operator</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Employment Status</p>
                      <p className="text-base font-semibold text-green-600">{registeredOperator.status || 'ACTIVE'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Registration Date</p>
                      <p className="text-base font-semibold text-gray-900">{new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                </div>

                {/* Credentials Section */}
                <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    LOGIN CREDENTIALS
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-sm text-gray-600 font-medium">Email / Username</p>
                      <p className="text-base font-mono font-bold text-gray-900">{registeredOperator.email}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-sm text-gray-600 font-medium">Temporary Password</p>
                      <p className="text-base font-mono font-bold text-gray-900">{registeredOperator.temporaryPassword}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                      <p className="text-sm text-yellow-800 flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span className="font-medium">Please change your password after first login</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="mb-6 bg-gray-50 border border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">IMPORTANT NOTICE</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>This receipt serves as official proof of registration with Javelin Security Systems.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Keep this document safe for your records and future reference.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Use the provided credentials to access the operator portal and complete your profile.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>A welcome email with detailed instructions has been sent to your registered email address.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Report to your assigned location on your start date with valid identification documents.</span>
                    </li>
                  </ul>
                </div>

                {/* Footer */}
                <div className="border-t-2 border-gray-300 pt-6 px-8 pb-8" style={{ marginTop: '30px' }}>
                  <div className="grid grid-cols-2 gap-12">
                    {/* Left: Signature Section with Stamp */}
                    <div className="relative" style={{ minHeight: '180px' }}>
                      <p className="text-sm text-gray-600 mb-12">Authorized Signature</p>
                      <div className="relative" style={{ width: '250px' }}>
                        <div className="border-t-2 border-gray-400 w-48"></div>
                        <p className="text-sm text-gray-600 mt-2">Director / Authorized Officer</p>
                        
                        {/* Official Stamp - Overlapping signature */}
                        <div
                          className="absolute"
                          style={{
                            right: '-40px',
                            top: '-50px',
                            width: '115px',
                            height: '115px',
                            border: '4px solid #DC2626',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: 'rotate(-12deg)',
                            backgroundColor: 'rgba(220, 38, 38, 0.1)',
                            zIndex: 100,
                          }}
                        >
                          <div style={{ textAlign: 'center', transform: 'rotate(0deg)' }}>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: '700',
                                color: '#DC2626',
                                letterSpacing: '0.8px',
                                lineHeight: '1.3',
                                textTransform: 'uppercase',
                                fontFamily: 'Arial, sans-serif',
                              }}
                            >
                              <div>JAVELIN</div>
                              <div style={{ fontSize: '10px', margin: '3px 0' }}>★ ★ ★</div>
                              <div>ASSOCIATES</div>
                            </div>
                            <div
                              style={{
                                fontSize: '7px',
                                color: '#DC2626',
                                marginTop: '5px',
                                fontWeight: '700',
                                borderTop: '1.5px solid #DC2626',
                                paddingTop: '4px',
                              }}
                            >
                              OFFICIAL STAMP
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Document Info and QR Code */}
                    <div className="flex flex-col gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Document Generated On</p>
                        <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleString('en-GB')}</p>
                        <p className="text-xs text-gray-500 mt-2">Reference: {registeredOperator.employeeId}-{Date.now().toString().slice(-6)}</p>
                      </div>
                      
                      {/* QR Code for Document Verification */}
                      <div className="flex flex-col items-end">
                        <div className="bg-white border-2 border-gray-300 p-2 rounded-lg" style={{ width: '108px', height: '108px' }}>
                          {qrCodeUrl ? (
                            <img
                              src={qrCodeUrl}
                              alt="Verification QR Code"
                              style={{ width: '100%', height: '100%', display: 'block' }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 border-2 border-dashed border-gray-300">
                              Loading QR...
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-2 font-medium">Scan to Verify</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Contact Info */}
                <div className="mt-8 text-center text-sm text-gray-600 border-t border-gray-200 pt-6">
                  <p className="font-semibold text-gray-900 mb-2">JAVELIN SECURITY SYSTEMS</p>
                  <p>Professional Security & Facility Management Services</p>
                  <p className="mt-2">For inquiries: info@javelinsecurity.com | +234 8103323437</p>
                  <p className="text-xs text-gray-500 mt-2">This is an official computer-generated document and does not require a physical signature.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #registration-receipt, #registration-receipt * {
              visibility: visible;
            }
            #registration-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              box-shadow: none;
              border-radius: 0;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
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
                
                {/* Allow Incomplete Registration Option */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowIncomplete}
                      onChange={(e) => setAllowIncomplete(e.target.checked)}
                      className="mt-1 mr-3 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-semibold text-amber-800 mb-1">
                        Allow Incomplete Registration
                      </div>
                      <p className="text-sm text-amber-700">
                        Enable this to register operators with missing information (e.g., no email, no date of birth, missing documents).
                        They can still be assigned to work, but you'll receive notifications about incomplete fields.
                        Only <strong>First Name and Last Name</strong> are required.
                      </p>
                    </div>
                  </label>
                </div>
                
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
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email {!allowIncomplete && <span className="text-red-500">*</span>}
                      {allowIncomplete && <span className="text-gray-500 text-xs">(Optional)</span>}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number {allowIncomplete && <span className="text-gray-500 text-xs">(Optional)</span>}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      State *
                    </label>
                    <select
                      required
                      name="state"
                      value={formData.state}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData({ ...formData, state: e.target.value, lga: '' });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select State</option>
                      {nigerianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LGA *
                    </label>
                    <select
                      required
                      name="lga"
                      value={formData.lga}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.state}
                    >
                      <option value="">Select LGA</option>
                      {availableLGAs.map((lga) => (
                        <option key={lga} value={lga}>
                          {lga}
                        </option>
                      ))}
                    </select>
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
                    Assigned BEAT (Optional)
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                      name="beatId"
                      value={formData.beatId}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.locationId}
                    >
                      <option value="">No specific BEAT (Location only)</option>
                      {filteredBits.map((bit) => (
                        <option key={bit._id} value={bit._id}>
                          {bit.beatName} ({bit.beatCode}) - {bit.numberOfOperators} operator(s) required
                        </option>
                      ))}
                    </select>
                  </div>
                  {!formData.locationId && (
                    <p className="text-xs text-gray-500 mt-1">Select a location first to see available BEATs</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Supervisor (Optional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                      name="supervisorId"
                      value={formData.supervisorId}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No supervisor assigned yet</option>
                      {supervisors.map((supervisor) => (
                        <option key={supervisor._id} value={supervisor._id}>
                          {supervisor.userId.firstName} {supervisor.userId.lastName}
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
                    Monthly Salary (₦) *
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Category *
                  </label>
                  <select
                    name="salaryCategory"
                    value={formData.salaryCategory}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="BASIC">Basic</option>
                  </select>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="md:col-span-2">
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
                        ID Type *
                      </label>
                      <select
                        name="guarantor1IdType"
                        value={formData.guarantor1IdType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select ID Type</option>
                        <option value="National ID">National ID</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="Voter's Card">Voter's Card</option>
                        <option value="International Passport">International Passport</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID Number *
                      </label>
                      <input
                        type="text"
                        name="guarantor1IdNumber"
                        value={formData.guarantor1IdNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occupation *
                      </label>
                      <input
                        type="text"
                        name="guarantor1Occupation"
                        value={formData.guarantor1Occupation}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship with Guard *
                      </label>
                      <select
                        name="guarantor1Relationship"
                        value={formData.guarantor1Relationship}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Relationship</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Friend">Friend</option>
                        <option value="Colleague">Colleague</option>
                        <option value="Relative">Relative</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Photo
                      </label>
                      {formData.guarantor1Photo ? (
                        <div className="relative inline-block">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="md:col-span-2">
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
                        ID Type *
                      </label>
                      <select
                        name="guarantor2IdType"
                        value={formData.guarantor2IdType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select ID Type</option>
                        <option value="National ID">National ID</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="Voter's Card">Voter's Card</option>
                        <option value="International Passport">International Passport</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID Number *
                      </label>
                      <input
                        type="text"
                        name="guarantor2IdNumber"
                        value={formData.guarantor2IdNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occupation *
                      </label>
                      <input
                        type="text"
                        name="guarantor2Occupation"
                        value={formData.guarantor2Occupation}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship with Guard *
                      </label>
                      <select
                        name="guarantor2Relationship"
                        value={formData.guarantor2Relationship}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Relationship</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Friend">Friend</option>
                        <option value="Colleague">Colleague</option>
                        <option value="Relative">Relative</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Photo
                      </label>
                      {formData.guarantor2Photo ? (
                        <div className="relative inline-block">
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
                    Applicant Photo {allowIncomplete && <span className="text-gray-500 text-xs">(Optional)</span>}
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
              <button type="button" onClick={stopCamera} className="text-gray-500 hover:text-gray-700">
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
                type="button"
                onClick={capturePhoto}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Capture Photo
              </button>
              <button
                type="button"
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
