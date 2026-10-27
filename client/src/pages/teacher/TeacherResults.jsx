import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function TeacherResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResults() {
      try {
        const data = await api.get('/teacher/results');
        setResults(data.results);
      } catch (err) {
        setError(err.message || 'Failed to load results summary.');
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, []);

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; Results</div>
      <h1>Quiz Performance &amp; Results</h1>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading quiz results...</div>
      ) : results.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>No quizzes created yet.</p>
      ) : (
        <table className="grid-table" style={{ maxWidth: '850px' }}>
          <thead>
            <tr>
              <th>Quiz Title</th>
              <th style={{ width: '140px' }}>Subject</th>
              <th style={{ width: '100px' }}>Total Marks</th>
              <th style={{ width: '100px' }}>Attempts</th>
              <th style={{ width: '110px' }}>Avg Score</th>
              <th style={{ width: '90px' }}>Status</th>
              <th style={{ width: '120px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/teacher/quizzes/${r.id}`}>
                    <strong>{r.title}</strong>
                  </Link>
                </td>
                <td>{r.subject}</td>
                <td>{r.total_marks}</td>
                <td>{r.attempt_count}</td>
                <td>{r.avg_score !== 'N/A' ? `${r.avg_score} / ${r.total_marks}` : 'N/A'}</td>
                <td style={{ textTransform: 'capitalize' }}>{r.status}</td>
                <td>
                  <Link to={`/teacher/quizzes/${r.id}`}>
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
