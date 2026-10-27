import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    quizzesAttempted: 0,
    averageScore: '0%',
    pendingQuizzes: 0
  });
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get('/student/stats');
        setStats(data.stats);
        setUpcomingQuizzes(data.upcomingQuizzes);
      } catch (err) {
        setError(err.message || 'Failed to load student dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; Student Dashboard</div>
      <h1>Welcome, {user?.name || 'Student'}</h1>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading dashboard data...</div>
      ) : (
        <>
          {/* Stat Boxes */}
          <div className="stat-boxes">
            <div className="stat-box">
              <div className="stat-box-title">Quizzes Attempted</div>
              <div className="stat-box-value">{stats.quizzesAttempted}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-title">Average Score</div>
              <div className="stat-box-value">{stats.averageScore}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-title">Pending Quizzes</div>
              <div className="stat-box-value">{stats.pendingQuizzes}</div>
            </div>
          </div>

          {/* Upcoming Quizzes Table */}
          <h2>Upcoming Quizzes</h2>
          {upcomingQuizzes.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#666' }}>No upcoming pending quizzes available right now.</p>
          ) : (
            <table className="grid-table" style={{ maxWidth: '800px' }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th style={{ width: '160px' }}>Subject</th>
                  <th style={{ width: '130px' }}>Date</th>
                  <th style={{ width: '100px' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {upcomingQuizzes.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <Link to={`/student/quizzes/${q.id}/instructions`}>
                        <strong>{q.title}</strong>
                      </Link>
                    </td>
                    <td>{q.subject}</td>
                    <td>{q.start_at ? q.start_at.slice(0, 10) : 'Active'}</td>
                    <td>{q.duration_min} mins</td>
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
