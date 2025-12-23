import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import NotificationPanel from './NotificationPanel';

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout notification
    addNotification({
      type: 'info',
      title: 'Logged Out',
      message: `${user?.firstName} ${user?.lastName} has logged out successfully`,
    });
    
    // Clear auth and redirect
    clearAuth();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <span className="text-xl font-black text-blue-900">J</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">
                javelin
              </h1>
              <p className="text-xs text-blue-200">Management System</p>
            </div>
          </div>
          
          {/* Right Side */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Info */}
            <div className="hidden sm:flex items-center gap-3 bg-blue-800/50 rounded-xl px-4 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-green-400 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-900" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-yellow-300 capitalize">{user?.role.toLowerCase()}</p>
              </div>
            </div>
            
            {/* Notification Panel */}
            <NotificationPanel />
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
