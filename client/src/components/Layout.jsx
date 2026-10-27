import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  const getHeaderTitle = () => {
    if (!user) return 'ONLINE TEST SYSTEM';
    if (user.role === 'Admin') return 'ONLINE TEST SYSTEM - Admin Portal';
    if (user.role === 'Teacher') return 'ONLINE TEST SYSTEM - Teacher Portal';
    return 'Online Test System';
  };

  const getSidebarLinks = () => {
    if (!user) return [];
    if (user.role === 'Student') {
      return [
        { label: 'Dashboard', path: '/student/dashboard' },
        { label: 'Available Quizzes', path: '/student/quizzes' },
        { label: 'My Results', path: '/student/results' },
        { label: 'Profile', path: '/profile' }
      ];
    }
    if (user.role === 'Teacher') {
      return [
        { label: 'Dashboard', path: '/teacher/dashboard' },
        { label: 'Question Bank', path: '/teacher/questions' },
        { label: 'Add Question', path: '/teacher/questions/new' },
        { label: 'Create Quiz', path: '/teacher/quizzes/new' },
        { label: 'View Quizzes', path: '/teacher/quizzes' },
        { label: 'Results', path: '/teacher/results' },
        { label: 'Profile', path: '/profile' }
      ];
    }
    if (user.role === 'Admin') {
      return [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Manage Users', path: '/admin/users' },
        { label: 'Manage Quizzes', path: '/admin/quizzes' },
        { label: 'All Results', path: '/admin/results' },
        { label: 'Profile', path: '/profile' }
      ];
    }
    return [];
  };

  const links = getSidebarLinks();

  return (
    <div>
      {/* Top Header Bar */}
      <div className="header-bar">
        <div className="header-title">{getHeaderTitle()}</div>
        <div className="header-user">
          Logged in as: <strong>{user?.name || user?.email}</strong>
          {' | '}
          <a href="#logout" onClick={handleLogout}>Logout</a>
        </div>
      </div>

      {/* Main Container */}
      <div className="layout-container">
        {/* Left Sidebar */}
        <div className="sidebar">
          <ul>
            {links.map((link) => {
              const isActive = location.pathname === link.path || 
                (link.path !== '/' && location.pathname.startsWith(link.path) && link.path !== '/teacher/quizzes' && link.path !== '/student/quizzes');
              const exactActive = location.pathname === link.path;
              return (
                <li key={link.path} className={exactActive ? 'active' : ''}>
                  <Link to={link.path}>{link.label}</Link>
                </li>
              );
            })}
            <li style={{ marginTop: '15px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
              <a href="#logout" onClick={handleLogout}>Logout</a>
            </li>
          </ul>
        </div>

        {/* Content Area */}
        <div className="main-content">
          {children}
        </div>
      </div>

      {/* Intranet Footer */}
      <div style={{ textAlign: 'center', padding: '10px', fontSize: '11px', color: '#666', borderTop: '1px solid #ddd', backgroundColor: '#fafafa' }}>
        Copyright © 2000-2026 Online Test System. All Rights Reserved.
      </div>
    </div>
  );
}
