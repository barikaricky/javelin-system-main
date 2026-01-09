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

// Nigerian Banks
const NIGERIAN_BANKS = [
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Bank',
  'Jaiz Bank',
  'Keystone Bank',
  'Opay (OPay)',
  'PalmPay',
  'Parallex Bank',
  'Polaris Bank',
  'Providus Bank',
  'Signature Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'SunTrust Bank',
  'TAJBank',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank',
  'Carbon (Formerly PAGA)',
  'Kuda Bank',
  'Moniepoint',
  'Rubies Bank',
  'VFD Microfinance Bank',
].sort();

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
  const [qrCodeUrl, setQrCodeUrl] = useState('');
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

  // Generate QR code when operator is registered
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

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations', {
        params: {
          isActive: true,
          limit: 100, // Get all active locations
        }
      });
      
      // Handle pagination response from MongoDB
      const locationsList = response.data.locations || [];
      console.log('Raw locations from API:', locationsList);
      
      const mappedLocations = locationsList.map((loc: any) => ({
        id: loc._id?.toString() || loc.id?.toString() || '',
        name: loc.locationName || loc.name || 'Unknown Location',
        address: loc.address || `${loc.city || ''}, ${loc.state || ''}`,
      }));
      
      setLocations(mappedLocations);
      console.log('Locations loaded:', mappedLocations.length, mappedLocations);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      toast.error(error.response?.data?.message || 'Failed to load locations');
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Work Assignment', icon: Briefcase },
    { number: 3, title: 'Guarantors', icon: Shield },
    { number: 4, title: 'Documents', icon: FileText },
  ];

  // Image conversion to base64 with compression
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

          // Calculate new dimensions while maintaining aspect ratio
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
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file upload with compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      let base64: string;
      
      if (file.type.startsWith('image/')) {
        // Compress images
        base64 = await compressImage(file, 800, 0.7);
        toast.success('Image compressed and uploaded successfully');
      } else if (file.type === 'application/pdf') {
        // For PDFs, just convert to base64 (already compact)
        base64 = await convertToBase64(file);
        toast.success('PDF uploaded successfully');
      } else {
        toast.error('Only images and PDF files are allowed');
        return;
      }
      
      setFormData({ ...formData, [field]: base64 });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    }
  };

  // Start camera
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

  // Capture photo from camera with compression
  const capturePhoto = () => {
    if (!videoRef.current || !captureType) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    // Set canvas size (compress to max 800px)
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
      // Compress to 70% quality
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      
      if (captureType === 'applicant') {
        setFormData({ ...formData, applicantPhoto: base64 });
      } else if (captureType === 'guarantor1') {
        setFormData({ ...formData, guarantor1Photo: base64 });
      } else if (captureType === 'guarantor2') {
        setFormData({ ...formData, guarantor2Photo: base64 });
      }
      
      stopCamera();
      toast.success('Photo captured and compressed successfully');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
    setCaptureType(null);
  };

  // Cleanup camera on unmount
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
          toast.error('Please provide first guarantor information');
          return false;
        }
        if (!formData.guarantor1Photo) {
          toast.error('Please upload first guarantor photo');
          return false;
        }
        if (!formData.guarantor2Name || !formData.guarantor2Phone || !formData.guarantor2Address) {
          toast.error('Please provide second guarantor information');
          return false;
        }
        if (!formData.guarantor2Photo) {
          toast.error('Please upload second guarantor photo');
          return false;
        }
        return true;
      case 4:
        if (!formData.applicantPhoto) {
          toast.error('Please capture applicant photo');
          return false;
        }
        if (!formData.ninNumber || !formData.ninDocument) {
          toast.error('Please provide NIN number and document');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // Prepare data to match backend API
      const submitData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        state: formData.state || undefined,
        lga: formData.lga || undefined,
        locationId: formData.locationId,
        shiftType: formData.shiftType,
        
        // Use first guarantor data (backend expects single guarantor)
        guarantorName: formData.guarantor1Name,
        guarantorPhone: formData.guarantor1Phone,
        guarantorAddress: formData.guarantor1Address,
        
        // Documents - combine all photos into documents array
        passportPhoto: formData.applicantPhoto,
        nationalId: formData.ninNumber,
        documents: [
          formData.guarantor1Photo,
          formData.guarantor2Photo,
          formData.ninDocument,
        ].filter(Boolean), // Remove empty values
        
        previousExperience: formData.previousExperience || undefined,
        medicalFitness: formData.medicalFitness,
      };

      console.log('Submitting operator registration:', { 
        email: submitData.email,
        hasPassportPhoto: !!submitData.passportPhoto,
        documentsCount: submitData.documents.length 
      });

      const response = await api.post('/operators/register', submitData);
      
      console.log('Registration response:', response.data);
      
      // Merge the response data with the submitted form data to ensure all info is available
      const operatorData = {
        ...response.data.operator,
        dateOfBirth: formData.dateOfBirth,
        state: formData.state || 'N/A',
        lga: formData.lga || 'N/A',
        address: formData.address,
        phone: formData.phone,
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        locationName: locations.find(l => l.id === formData.locationId)?.name || 'N/A',
        temporaryPassword: response.data.credentials?.temporaryPassword || 'Sent via email',
      };
      
      console.log('Operator data for receipt:', operatorData);
      
      setRegisteredOperator(operatorData);
      setShowSuccess(true);
      toast.success('Operator registration submitted successfully!');
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response:', JSON.stringify(error.response, null, 2));
      console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error response status:', error.response?.status);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to register operator';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const downloadReceipt = () => {
    const receiptElement = document.getElementById('registration-receipt');
    if (!receiptElement) return;
    window.print();
  };

  if (showSuccess && registeredOperator) {
    console.log('✅ Rendering receipt - showSuccess is true');
    console.log('📄 Receipt data:', registeredOperator);
    
    return (
      <div className="min-h-screen bg-gray-50 p-4" key="supervisor-receipt-v2">
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
                onClick={() => navigate('/supervisor/operators')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                View All Operators
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
                      <p className="text-base font-semibold text-green-600">{registeredOperator.status || 'PENDING'}</p>
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
                      <p className="text-base font-mono font-bold text-gray-900">{registeredOperator.temporaryPassword || 'Sent via email'}</p>
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
                        <p className="text-sm text-gray-600 mt-2">Supervisor / Authorized Officer</p>
                        
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Register Operator</h1>
          <p className="text-gray-600 mt-2">
            Submit operator registration for Manager approval
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep >= step.number
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle size={20} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <span className="text-xs font-medium mt-2 text-gray-600">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-colors ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="text-green-600" size={24} />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Enter full address"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value, lga: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">LGA (Local Government Area)</label>
                  <select
                    value={formData.lga}
                    onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={!formData.state}
                  >
                    <option value="">Select LGA</option>
                    {formData.state && nigerianLGAs[formData.state]?.map((lga) => (
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
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="text-green-600" size={24} />
                Work Assignment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location / Beat *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={formData.locationId}
                      onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} - {loc.address}
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
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={formData.shiftType}
                      onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="DAY">Day Shift</option>
                      <option value="NIGHT">Night Shift</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Guard Experience
                  </label>
                  <textarea
                    value={formData.previousExperience}
                    onChange={(e) => setFormData({ ...formData, previousExperience: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Describe previous security experience (optional)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.medicalFitness}
                      onChange={(e) => setFormData({ ...formData, medicalFitness: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">
                      Medically fit for security duties
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Guarantors Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="text-green-600" size={24} />
                Guarantors Information
              </h2>
              
              {/* First Guarantor */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">First Guarantor *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.guarantor1Name}
                      onChange={(e) => setFormData({ ...formData, guarantor1Name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        value={formData.guarantor1Phone}
                        onChange={(e) => setFormData({ ...formData, guarantor1Phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      value={formData.guarantor1Address}
                      onChange={(e) => setFormData({ ...formData, guarantor1Address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guarantor Photo *
                    </label>
                    {formData.guarantor1Photo ? (
                      <div className="relative inline-block">
                        <img
                          src={formData.guarantor1Photo}
                          alt="Guarantor 1"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-green-500"
                        />
                        <button
                          onClick={() => setFormData({ ...formData, guarantor1Photo: '' })}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startCamera('guarantor1')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Camera size={18} />
                          Capture Photo
                        </button>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                          <Upload size={18} />
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'guarantor1Photo')}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Second Guarantor */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Second Guarantor *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.guarantor2Name}
                      onChange={(e) => setFormData({ ...formData, guarantor2Name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        value={formData.guarantor2Phone}
                        onChange={(e) => setFormData({ ...formData, guarantor2Phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      value={formData.guarantor2Address}
                      onChange={(e) => setFormData({ ...formData, guarantor2Address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guarantor Photo *
                    </label>
                    {formData.guarantor2Photo ? (
                      <div className="relative inline-block">
                        <img
                          src={formData.guarantor2Photo}
                          alt="Guarantor 2"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-green-500"
                        />
                        <button
                          onClick={() => setFormData({ ...formData, guarantor2Photo: '' })}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startCamera('guarantor2')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Camera size={18} />
                          Capture Photo
                        </button>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                          <Upload size={18} />
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'guarantor2Photo')}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Two guarantors are required for all operator registrations.
                  Both guarantors will be contacted for verification purposes.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="text-green-600" size={24} />
                Documents & Applicant Photo
              </h2>
              
              {/* Applicant Photo */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Applicant Photo *</h3>
                <p className="text-sm text-gray-600">
                  Capture or upload a clear passport-style photograph of the applicant
                </p>
                {formData.applicantPhoto ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.applicantPhoto}
                      alt="Applicant"
                      className="w-48 h-48 object-cover rounded-lg border-2 border-green-500"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, applicantPhoto: '' })}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startCamera('applicant')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Camera size={20} />
                      Capture Photo
                    </button>
                    <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                      <Upload size={20} />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'applicantPhoto')}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* NIN Information */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">National Identification Number (NIN) *</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIN Number *
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.ninNumber}
                        onChange={(e) => setFormData({ ...formData, ninNumber: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter 11-digit NIN"
                        maxLength={11}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIN Document (Photo/Scan) *
                    </label>
                    {formData.ninDocument ? (
                      <div className="relative inline-block">
                        <img
                          src={formData.ninDocument}
                          alt="NIN Document"
                          className="w-64 h-40 object-cover rounded-lg border-2 border-green-500"
                        />
                        <button
                          onClick={() => setFormData({ ...formData, ninDocument: '' })}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                        <Upload size={20} />
                        Upload NIN Document
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'ninDocument')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> All documents will be securely stored in the database.
                  Ensure all photos are clear and readable for faster approval.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={20} />
              Previous
            </button>
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Next
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                <CheckCircle size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Capture Photo</h3>
              <button
                onClick={stopCamera}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={capturePhoto}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
              >
                <Camera size={20} />
                Capture
              </button>
              <button
                onClick={stopCamera}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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