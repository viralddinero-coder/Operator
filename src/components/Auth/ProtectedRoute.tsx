import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'operator' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = ['user'] }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();


  if (isLoading) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AuthRoute: React.FC<{ children: React.ReactNode, redirectTo?: string }> = ({ children, redirectTo }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo || "/"} replace />;
  }

  return <>{children}</>;
};
