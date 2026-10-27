import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function NotFound() {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'Admin') return '/admin/dashboard';
    if (user.role === 'Teacher') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '40px auto', background: '#f2f2f2', border: '1px solid #7f9db9' }}>
      <h1 style={{ color: '#1f3a5f', marginBottom: '15px' }}>404 - Page Not Found</h1>
      <p style={{ marginBottom: '15px', fontSize: '14px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <div>
        <Link to={getDashboardPath()} className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
