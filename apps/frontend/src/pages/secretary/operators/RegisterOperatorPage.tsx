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
  _id: string;
  locationName: string;
  address: string;
}

interface Bit {
  _id: string;
  bitCode: string;
  bitName: string;
  locationId: string | { _id: string; locationName: string };
  numberOfOperators: number;
}

interface Supervisor {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
  };
  fullName?: string;
  supervisorType: string;
}

export default function RegisterOperatorPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [bits, setBits] = useState<Bit[]>([]);
  const [filteredBits, setFilteredBits] = useState<Bit[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
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
    dateOfBirth: '',
    gender: 'MALE',
    state: '', // State of residence
    lga: '', // LGA of residence
    address: '', // Full address
    
    // Employment Details
    locationId: '',
    bitId: '',
    supervisorId: '',
    
    // Bank Details
    bankName: '',
    bankAccountNumber: '',
    salary: '',
    salaryCategory: 'STANDARD',
    
    // Documents & Photos
    applicantPhoto: '',
    passportPhoto: '',
    leftThumb: '',
    rightThumb: '',
    
    // Guarantor 1
    guarantor1Name: '',
    guarantor1Phone: '',
    guarantor1Address: '',
    guarantor1Photo: '',
    
    // Guarantor 2
    guarantor2Name: '',
    guarantor2Phone: '',
    guarantor2Address: '',
    guarantor2Photo: '',
    
    // Additional
    previousExperience: '',
    medicalFitness: false,
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

  useEffect(() => {
    fetchLocations();
    fetchBits();
    fetchSupervisors();
  }, []);

  useEffect(() => {
    if (formData.locationId) {
      const filtered = bits.filter(bit => {
        const locationId = typeof bit.locationId === 'string' 
          ? bit.locationId 
          : bit.locationId._id;
        return locationId === formData.locationId;
      });
      setFilteredBits(filtered);
    } else {
      setFilteredBits(bits);
    }
  }, [formData.locationId, bits]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations?limit=500&isActive=true');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const fetchBits = async () => {
    try {
      const response = await api.get('/bits?limit=500');
      setBits(response.data.bits || []);
    } catch (error) {
      console.error('Failed to fetch bits:', error);
      toast.error('Failed to load BITs');
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/managers/supervisors');
      setSupervisors(response.data.supervisors || []);
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
      toast.error('Failed to load supervisors');
    }
  };

  const startCamera = async (type: 'applicant' | 'guarantor1' | 'guarantor2') => {
    setCaptureType(type);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Failed to access camera');
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && captureType) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        if (captureType === 'applicant') {
          setFormData(prev => ({ ...prev, applicantPhoto: dataUrl }));
        } else if (captureType === 'guarantor1') {
          setFormData(prev => ({ ...prev, guarantor1Photo: dataUrl }));
        } else if (captureType === 'guarantor2') {
          setFormData(prev => ({ ...prev, guarantor2Photo: dataUrl }));
        }
        
        stopCamera();
        toast.success('Photo captured successfully');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      setCaptureType(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'applicant' | 'guarantor1' | 'guarantor2') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        if (type === 'applicant') {
          setFormData(prev => ({ ...prev, applicantPhoto: compressed }));
        } else if (type === 'guarantor1') {
          setFormData(prev => ({ ...prev, guarantor1Photo: compressed }));
        } else if (type === 'guarantor2') {
          setFormData(prev => ({ ...prev, guarantor2Photo: compressed }));
        }
        toast.success('Photo uploaded successfully');
      } catch (error) {
        toast.error('Failed to process image');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.applicantPhoto) {
      toast.error('Please upload or capture applicant photo');
      return;
    }
    
    // Guarantor 1 validation
    if (!formData.guarantor1Name || !formData.guarantor1Phone || !formData.guarantor1Address) {
      toast.error('Please fill all Guarantor 1 information (Name, Phone, Address)');
      setCurrentStep(4); // Go to guarantor step
      return;
    }
    
    // Guarantor 2 validation
    if (!formData.guarantor2Name || !formData.guarantor2Phone || !formData.guarantor2Address) {
      toast.error('Please fill all Guarantor 2 information (Name, Phone, Address)');
      setCurrentStep(4); // Go to guarantor step
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await api.post('/secretaries/register-operator', {
        ...formData,
      });
      
      console.log('Registration response:', response.data);
      
      // Merge the response data with the submitted form data to ensure all info is available
      const operatorData = {
        ...response.data.operator,
        dateOfBirth: formData.dateOfBirth,
        state: formData.state,
        lga: formData.lga,
        address: formData.address,
        phone: formData.phone,
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        locationName: response.data.operator?.locationName || locations.find(l => l._id === formData.locationId)?.locationName || 'N/A',
        temporaryPassword: response.data.credentials?.temporaryPassword || 'Check your email',
      };
      
      console.log('Operator data for receipt:', operatorData);
      
      setRegisteredOperator(operatorData);
      setShowSuccess(true);
      toast.success('Operator registered successfully!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to register operator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const printReceipt = () => {
    window.print();
  };

  const downloadReceipt = () => {
    const receiptElement = document.getElementById('registration-receipt');
    if (!receiptElement) return;
    window.print();
  };

  if (showSuccess) {
    console.log('✅ Rendering receipt - showSuccess is true');
    console.log('📄 Receipt data:', registeredOperator);
    
    return (
      <div className="min-h-screen bg-gray-50 p-4" key="secretary-receipt-v2">
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
                onClick={() => navigate('/secretary/operators')}
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
                        <p className="text-sm text-gray-600 mt-2">Secretary / Authorized Officer</p>
                        
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/secretary/operators')}
            className="mb-4 inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Operators
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register New Operator</h1>
          <p className="text-gray-600">Complete the form to register a new security operator</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step}
                  </div>
                  <span className="text-xs mt-2 text-gray-600">
                    {step === 1 && 'Personal'}
                    {step === 2 && 'Employment'}
                    {step === 3 && 'Photos'}
                    {step === 4 && 'Guarantors'}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Camera Modal */}
        {isCameraActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Capture {captureType === 'applicant' ? 'Applicant' : captureType === 'guarantor1' ? 'Guarantor 1' : 'Guarantor 2'} Photo
                </h3>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg mb-4"
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-6 h-6 mr-3 text-blue-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address *
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter full residential address"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value, lga: '' })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select State</option>
                      {nigerianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LGA *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      required
                      value={formData.lga}
                      onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>
          )}

          {/* Step 2: Employment & Bank Details */}
          {currentStep === 2 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Briefcase className="w-6 h-6 mr-3 text-blue-600" />
                Employment & Bank Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      required
                      value={formData.locationId}
                      onChange={(e) => setFormData({ ...formData, locationId: e.target.value, bitId: '' })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Location</option>
                      {locations.map((loc) => (
                        <option key={loc._id} value={loc._id}>
                          {loc.locationName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    BIT *
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      required
                      value={formData.bitId}
                      onChange={(e) => setFormData({ ...formData, bitId: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.locationId}
                    >
                      <option value="">Select BIT</option>
                      {filteredBits.map((bit) => (
                        <option key={bit._id} value={bit._id}>
                          {bit.bitName} ({bit.bitCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor *
                  </label>
                  <select
                    required
                    value={formData.supervisorId}
                    onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Supervisor</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor._id} value={supervisor._id}>
                        {supervisor.fullName || `${supervisor.userId?.firstName} ${supervisor.userId?.lastName}`} 
                        {' '}({supervisor.supervisorType})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="First Bank of Nigeria"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0123456789"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Salary (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Category *
                  </label>
                  <select
                    required
                    value={formData.salaryCategory}
                    onChange={(e) => setFormData({ ...formData, salaryCategory: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="BASIC">Basic</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {currentStep === 3 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Camera className="w-6 h-6 mr-3 text-blue-600" />
                Capture Photos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Applicant Photo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <h3 className="font-semibold text-gray-900 mb-4">Applicant Photo *</h3>
                  {formData.applicantPhoto ? (
                    <div className="relative">
                      <img
                        src={formData.applicantPhoto}
                        alt="Applicant"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, applicantPhoto: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <button
                        type="button"
                        onClick={() => startCamera('applicant')}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture
                      </button>
                      <label className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 flex items-center justify-center cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'applicant')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Guarantor 1 Photo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <h3 className="font-semibold text-gray-900 mb-4">Guarantor 1 Photo</h3>
                  {formData.guarantor1Photo ? (
                    <div className="relative">
                      <img
                        src={formData.guarantor1Photo}
                        alt="Guarantor 1"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, guarantor1Photo: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <button
                        type="button"
                        onClick={() => startCamera('guarantor1')}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture
                      </button>
                      <label className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 flex items-center justify-center cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'guarantor1')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Guarantor 2 Photo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <h3 className="font-semibold text-gray-900 mb-4">Guarantor 2 Photo</h3>
                  {formData.guarantor2Photo ? (
                    <div className="relative">
                      <img
                        src={formData.guarantor2Photo}
                        alt="Guarantor 2"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, guarantor2Photo: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <button
                        type="button"
                        onClick={() => startCamera('guarantor2')}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture
                      </button>
                      <label className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 flex items-center justify-center cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'guarantor2')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Guarantors */}
          {currentStep === 4 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-blue-600" />
                Guarantor Information
              </h2>
              <div className="space-y-8">
                {/* Guarantor 1 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Guarantor 1 *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.guarantor1Name}
                        onChange={(e) => setFormData({ ...formData, guarantor1Name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.guarantor1Phone}
                        onChange={(e) => setFormData({ ...formData, guarantor1Phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.guarantor1Address}
                        onChange={(e) => setFormData({ ...formData, guarantor1Address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Full address"
                      />
                    </div>
                  </div>
                </div>

                {/* Guarantor 2 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Guarantor 2 *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.guarantor2Name}
                        onChange={(e) => setFormData({ ...formData, guarantor2Name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.guarantor2Phone}
                        onChange={(e) => setFormData({ ...formData, guarantor2Phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.guarantor2Address}
                        onChange={(e) => setFormData({ ...formData, guarantor2Address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Full address"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="bg-gray-50 px-8 py-4 flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </button>
            )}
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Register Operator
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
