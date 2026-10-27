import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roll_number: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      navigate('/login?registered=true');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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

      {/* Centered Register Card */}
      <div className="public-body">
        <div className="public-card" style={{ width: '340px' }}>
          <h2>Student Registration</h2>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%' }}
                placeholder="e.g. John Doe"
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                style={{ width: '100%' }}
                placeholder="student@example.com"
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                Roll Number
              </label>
              <input
                type="text"
                name="roll_number"
                required
                value={formData.roll_number}
                onChange={handleChange}
                style={{ width: '100%' }}
                placeholder="e.g. CS-2024-001"
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirm_password"
                required
                value={formData.confirm_password}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '6px' }}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '12px' }}>
              <Link to="/login">Already registered? Login</Link>
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
