import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: ('superAdmin' | 'admin' | 'deliverer' | 'provider')[];
}

export const ProtectedRoute = ({
  children,
  requiredRoles = [],
}: ProtectedRouteProps) => {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuthContext();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  // Check required roles
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as 'superAdmin' | 'admin' | 'deliverer' | 'provider')) {
    setLocation('/login');
    return null;
  }

  return <>{children}</>;
};
