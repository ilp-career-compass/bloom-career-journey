import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ('admin' | 'teacher' | 'student')[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(userProfile.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = userProfile.role === 'admin' ? '/admin' 
                        : userProfile.role === 'teacher' ? '/teacher'
                        : '/student';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}