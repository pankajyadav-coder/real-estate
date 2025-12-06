import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Login } from './Login';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'manager' | 'agent' | 'telecaller';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Allow access if user exists, even without profile (profile will be created)
  if (!user) {
    return <Login />;
  }

  // If user exists but no profile, still allow access (profile might be loading)
  // The app will work, and profile will be fetched/created

  if (requiredRole && profile) {
    const roleHierarchy: Record<string, number> = {
      admin: 4,
      manager: 3,
      agent: 2,
      telecaller: 1,
    };

    const userRoleLevel = roleHierarchy[profile.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page. Required role: {requiredRole}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

