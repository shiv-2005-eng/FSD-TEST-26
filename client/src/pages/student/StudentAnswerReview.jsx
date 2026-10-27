import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function StudentAnswerReview() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReview() {
      try {
        const res = await api.get(`/student/results/${attemptId}/review`);
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load answer review.');
      } finally {
        setLoading(false);
      }
    }
    loadReview();
  }, [attemptId]);

  return (
    <Layout>
      <div className="breadcrumb">
        Home &gt; <Link to="/student/results">My Results</Link> &gt; <Link to={`/student/results/${attemptId}`}>Result Details</Link> &gt; Answer Review
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading answer review...</div>
      ) : !data ? (
        <p>Review data not found.</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h1>Answer Review: {data.attempt.quiz_title}</h1>
            <Link to={`/student/results/${attemptId}`} className="btn btn-secondary">
              &lt; Back to Result
            </Link>
          </div>

          <div className="panel" style={{ maxWidth: '600px', marginBottom: '20px' }}>
            <div>
              <strong>Final Score: </strong>
              {data.attempt.score} / {data.attempt.total_marks}
              {' ('}
              {data.attempt.total_marks > 0 ? ((data.attempt.score / data.attempt.total_marks) * 100).toFixed(1) : 0}%
              {') - '}
              <span className={data.attempt.score >= data.attempt.passing_marks ? 'status-pass' : 'status-fail'} style={{ fontWeight: 'bold' }}>
                {data.attempt.score >= data.attempt.passing_marks ? 'PASS' : 'FAIL'}
              </span>
            </div>
          </div>

          <h2>Question Review ({data.questions.length} Questions)</h2>

          {data.questions.map((q, idx) => (
            <div
              key={q.id}
              className="panel"
              style={{
                marginBottom: '15px',
                borderLeft: q.statusText === 'Correct' ? '4px solid #2e7d32' : q.statusText === 'Wrong' ? '4px solid #c62828' : '4px solid #999999'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px' }}>Question {idx + 1} ({q.marks} Marks)</strong>
                <span className={q.statusText === 'Correct' ? 'status-pass' : q.statusText === 'Wrong' ? 'status-fail' : ''} style={{ fontWeight: 'bold' }}>
                  [{q.statusText.toUpperCase()}]
                </span>
              </div>

              <div style={{ fontSize: '13px', marginBottom: '10px' }}>
                {q.text}
              </div>

              <div style={{ paddingLeft: '15px', marginBottom: '10px', fontSize: '12px' }}>
                <div><strong>A:</strong> {q.option_a}</div>
                <div><strong>B:</strong> {q.option_b}</div>
                <div><strong>C:</strong> {q.option_c}</div>
                <div><strong>D:</strong> {q.option_d}</div>
              </div>

              <div style={{ fontSize: '12px', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
                <div>
                  <strong>Your Answer: </strong>
                  {q.selected_option ? `Option ${q.selected_option}` : 'None (Skipped)'}
                </div>
                <div>
                  <strong>Correct Answer: </strong>
                  Option {q.correct_option}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </Layout>
  );
}
