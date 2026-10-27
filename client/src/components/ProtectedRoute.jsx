import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', fontFamily: 'Arial' }}>
        Loading Online Test System...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', fontFamily: 'Arial' }}>
        Loading Online Test System...
      </div>
    );
  }

  if (user) {
    if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'Teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === 'Student') return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}
