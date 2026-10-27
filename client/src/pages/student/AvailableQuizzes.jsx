import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function AvailableQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuizzes() {
      try {
        const data = await api.get('/student/quizzes');
        setQuizzes(data.quizzes);
      } catch (err) {
        setError(err.message || 'Failed to load available quizzes.');
      } finally {
        setLoading(false);
      }
    }
    loadQuizzes();
  }, []);

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; Available Quizzes</div>
      <h1>Available Quizzes</h1>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading available quizzes...</div>
      ) : quizzes.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>
          There are currently no active quizzes open for taking.
        </p>
      ) : (
        <table className="grid-table">
          <thead>
            <tr>
              <th>Quiz Title</th>
              <th style={{ width: '150px' }}>Subject</th>
              <th style={{ width: '90px' }}>Duration</th>
              <th style={{ width: '80px' }}>Questions</th>
              <th style={{ width: '90px' }}>Total Marks</th>
              <th style={{ width: '150px' }}>Available Until</th>
              <th style={{ width: '130px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => {
              const hasAttempted = q.attempt_status === 'submitted';
              const inProgress = q.attempt_status === 'in_progress';
              return (
                <tr key={q.id}>
                  <td>
                    <strong>{q.title}</strong>
                    {q.description && <div style={{ fontSize: '11px', color: '#555' }}>{q.description}</div>}
                  </td>
                  <td>{q.subject}</td>
                  <td>{q.duration_min} mins</td>
                  <td>{q.question_count}</td>
                  <td>{q.total_marks}</td>
                  <td>{q.end_at ? q.end_at.slice(0, 16) : 'N/A'}</td>
                  <td>
                    {hasAttempted ? (
                      <div>
                        <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Completed</span>
                        {' | '}
                        <Link to={`/student/results/${q.attempt_id}`}>View</Link>
                      </div>
                    ) : inProgress ? (
                      <Link to={`/student/quizzes/${q.id}/attempt`} className="btn btn-primary" style={{ fontSize: '11px' }}>
                        Resume Test
                      </Link>
                    ) : (
                      <Link to={`/student/quizzes/${q.id}/instructions`} className="btn btn-primary" style={{ fontSize: '11px' }}>
                        Start Quiz
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
