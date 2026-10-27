import React, { useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export default function Profile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match.');
      return;
    }

    if (formData.new_password.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', formData);
      setSuccess(res.message || 'Password changed successfully!');
      setFormData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; My Profile</div>
      <h1>My Profile</h1>

      {/* User Details Box */}
      <div className="panel" style={{ maxWidth: '600px' }}>
        <div className="panel-header">User Details</div>
        <table style={{ border: 'none', width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ width: '120px', fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Name:</td>
              <td style={{ border: 'none', padding: '6px 0' }}>{user?.name}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Email:</td>
              <td style={{ border: 'none', padding: '6px 0' }}>{user?.email}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Role:</td>
              <td style={{ border: 'none', padding: '6px 0' }}>{user?.role}</td>
            </tr>
            {user?.role === 'Student' && (
              <tr>
                <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Roll Number:</td>
                <td style={{ border: 'none', padding: '6px 0' }}>{user?.roll_number || 'N/A'}</td>
              </tr>
            )}
            <tr>
              <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Status:</td>
              <td style={{ border: 'none', padding: '6px 0', textTransform: 'capitalize' }}>{user?.status}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Change Password Box */}
      <div className="panel" style={{ maxWidth: '600px' }}>
        <div className="panel-header">Change Password</div>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <form onSubmit={handlePasswordChange}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
              Old Password:
            </label>
            <input
              type="password"
              name="old_password"
              required
              value={formData.old_password}
              onChange={handleChange}
              style={{ width: '250px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
              New Password:
            </label>
            <input
              type="password"
              name="new_password"
              required
              value={formData.new_password}
              onChange={handleChange}
              style={{ width: '250px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
              Confirm Password:
            </label>
            <input
              type="password"
              name="confirm_password"
              required
              value={formData.confirm_password}
              onChange={handleChange}
              style={{ width: '250px' }}
            />
          </div>

          <div>
            <button type="submit" disabled={loading} className="btn-secondary">
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
