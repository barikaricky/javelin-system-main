import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, User, Mail, Phone, Calendar, Shield, Building, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { getImageUrl } from '../../lib/api';

interface UserInfo {
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  status: string;
  profilePhoto?: string;
  createdAt: string;
}

const IDVerification: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, [userId]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Verifying ID for userId:', userId);
      const response = await api.get(`/verify-id/${userId}`);
      console.log('✅ Verification successful:', response.data);
      setUserInfo(response.data.user);
    } catch (err: any) {
      console.error('❌ Failed to verify ID:', err);
      console.error('Error details:', {
        status: err.response?.status,
        message: err.response?.data?.error,
        fullError: err
      });
      setError(err.response?.data?.error || 'Failed to verify ID card');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      DIRECTOR: 'bg-black text-yellow-400',
      MANAGER: 'bg-blue-600 text-white',
      SECRETARY: 'bg-blue-500 text-white',
      GENERAL_SUPERVISOR: 'bg-gradient-to-r from-blue-500 to-yellow-500 text-white',
      SUPERVISOR: 'bg-yellow-500 text-black',
      OPERATOR: 'bg-blue-400 text-white',
    };
    return colors[role] || 'bg-gray-500 text-white';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      INACTIVE: 'bg-red-100 text-red-800 border-red-200',
      SUSPENDED: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Verifying ID Card...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center text-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">
              {error || 'Unable to verify this ID card. The ID may be invalid or expired.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={20} />
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ID Card Verification</h1>
          <p className="text-gray-600">Javelin Management System</p>
        </div>

        {/* Verification Success Badge */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">ID Card Verified Successfully</p>
            <p className="text-sm text-green-700">This is a valid Javelin staff identification</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-lg">
                {userInfo.profilePhoto ? (
                  <img
                    src={getImageUrl(userInfo.profilePhoto)}
                    alt={`${userInfo.firstName} ${userInfo.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">
                  {userInfo.firstName} {userInfo.lastName}
                </h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getRoleBadgeColor(userInfo.role)}`}>
                    {userInfo.role.replace('_', ' ')}
                  </span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusBadgeColor(userInfo.status)}`}>
                    {userInfo.status}
                  </span>
                </div>
                <p className="text-blue-100 text-lg">
                  Employee ID: <span className="text-yellow-400 font-mono font-semibold">{userInfo.employeeId}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Staff Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Email Address</p>
                  <p className="text-gray-900 font-semibold">{userInfo.email}</p>
                </div>
              </div>

              {/* Phone */}
              {userInfo.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                    <p className="text-gray-900 font-semibold">{userInfo.phone}</p>
                  </div>
                </div>
              )}

              {/* Department */}
              {userInfo.department && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Department</p>
                    <p className="text-gray-900 font-semibold">{userInfo.department}</p>
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Member Since</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(userInfo.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-gray-50 border-t border-gray-200 px-8 py-4">
            <p className="text-sm text-gray-600 text-center">
              This verification was performed on {new Date().toLocaleString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900 text-center">
            <strong>Security Notice:</strong> This verification page is for official use only. 
            If you have concerns about this ID card, please contact Javelin Management immediately.
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg font-semibold"
          >
            <ArrowLeft size={20} />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default IDVerification;
