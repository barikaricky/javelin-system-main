import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, User, AlertTriangle, CheckCircle, Printer, Camera, Upload, Shield } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import logoImage from '../../../logo.jpeg';

interface OperatorData {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    state?: string;
    lga?: string;
    profilePhoto?: string;
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    isProfileComplete: boolean;
    missingFields: string[];
  };
  employeeId: string;
  locationId?: any;
  guarantors?: Array<{
    name?: string;
    phone?: string;
    address?: string;
    photo?: string;
    idType?: string;
    idNumber?: string;
    occupation?: string;
    relationship?: string;
  }>;
}

export default function EditOperatorPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [operator, setOperator] = useState<OperatorData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [captureType, setCaptureType] = useState<'applicant' | 'guarantor1' | 'guarantor2' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    state: '',
    lga: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    profilePhoto: '',
    // Guarantor 1
    guarantor1Name: '',
    guarantor1Phone: '',
    guarantor1Address: '',
    guarantor1Photo: '',
    guarantor1IdType: '',
    guarantor1IdNumber: '',
    guarantor1Occupation: '',
    guarantor1Relationship: '',
    // Guarantor 2
    guarantor2Name: '',
    guarantor2Phone: '',
    guarantor2Address: '',
    guarantor2Photo: '',
    guarantor2IdType: '',
    guarantor2IdNumber: '',
    guarantor2Occupation: '',
    guarantor2Relationship: '',
  });

  useEffect(() => {
    fetchOperatorData();
  }, [userId]);

  const fetchOperatorData = async () => {
    try {
      setLoading(true);
      // Fetch operator by userId
      const response = await api.get(`/director/operators`);
      const allOperators = response.data.operators || [];
      const foundOperator = allOperators.find((op: any) => op.userId._id === userId);
      
      if (!foundOperator) {
        toast.error('Operator not found');
        navigate('/director/operators/incomplete');
        return;
      }

      setOperator(foundOperator);
      
      // Pre-fill form with existing data
      const user = foundOperator.userId;
      const guarantors = foundOperator.guarantors || [];
      const guarantor1 = guarantors[0] || {};
      const guarantor2 = guarantors[1] || {};
      
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        address: user.address || '',
        state: user.state || '',
        lga: user.lga || '',
        accountName: user.accountName || '',
        accountNumber: user.accountNumber || '',
        bankName: user.bankName || '',
        profilePhoto: user.profilePhoto || '',
        // Guarantor 1
        guarantor1Name: guarantor1.name || '',
        guarantor1Phone: guarantor1.phone || '',
        guarantor1Address: guarantor1.address || '',
        guarantor1Photo: guarantor1.photo || '',
        guarantor1IdType: guarantor1.idType || '',
        guarantor1IdNumber: guarantor1.idNumber || '',
        guarantor1Occupation: guarantor1.occupation || '',
        guarantor1Relationship: guarantor1.relationship || '',
        // Guarantor 2
        guarantor2Name: guarantor2.name || '',
        guarantor2Phone: guarantor2.phone || '',
        guarantor2Address: guarantor2.address || '',
        guarantor2Photo: guarantor2.photo || '',
        guarantor2IdType: guarantor2.idType || '',
        guarantor2IdNumber: guarantor2.idNumber || '',
        guarantor2Occupation: guarantor2.occupation || '',
        guarantor2Relationship: guarantor2.relationship || '',
      });
    } catch (error: any) {
      console.error('Error fetching operator:', error);
      toast.error('Failed to load operator data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
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
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'applicant' | 'guarantor1' | 'guarantor2') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Please select a file under 5MB');
      return;
    }

    try {
      const compressedImage = await compressImage(file, 800, 0.7);
      if (type === 'applicant') {
        setFormData(prev => ({ ...prev, profilePhoto: compressedImage }));
      } else if (type === 'guarantor1') {
        setFormData(prev => ({ ...prev, guarantor1Photo: compressedImage }));
      } else if (type === 'guarantor2') {
        setFormData(prev => ({ ...prev, guarantor2Photo: compressedImage }));
      }
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to process photo');
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

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCaptureType(null);
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
        setFormData(prev => ({ ...prev, profilePhoto: base64 }));
      } else if (captureType === 'guarantor1') {
        setFormData(prev => ({ ...prev, guarantor1Photo: base64 }));
      } else if (captureType === 'guarantor2') {
        setFormData(prev => ({ ...prev, guarantor2Photo: base64 }));
      }
      
      toast.success('Photo captured successfully');
      stopCamera();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('First name, last name, and email are required');
      return;
    }

    try {
      setSaving(true);
      
      // Update operator profile
      const response = await api.put(`/director/operators/${operator?._id}`, formData);
      
      // Refresh operator data to get updated completeness status
      await fetchOperatorData();
      
      toast.success('Operator profile updated successfully!');
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error updating operator:', error);
      toast.error(error.response?.data?.message || 'Failed to update operator profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading operator data...</p>
        </div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Operator Not Found</h2>
          <button
            onClick={() => navigate('/director/operators/incomplete')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Incomplete Operators
          </button>
        </div>
      </div>
    );
  }

  const missingFields = operator.userId.missingFields || [];

  // Show success receipt after saving
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Print Button Bar - Hide when printing */}
        <div className="max-w-4xl mx-auto mb-4 print:hidden">
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-lg font-semibold text-gray-900">Profile Updated Successfully!</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer className="w-5 h-5" />
                Print Receipt
              </button>
              <button
                onClick={() => navigate('/director/operators/incomplete')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Incomplete Operators
              </button>
            </div>
          </div>
        </div>

        {/* Update Receipt */}
        <div 
          id="update-receipt"
          className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg"
          style={{ position: 'relative', overflow: 'visible', paddingBottom: '40px' }}
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
                  <p className="text-sm text-blue-100">Update Date</p>
                  <p className="text-xl font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="bg-blue-700 bg-opacity-50 rounded-lg p-4">
                <h2 className="text-2xl font-bold mb-1">PROFILE UPDATE CONFIRMATION</h2>
                <p className="text-blue-100">Operator Profile Successfully Updated</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8">
              {/* Status Badge */}
              <div className="mb-6 text-center">
                {operator.userId.isProfileComplete ? (
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold text-lg">Profile Complete</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-6 py-3 rounded-full">
                    <AlertTriangle className="w-6 h-6" />
                    <span className="font-semibold text-lg">Profile Incomplete - {operator.userId.missingFields.length} Fields Remaining</span>
                  </div>
                )}
              </div>

              {/* Operator Details */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="font-semibold text-lg">{operator.userId.firstName} {operator.userId.lastName}</p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-500 mb-1">Employee ID</p>
                    <p className="font-semibold">{operator.employeeId}</p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                    <p className="font-semibold">{operator.userId.email || 'N/A'}</p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                    <p className="font-semibold">{operator.userId.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
                    <p className="font-semibold">{operator.userId.dateOfBirth ? new Date(operator.userId.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-500 mb-1">Gender</p>
                    <p className="font-semibold">{operator.userId.gender || 'N/A'}</p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <p className="font-semibold">{operator.userId.address || 'N/A'}</p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-500 mb-1">State / LGA</p>
                    <p className="font-semibold">{operator.userId.state || 'N/A'} / {operator.userId.lga || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Bank Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Account Name</p>
                    <p className="font-semibold">{operator.userId.accountName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Account Number</p>
                    <p className="font-semibold">{operator.userId.accountNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                    <p className="font-semibold">{operator.userId.bankName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Guarantors */}
              {operator.guarantors && operator.guarantors.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold text-lg mb-4 text-gray-900">Guarantor Information</h3>
                  <div className="space-y-6">
                    {operator.guarantors.map((guarantor, index) => (
                      <div key={index} className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Guarantor {index + 1}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{guarantor.name || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{guarantor.phone || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Address:</span> <span className="font-medium">{guarantor.address || 'N/A'}</span></div>
                          <div><span className="text-gray-500">ID Type:</span> <span className="font-medium">{guarantor.idType || 'N/A'}</span></div>
                          <div><span className="text-gray-500">ID Number:</span> <span className="font-medium">{guarantor.idNumber || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Occupation:</span> <span className="font-medium">{guarantor.occupation || 'N/A'}</span></div>
                          <div className="col-span-2"><span className="text-gray-500">Relationship:</span> <span className="font-medium">{guarantor.relationship || 'N/A'}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-6 mt-8">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <p>This is an automated receipt from Javelin Security Systems</p>
                  <p>Generated on: {new Date().toLocaleString()}</p>
                </div>
                <div className="mt-4 text-center text-xs text-gray-500">
                  <p>For inquiries, please contact our HR department</p>
                  <p className="mt-1">© {new Date().getFullYear()} Javelin Security Systems. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete Operator Profile</h1>
              <p className="text-gray-600">
                {operator.userId.firstName} {operator.userId.lastName} ({operator.employeeId})
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/director/operators/incomplete')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Missing Fields Warning */}
        {missingFields.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-amber-800 font-semibold mb-1">
                  {missingFields.length} field{missingFields.length !== 1 ? 's' : ''} missing
                </h3>
                <p className="text-amber-700 text-sm">
                  Please complete the highlighted fields to activate this operator's profile.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Personal Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('phone') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Phone Number {missingFields.includes('phone') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('phone') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('dateOfBirth') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Date of Birth {missingFields.includes('dateOfBirth') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('dateOfBirth') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('gender') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Gender {missingFields.includes('gender') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('gender') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Profile Photo Upload */}
          <div className="mt-6">
            <label className={`block text-sm font-medium mb-2 ${missingFields.includes('profilePhoto') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
              Profile Photo {missingFields.includes('profilePhoto') && <span className="text-amber-600">(Missing)</span>}
            </label>
            <div className="flex items-center gap-4">
              {formData.profilePhoto && (
                <img 
                  src={formData.profilePhoto} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-200"
                />
              )}
              <div className="flex gap-2">
                <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'applicant')}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => startCamera('applicant')}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Modal */}
        {isCameraActive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <h3 className="text-lg font-semibold mb-4">Capture Photo</h3>
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Capture
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('address') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Address {missingFields.includes('address') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('address') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${missingFields.includes('state') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                  State {missingFields.includes('state') && <span className="text-amber-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    missingFields.includes('state') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${missingFields.includes('lga') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                  LGA {missingFields.includes('lga') && <span className="text-amber-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  name="lga"
                  value={formData.lga}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    missingFields.includes('lga') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('accountName') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Account Name {missingFields.includes('accountName') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('accountName') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('accountNumber') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Account Number {missingFields.includes('accountNumber') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('accountNumber') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('bankName') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Bank Name {missingFields.includes('bankName') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('bankName') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Guarantor 1 Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guarantor 1 Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor1_name') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Name {missingFields.includes('guarantor1_name') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="text"
                name="guarantor1Name"
                value={formData.guarantor1Name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor1_name') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor1_phone') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Phone Number {missingFields.includes('guarantor1_phone') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="tel"
                name="guarantor1Phone"
                value={formData.guarantor1Phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor1_phone') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor1_address') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Address {missingFields.includes('guarantor1_address') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <textarea
                name="guarantor1Address"
                value={formData.guarantor1Address}
                onChange={handleChange}
                rows={2}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor1_address') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor1_idType') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                ID Type {missingFields.includes('guarantor1_idType') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <select
                name="guarantor1IdType"
                value={formData.guarantor1IdType}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor1_idType') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select ID Type</option>
                <option value="National ID">National ID</option>
                <option value="Driver's License">Driver's License</option>
                <option value="Voter's Card">Voter's Card</option>
                <option value="Passport">Passport</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor1_idNumber') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                ID Number {missingFields.includes('guarantor1_idNumber') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="text"
                name="guarantor1IdNumber"
                value={formData.guarantor1IdNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor1_idNumber') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor1_occupation') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Occupation {missingFields.includes('guarantor1_occupation') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="text"
                name="guarantor1Occupation"
                value={formData.guarantor1Occupation}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor1_occupation') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor1_relationship') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Relationship with Guard {missingFields.includes('guarantor1_relationship') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <select
                name="guarantor1Relationship"
                value={formData.guarantor1Relationship}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor1_relationship') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
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

            {/* Guarantor 1 Photo Upload */}
            <div className="md:col-span-2 mt-4">
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor1_photo') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Photo {missingFields.includes('guarantor1_photo') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <div className="flex items-center gap-4">
                {formData.guarantor1Photo && (
                  <img 
                    src={formData.guarantor1Photo} 
                    alt="Guarantor 1" 
                    className="w-20 h-20 rounded-lg object-cover border-2 border-blue-200"
                  />
                )}
                <div className="flex gap-2">
                  <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'guarantor1')}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => startCamera('guarantor1')}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantor 2 Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guarantor 2 Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor2_name') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Name {missingFields.includes('guarantor2_name') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="text"
                name="guarantor2Name"
                value={formData.guarantor2Name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor2_name') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor2_phone') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Phone Number {missingFields.includes('guarantor2_phone') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="tel"
                name="guarantor2Phone"
                value={formData.guarantor2Phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor2_phone') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor2_address') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Address {missingFields.includes('guarantor2_address') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <textarea
                name="guarantor2Address"
                value={formData.guarantor2Address}
                onChange={handleChange}
                rows={2}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor2_address') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor2_idType') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                ID Type {missingFields.includes('guarantor2_idType') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <select
                name="guarantor2IdType"
                value={formData.guarantor2IdType}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor2_idType') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select ID Type</option>
                <option value="National ID">National ID</option>
                <option value="Driver's License">Driver's License</option>
                <option value="Voter's Card">Voter's Card</option>
                <option value="Passport">Passport</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor2_idNumber') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                ID Number {missingFields.includes('guarantor2_idNumber') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="text"
                name="guarantor2IdNumber"
                value={formData.guarantor2IdNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor2_idNumber') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor2_occupation') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Occupation {missingFields.includes('guarantor2_occupation') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <input
                type="text"
                name="guarantor2Occupation"
                value={formData.guarantor2Occupation}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor2_occupation') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor2_relationship') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Relationship with Guard {missingFields.includes('guarantor2_relationship') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <select
                name="guarantor2Relationship"
                value={formData.guarantor2Relationship}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  missingFields.includes('guarantor2_relationship') ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
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

            {/* Guarantor 2 Photo Upload */}
            <div className="md:col-span-2 mt-4">
              <label className={`block text-sm font-medium mb-2 ${missingFields.includes('guarantor2_photo') ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                Photo {missingFields.includes('guarantor2_photo') && <span className="text-amber-600">(Missing)</span>}
              </label>
              <div className="flex items-center gap-4">
                {formData.guarantor2Photo && (
                  <img 
                    src={formData.guarantor2Photo} 
                    alt="Guarantor 2" 
                    className="w-20 h-20 rounded-lg object-cover border-2 border-blue-200"
                  />
                )}
                <div className="flex gap-2">
                  <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'guarantor2')}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => startCamera('guarantor2')}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/director/operators/incomplete')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
