import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myQuestions: 0,
    myQuizzes: 0,
    totalAttempts: 0
  });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get('/teacher/stats');
        setStats(data.stats);
        setRecentQuizzes(data.recentQuizzes);
      } catch (err) {
        setError(err.message || 'Failed to load teacher stats.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; Teacher Dashboard</div>
      <h1>Dashboard Overview</h1>
      <p style={{ marginBottom: '15px', color: '#444' }}>Welcome, {user?.name || 'Teacher'}</p>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading dashboard data...</div>
      ) : (
        <>
          {/* Stat Boxes */}
          <div className="stat-boxes">
            <div className="stat-box">
              <div className="stat-box-title">My Questions</div>
              <div className="stat-box-value">{stats.myQuestions}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-title">My Quizzes</div>
              <div className="stat-box-value">{stats.myQuizzes}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-title">Total Attempts</div>
              <div className="stat-box-value">{stats.totalAttempts}</div>
            </div>
          </div>

          {/* My Recent Quizzes Table */}
          <h2>My Recent Quizzes</h2>
          {recentQuizzes.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#666' }}>You have not created any quizzes yet.</p>
          ) : (
            <table className="grid-table" style={{ maxWidth: '750px' }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th style={{ width: '130px' }}>Date</th>
                  <th style={{ width: '100px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentQuizzes.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <Link to={`/teacher/quizzes/${q.id}`}>
                        <strong>{q.title}</strong>
                      </Link>
                    </td>
                    <td>{q.start_at ? q.start_at.slice(0, 10) : 'N/A'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{q.status}</td>
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
