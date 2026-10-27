import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalQuizzes: 0,
    activeQuizzes: 0,
    attemptsToday: 0,
    systemStatus: 'Online'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get('/admin/stats');
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; Admin Dashboard</div>
      <h1>Admin Dashboard</h1>
      <p style={{ marginBottom: '15px', color: '#444' }}>Welcome, {user?.name || 'Admin'}</p>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading dashboard data...</div>
      ) : (
        <>
          {/* Stat Boxes Grid */}
          <div className="stat-boxes">
            <div className="stat-box">
              <div className="stat-box-title">Total Students</div>
              <div className="stat-box-value">{stats.totalStudents}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-title">Total Teachers</div>
              <div className="stat-box-value">{stats.totalTeachers}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-title">Total Quizzes</div>
              <div className="stat-box-value">{stats.totalQuizzes}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-title">Active Quizzes</div>
              <div className="stat-box-value">{stats.activeQuizzes}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-title">Attempts Today</div>
              <div className="stat-box-value">{stats.attemptsToday}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-title">System Status</div>
              <div className="stat-box-value" style={{ fontSize: '18px', paddingTop: '4px', color: '#2e7d32' }}>
                {stats.systemStatus}
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <h2>Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#666' }}>No recent system activity recorded.</p>
          ) : (
            <table className="grid-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Date</th>
                  <th style={{ width: '180px' }}>User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((act) => (
                  <tr key={act.id}>
                    <td>{act.created_at}</td>
                    <td>
                      {act.user_name ? (
                        <strong>{act.user_name} ({act.role})</strong>
                      ) : (
                        'System'
                      )}
                    </td>
                    <td>{act.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </Layout>
  );
}
