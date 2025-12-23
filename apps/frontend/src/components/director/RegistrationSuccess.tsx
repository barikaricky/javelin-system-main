import { CheckCircle, Copy, Mail, Key, User, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface RegistrationSuccessProps {
  credentials: {
    email: string;
    password: string;
    employeeId: string;
    name: string;
  };
  onClose: () => void;
}

export default function RegistrationSuccess({ credentials, onClose }: RegistrationSuccessProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 px-6 py-8 text-center rounded-t-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-secondary-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
            <p className="text-secondary-100">Manager has been registered successfully</p>
          </div>
        </div>

        {/* Credentials */}
        <div className="p-6 space-y-4">
          <div className="bg-gradient-to-br from-primary-50 to-yellow-50 rounded-xl p-4 border-2 border-primary-200">
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-600" />
              Manager Details
            </p>
            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="text-xs text-gray-600 font-medium uppercase tracking-wide">Full Name</label>
                <div className="mt-1 flex items-center justify-between bg-white px-3 py-2 rounded-lg">
                  <span className="font-semibold text-gray-900">{credentials.name}</span>
                </div>
              </div>

              {/* Employee ID */}
              <div>
                <label className="text-xs text-gray-600 font-medium uppercase tracking-wide">Employee ID</label>
                <div className="mt-1 flex items-center justify-between bg-white px-3 py-2 rounded-lg">
                  <span className="font-mono font-semibold text-gray-900">{credentials.employeeId}</span>
                  <button
                    onClick={() => copyToClipboard(credentials.employeeId, 'employeeId')}
                    className="text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    {copiedField === 'employeeId' ? (
                      <CheckCircle className="w-4 h-4 text-secondary-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-gray-600 font-medium uppercase tracking-wide flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Login Email
                </label>
                <div className="mt-1 flex items-center justify-between bg-white px-3 py-2 rounded-lg">
                  <span className="font-medium text-gray-900 break-all">{credentials.email}</span>
                  <button
                    onClick={() => copyToClipboard(credentials.email, 'email')}
                    className="text-primary-600 hover:text-primary-700 transition-colors ml-2"
                  >
                    {copiedField === 'email' ? (
                      <CheckCircle className="w-4 h-4 text-secondary-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-gray-600 font-medium uppercase tracking-wide flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  Temporary Password
                </label>
                <div className="mt-1 flex items-center justify-between bg-white px-3 py-2 rounded-lg">
                  <span className="font-mono font-semibold text-gray-900">
                    {showPassword ? credentials.password : '••••••••••••'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-600 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(credentials.password, 'password')}
                      className="text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {copiedField === 'password' ? (
                        <CheckCircle className="w-4 h-4 text-secondary-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <span className="text-lg">⚠️</span> Important Instructions
            </h3>
            <ul className="space-y-1 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Please share these credentials with the manager securely</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>The manager must change their password on first login</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Save these credentials before closing this window</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Credentials have been sent to the manager's email</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => {
                const text = `Manager Registration Details\n\nName: ${credentials.name}\nEmployee ID: ${credentials.employeeId}\nEmail: ${credentials.email}\nTemporary Password: ${credentials.password}\n\nPlease change your password after first login.`;
                copyToClipboard(text, 'all');
              }}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              {copiedField === 'all' ? 'Copied!' : 'Copy All Details'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-dark-900 font-bold rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
