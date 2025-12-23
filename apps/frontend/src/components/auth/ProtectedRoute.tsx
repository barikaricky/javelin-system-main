import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  const authenticated = isAuthenticated();
  console.log('🛡️ ProtectedRoute check:', { 
    path: location.pathname, 
    authenticated, 
    user: user?.email, 
    role: user?.role,
    allowedRoles 
  });

  // Redirect to login if not authenticated
  if (!authenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If no specific roles are required, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user's role is in the allowed roles
  if (user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  // User is authenticated but doesn't have permission - redirect to their dashboard
  if (user) {
    switch (user.role) {
      case 'DIRECTOR':
      case 'DEVELOPER':
        return <Navigate to="/director/dashboard" replace />;
      case 'MANAGER':
        return <Navigate to="/manager/dashboard" replace />;
      case 'GENERAL_SUPERVISOR':
        return <Navigate to="/general-supervisor/dashboard" replace />;
      case 'SUPERVISOR':
        return <Navigate to="/supervisor/dashboard" replace />;
      case 'OPERATOR':
        return <Navigate to="/operator/dashboard" replace />;
      case 'SECRETARY':
        return <Navigate to="/secretary/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Fallback to login
  return <Navigate to="/login" replace />;
}
