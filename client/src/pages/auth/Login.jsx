import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check URL params for passed messages (e.g. after register or blocked)
  const queryParams = new URLSearchParams(location.search);
  const registeredSuccess = queryParams.get('registered');
  const urlError = queryParams.get('error');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password, role);
      if (user.role === 'Admin') navigate('/admin/dashboard');
      else if (user.role === 'Teacher') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-container">
      {/* Top Header Bar */}
      <div className="header-bar">
        <div className="header-title">Online Test System</div>
      </div>

      {/* Centered Login Card */}
      <div className="public-body">
        <div className="public-card">
          <h2>Login</h2>

          {registeredSuccess && (
            <div className="alert-success">
              Registration successful! Please login with your credentials.
            </div>
          )}

          {(error || urlError) && (
            <div className="alert-error">
              {error || urlError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                Email:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%' }}
                placeholder="user@test.com"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                Password:
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                Login as
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '6px' }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '12px' }}>
              <Link to="/register">New student? Register here</Link>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="public-footer">
        © Online Test System
      </div>
    </div>
  );
}
