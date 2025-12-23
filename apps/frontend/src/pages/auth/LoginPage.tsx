import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { addNotification } = useNotificationStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      console.log('🔐 Starting login...');
      const response = await authService.login(data);
      console.log('✅ Login response:', response);
      console.log('👤 User role:', response.user.role);
      
      // Store auth data (Zustand persist handles localStorage automatically)
      setAuth(response.user, response.token, response.refreshToken);
      
      addNotification({
        type: 'success',
        title: 'Welcome Back!',
        message: `${response.user.firstName} ${response.user.lastName} logged in successfully`,
      });
      
      toast.success('Login successful!');
      
      // Route to correct dashboard based on user role
      const role = response.user.role;
      console.log('🚀 Navigating based on role:', role);
      
      // Small delay to ensure Zustand persist completes before navigation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Navigate using React Router
      switch (role) {
        case 'MANAGER':
          console.log('➡️ Navigating to /manager/dashboard');
          navigate('/manager/dashboard', { replace: true });
          break;
        case 'GENERAL_SUPERVISOR':
          console.log('➡️ Navigating to /general-supervisor/dashboard');
          navigate('/general-supervisor/dashboard', { replace: true });
          break;
        case 'DIRECTOR':
        case 'DEVELOPER':
          console.log('➡️ Navigating to /director/dashboard');
          navigate('/director/dashboard', { replace: true });
          break;
        case 'SUPERVISOR':
          navigate('/supervisor/dashboard', { replace: true });
          break;
        case 'OPERATOR':
          navigate('/operator/dashboard', { replace: true });
          break;
        case 'SECRETARY':
          navigate('/secretary/dashboard', { replace: true });
          break;
        default:
          console.log('➡️ Navigating to / (default)');
          navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('❌ Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
      
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: errorMessage,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full opacity-10 -translate-x-1/2 -translate-y-1/2 animate-float"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-green-500 rounded-full opacity-10 translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400 rounded-full opacity-5 -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden relative z-10 border-t-4 border-yellow-400">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform">
              <span className="text-4xl font-black text-blue-900">J</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-blue-200">Sign in to javelin Management</p>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-yellow-100 focus:border-yellow-400 transition-all duration-300"
                  placeholder="your.email@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-yellow-100 focus:border-yellow-400 transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-600 text-gray-900 font-bold px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Contact Support
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Accent */}
        <div className="h-2 bg-gradient-to-r from-yellow-400 via-green-500 to-blue-500"></div>
      </div>
    </div>
  );
}
