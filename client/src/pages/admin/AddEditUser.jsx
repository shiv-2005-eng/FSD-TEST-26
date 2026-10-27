import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function AddEditUser() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Teacher',
    password: '',
    status: 'active',
    roll_number: ''
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      async function fetchUser() {
        try {
          const res = await api.get(`/admin/users/${id}`);
          setFormData({
            name: res.user.name,
            email: res.user.email,
            role: res.user.role,
            password: '',
            status: res.user.status,
            roll_number: res.user.roll_number || ''
          });
        } catch (err) {
          setError(err.message || 'Failed to load user.');
        } finally {
          setLoading(false);
        }
      }
      fetchUser();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.role) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isEdit && !formData.password) {
      setError('Password is required for new users.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/admin/users/${id}`, formData);
      } else {
        await api.post('/admin/users', formData);
      }
      navigate('/admin/users');
    } catch (err) {
      setError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="breadcrumb">
        Home &gt; User Management &gt; {isEdit ? 'Edit User' : 'Add User'}
      </div>

      <div className="panel" style={{ maxWidth: '480px', marginTop: '10px' }}>
        <div className="panel-header" style={{ fontSize: '16px' }}>
          {isEdit ? `Edit User #${id}` : 'Add User'}
        </div>

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <div>Loading user details...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                Full Name: <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                Email: <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                Role: <span style={{ color: '#c62828' }}>*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {formData.role === 'Student' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                  Roll Number:
                </label>
                <input
                  type="text"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                  placeholder="e.g. CS-2024-001"
                />
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                Password: {isEdit ? '(leave blank to keep unchanged)' : <span style={{ color: '#c62828' }}>*</span>}
              </label>
              <input
                type="password"
                name="password"
                required={!isEdit}
                value={formData.password}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                Status: <span style={{ color: '#c62828' }}>*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <Link to="/admin/users" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
