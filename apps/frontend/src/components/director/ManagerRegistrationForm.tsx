import { useState } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useNotificationStore } from '../../stores/notificationStore';
import { api } from '../../lib/api';

interface ManagerRegistrationFormProps {
  onClose: () => void;
  onSuccess: (credentials: { email: string; password: string; employeeId: string; name: string }) => void;
}

interface FormData {
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  nin: string;
  passportPhoto: string;
  declaration: boolean;
}

export default function ManagerRegistrationForm({ onClose, onSuccess }: ManagerRegistrationFormProps) {
  const { addNotification } = useNotificationStore();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    nin: '',
    passportPhoto: '',
    declaration: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);

  const handleImageUpload = async (file: File) => {
    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };

      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setFormData(prev => ({ ...prev, passportPhoto: base64String }));
        
        // Add notification for successful compression
        addNotification({
          type: 'success',
          title: 'Photo Uploaded',
          message: `Image compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
        });
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to compress image. Please try a different photo.',
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      handleImageUpload(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name is required (minimum 3 characters)';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = 'Manager must be at least 18 years old';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.nin.trim()) {
      newErrors.nin = 'National Identity Number (NIN) is required';
    } else if (formData.nin.trim().length < 11) {
      newErrors.nin = 'NIN must be at least 11 characters';
    }

    if (!formData.passportPhoto) {
      newErrors.passportPhoto = 'Passport photo is required';
    }

    if (!formData.declaration) {
      newErrors.declaration = 'You must accept the declaration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/director/supervisors', {
        email: formData.email,
        phone: formData.phone,
        firstName: formData.fullName.split(' ')[0],
        lastName: formData.fullName.split(' ').slice(1).join(' ') || formData.fullName.split(' ')[0],
        fullName: formData.fullName,
        idCard: formData.nin,
        address: '',
        rank: 'Manager',
        dateOfEmployment: new Date().toISOString(),
        passportPhoto: formData.passportPhoto,
        salary: 0,
      });

      const result = response.data;

      // Add success notification
      addNotification({
        type: 'success',
        title: 'Manager Registered Successfully',
        message: `${formData.fullName} has been registered as a manager`,
      });

      // Call success callback with credentials
      onSuccess({
        email: result.user.email,
        password: result.credentials.password,
        employeeId: result.credentials.employeeId,
        name: formData.fullName,
      });
    } catch (error: any) {
      // Add error notification
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message: error.message || 'Failed to register manager. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-dark-900 to-dark-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-bold text-white">Register New Manager</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-primary-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Passport Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passport Photo <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col items-center gap-4">
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-primary-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage('');
                      setFormData(prev => ({ ...prev, passportPhoto: '' }));
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-400 hover:bg-primary-500 text-dark-900 font-medium rounded-lg cursor-pointer transition-colors text-sm sm:text-base">
                  <Upload className="w-4 h-4" />
                  <span className="whitespace-nowrap">{isCompressing ? 'Compressing...' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={isCompressing}
                  />
                </label>
              </div>
            </div>
            {errors.passportPhoto && (
              <p className="text-red-500 text-sm mt-1">{errors.passportPhoto}</p>
            )}
            <p className="text-xs text-gray-500 mt-2 text-center">
              Photo will be automatically compressed to under 2MB
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Phone and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+234 800 000 0000"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* NIN */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              National Identity Number (NIN) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nin}
              onChange={(e) => setFormData(prev => ({ ...prev, nin: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="12345678901"
              maxLength={11}
            />
            {errors.nin && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.nin}</p>
            )}
          </div>

          {/* Declaration */}
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.declaration}
                onChange={(e) => setFormData(prev => ({ ...prev, declaration: e.target.checked }))}
                className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  I hereby declare that all the information provided above is true and accurate to the best of my knowledge. 
                  I understand that any false information may result in the termination of employment.
                </p>
              </div>
            </label>
            {errors.declaration && (
              <p className="text-red-500 text-xs sm:text-sm mt-2">{errors.declaration}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
              <span className="text-base sm:text-lg">ℹ️</span> After Registration
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-blue-800">
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>Manager login credentials will be automatically generated</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>Credentials will be sent to the manager's email address</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>You'll see the credentials on the success page</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>Manager can login immediately with provided credentials</span>
              </li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4 sticky bottom-0 bg-white pb-2 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 font-medium rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 active:scale-95 text-dark-900 font-bold rounded-lg sm:rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></div>
                  <span className="whitespace-nowrap">Registering...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="whitespace-nowrap">Register Manager</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
