import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function QuizResult() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResult() {
      try {
        const data = await api.get(`/student/results/${attemptId}`);
        setResult(data.result);
      } catch (err) {
        setError(err.message || 'Failed to load quiz results.');
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  return (
    <Layout>
      <div className="breadcrumb">
        Home &gt; Quizzes &gt; Quiz Result
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading quiz result...</div>
      ) : !result ? (
        <p>Result not found.</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Student Quiz Result</h1>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Completed: {result.submitted_at?.slice(0, 10)}
            </div>
          </div>

          <div className="panel" style={{ maxWidth: '620px', margin: '20px 0' }}>
            <table style={{ border: 'none', width: '100%', fontSize: '14px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '150px', fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Quiz Name:</td>
                  <td style={{ border: 'none', padding: '6px 0' }}>{result.quiz_title}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Total Questions:</td>
                  <td style={{ border: 'none', padding: '6px 0' }}>{result.total_questions}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Correct:</td>
                  <td style={{ border: 'none', padding: '6px 0' }}>{result.correct}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Wrong:</td>
                  <td style={{ border: 'none', padding: '6px 0' }}>{result.wrong}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Skipped:</td>
                  <td style={{ border: 'none', padding: '6px 0' }}>{result.skipped}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Score:</td>
                  <td style={{ border: 'none', padding: '6px 0', fontWeight: 'bold' }}>
                    {result.score} / {result.total_marks}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Percentage:</td>
                  <td style={{ border: 'none', padding: '6px 0' }}>{result.percentage}%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '6px 0' }}>Result:</td>
                  <td style={{ border: 'none', padding: '6px 0' }}>
                    <span className={result.pass ? 'status-pass' : 'status-fail'} style={{ fontSize: '16px' }}>
                      {result.statusText}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to={`/student/results/${attemptId}/review`} className="btn btn-secondary">
              [ View Answers ]
            </Link>
            <Link to="/student/dashboard" className="btn btn-secondary">
              [ Back to Dashboard ]
            </Link>
          </div>
        </>
      )}
    </Layout>
  );
}
