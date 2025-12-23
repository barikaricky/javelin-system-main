import { User as UserIcon, Mail, Phone } from 'lucide-react';
import { User } from '../../stores/authStore';

interface DirectorProfileCardProps {
  user: User;
}

export default function DirectorProfileCard({ user }: DirectorProfileCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden border border-gray-100 w-full">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 px-4 sm:px-6 py-6 sm:py-8 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-primary-400 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-secondary-400 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative flex flex-col items-center">
          {/* Profile Photo or Avatar */}
          <div className="relative">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-primary-400 object-cover shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-primary-400 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-xl">
                <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
            )}
            {/* Online Status Indicator */}
            <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-secondary-500 rounded-full border-2 sm:border-4 border-white"></div>
          </div>
          
          {/* Name and Role */}
          <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-white text-center break-words px-2">
            {user.firstName} {user.lastName}
          </h2>
          <span className="mt-2 px-3 sm:px-4 py-1 bg-primary-400 text-dark-900 text-xs sm:text-sm font-semibold rounded-full uppercase tracking-wide">
            {user.role}
          </span>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {/* Email */}
        <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-dark-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-dark-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
            <p className="text-xs sm:text-sm text-gray-900 font-medium break-all mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Phone */}
        {user.phone && (
          <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</p>
              <p className="text-xs sm:text-sm text-gray-900 font-medium mt-0.5">{user.phone}</p>
            </div>
          </div>
        )}

        {/* ID */}
        <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">User ID</p>
            <p className="text-xs sm:text-sm text-gray-900 font-mono font-medium mt-0.5 break-all">{user.id?.substring(0, 8) || 'N/A'}...</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
          <div className="bg-gradient-to-br from-dark-50 to-dark-100 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-xl sm:text-2xl font-bold text-dark-900">24</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide mt-1">Active</div>
          </div>
          <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-xl sm:text-2xl font-bold text-secondary-900">12</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide mt-1">Done</div>
          </div>
        </div>
      </div>
    </div>
  );
}
