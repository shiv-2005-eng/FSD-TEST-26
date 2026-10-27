import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Unauthorized() {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'Admin') return '/admin/dashboard';
    if (user.role === 'Teacher') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '40px auto', background: '#f2f2f2', border: '1px solid #7f9db9' }}>
      <h1 style={{ color: '#c62828', marginBottom: '15px' }}>Access Denied (403 - Unauthorized)</h1>
      <p style={{ marginBottom: '15px', fontSize: '14px' }}>
        You do not have permission to access the requested page with your current role ({user?.role || 'Guest'}).
      </p>
      <div>
        <Link to={getDashboardPath()} className="btn btn-primary">
          Back to My Dashboard
        </Link>
      </div>
    </div>
  );
}
