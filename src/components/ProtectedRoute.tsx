import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'teacher' | 'student')[];
}

const LOAD_TIMEOUT_MS = 10000;

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, userProfile } = useAuth();
  const location = useLocation();
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) { setLoadTimedOut(false); return; }
    const timer = setTimeout(() => setLoadTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  logger.log('🔒 ProtectedRoute check:', {
    loading,
    hasUser: !!user,
    hasUserProfile: !!userProfile,
    userRole: userProfile?.role,
    allowedRoles,
    currentPath: location.pathname,
  });

  if (loading) {
    logger.log('🔒 ProtectedRoute: Still loading...');
    if (loadTimedOut) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
          <p className="text-muted-foreground text-sm">Taking too long to load. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Reload
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userProfile) {
    logger.log('🔒 ProtectedRoute: Missing user or userProfile, redirecting to auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    logger.log('🔒 ProtectedRoute: Role mismatch for role:', userProfile.role);
    const knownRoles = ['admin', 'teacher', 'student'];
    if (!knownRoles.includes(userProfile.role)) {
      logger.log('🔒 ProtectedRoute: Unknown role, redirecting to auth');
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    const lang = userProfile.preferred_language || 'en';
    const redirectPath = userProfile.role === 'admin' ? `/admin?lang=${lang}`
                        : userProfile.role === 'teacher' ? `/teacher?lang=${lang}`
                        : `/student?lang=${lang}`;
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  logger.log('🔒 ProtectedRoute: Access granted');
  return <>{children}</>;
}