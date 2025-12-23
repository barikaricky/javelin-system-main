import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { Shield, Lock, AlertTriangle, CheckCircle, Copy } from 'lucide-react';

const onboardingSchema = z.object({
  developerToken: z.string().min(1, 'Developer token is required'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface DirectorCredentials {
  user: {
    id: string;
    email: string;
    role: string;
    employeeId: string;
  };
  temporaryPassword: string;
}

export default function DevOnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<DirectorCredentials | null>(null);
  const [showToken, setShowToken] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    try {
      console.log('📤 Submitting director registration:', data);
      const response = await authService.createDirector(data);
      console.log('✅ Director registration response:', response);
      setCredentials(response);
      toast.success('Director account created successfully!');
    } catch (error: any) {
      console.error('❌ Director registration error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create director account';
      toast.error(errorMessage);
      
      // Show specific error messages
      if (errorMessage.includes('already exists')) {
        toast.error('A director account already exists in the system', { duration: 5000 });
      } else if (errorMessage.includes('Invalid developer token')) {
        toast.error('Invalid developer token. Please check your credentials.', { duration: 5000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Show success screen if credentials exist
  if (credentials && credentials.user) {
    const employeeId = credentials.user.employeeId;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-3 sm:p-4">
        <div className="card w-full max-w-2xl border-2 border-secondary-500 mx-auto">
          <div className="text-center mb-4 sm:mb-6">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-secondary-500 mx-auto mb-3 sm:mb-4 animate-pulse" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Director Account Created!
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Save these credentials securely. They will only be shown once.
            </p>
          </div>
          
          <div className="bg-primary-50 border-2 border-primary-300 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded border border-primary-300 min-h-[60px] touch-manipulation">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs text-gray-500 mb-1">Username (Employee ID)</p>
                <p className="text-base sm:text-lg font-mono font-bold text-dark-800 break-all">
                  {employeeId}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(employeeId, 'Username')}
                className="p-3 sm:p-2 hover:bg-primary-100 rounded-lg transition-colors touch-manipulation flex-shrink-0"
              >
                <Copy className="w-6 h-6 sm:w-5 sm:h-5 text-dark-600" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded border border-primary-300 min-h-[60px] touch-manipulation">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs text-gray-500 mb-1">Password</p>
                <p className="text-base sm:text-lg font-mono font-bold text-dark-800 break-all">
                  {credentials.temporaryPassword}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(credentials.temporaryPassword, 'Password')}
                className="p-3 sm:p-2 hover:bg-primary-100 rounded-lg transition-colors touch-manipulation flex-shrink-0"
              >
                <Copy className="w-6 h-6 sm:w-5 sm:h-5 text-dark-600" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded border border-primary-300 min-h-[60px] touch-manipulation">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-base sm:text-lg font-mono font-bold text-dark-800 break-all">
                  {credentials.user.email}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(credentials.user.email, 'Email')}
                className="p-3 sm:p-2 hover:bg-primary-100 rounded-lg transition-colors touch-manipulation flex-shrink-0"
              >
                <Copy className="w-6 h-6 sm:w-5 sm:h-5 text-dark-600" />
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Important Security Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>These credentials will only be shown once</li>
                <li>Use the Employee ID as the username for login</li>
                <li>Director must change password on first login</li>
                <li>Store these credentials in a secure location</li>
                <li>Do not share the developer token with anyone</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-4">
            <a 
              href="/login" 
              className="btn-primary flex-1 text-center"
            >
              Go to Login Page
            </a>
            <button
              onClick={() => {
                setCredentials(null);
                window.location.reload();
              }}
              className="btn-secondary"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show the onboarding form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-3 sm:p-4">
      <div className="card w-full max-w-xl border border-primary-500 shadow-2xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500" />
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-secondary-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Developer Onboarding
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
            Initialize the Director Account
          </p>
          <div className="bg-primary-50 border border-primary-300 rounded-lg p-3 inline-block">
            <p className="text-sm text-primary-800 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Restricted Access - Developer Only
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-2">Before you proceed:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>This page creates the first Director account</li>
                <li>Only one Director account can exist</li>
                <li>Requires a valid developer token</li>
                <li>Credentials will be auto-generated and sent via email</li>
                <li>This page should be removed in production</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label flex items-center gap-2">
              <Lock className="w-4 h-4 text-dark-600" />
              Developer Token (Required)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                {...register('developerToken')}
                className="input-field pr-20"
                placeholder="Enter secure developer token"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary-600 hover:text-primary-700"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.developerToken && (
              <p className="text-red-500 text-sm mt-1">{errors.developerToken.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Default token: <code className="bg-gray-100 px-2 py-0.5 rounded">DEV-JAVELIN-2025-SECURE-TOKEN</code>
            </p>
            <p className="text-xs text-gray-500">
              This token is set in your backend .env file as DEVELOPER_ONBOARDING_TOKEN
            </p>
          </div>

          <div className="border-t pt-5">
            <h3 className="font-semibold text-gray-900 mb-4">Director Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  {...register('email')}
                  className="input-field"
                  placeholder="director@javelin.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className="input-field"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Last Name</label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className="input-field"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="input-field"
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 sm:py-3 text-base sm:text-lg touch-manipulation min-h-[48px]"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm sm:text-base">Creating Director Account...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span className="text-sm sm:text-base">Initialize Director Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Go to Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
