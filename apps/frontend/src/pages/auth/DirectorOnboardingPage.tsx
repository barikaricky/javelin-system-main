import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { Shield } from 'lucide-react';

const onboardingSchema = z.object({
  developerToken: z.string().min(1, 'Developer token is required'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function DirectorOnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.createDirector(data);
      setResult(response);
      toast.success('Director account created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create director account');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="card w-full max-w-md">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Director Account Created!</h2>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <p className="text-sm"><strong>Employee ID:</strong> {result.user.employeeId}</p>
            <p className="text-sm"><strong>Email:</strong> {result.user.email}</p>
            <p className="text-sm"><strong>Temporary Password:</strong> {result.temporaryPassword}</p>
          </div>
          
          <p className="text-sm text-gray-600 mt-4">
            ⚠️ Save these credentials securely. The password has also been sent via email.
          </p>
          
          <a href="/login" className="btn-primary w-full mt-6 text-center block">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Director Onboarding
          </h1>
          <p className="text-gray-600">Create the initial director account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Developer Token</label>
            <input
              type="password"
              {...register('developerToken')}
              className="input-field"
              placeholder="Enter developer token"
            />
            {errors.developerToken && (
              <p className="text-red-500 text-sm mt-1">{errors.developerToken.message}</p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
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
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label">Phone (Optional)</label>
            <input
              type="tel"
              {...register('phone')}
              className="input-field"
              placeholder="+234..."
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Creating Account...' : 'Create Director Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
