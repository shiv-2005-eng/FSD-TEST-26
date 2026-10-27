import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function TeacherAttemptReview() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAttempt() {
      try {
        const res = await api.get(`/teacher/attempts/${attemptId}`);
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load attempt review.');
      } finally {
        setLoading(false);
      }
    }
    loadAttempt();
  }, [attemptId]);

  return (
    <Layout>
      <div className="breadcrumb">
        Home &gt; Quizzes &gt; Attempt Review
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading attempt review...</div>
      ) : !data ? (
        <p>Attempt not found.</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h1>Student Attempt Review</h1>
            <Link to={`/teacher/quizzes/${data.attempt.quiz_id}`} className="btn btn-secondary">
              &lt; Back to Quiz Details
            </Link>
          </div>

          {/* Student & Score Details Box */}
          <div className="panel" style={{ maxWidth: '650px', marginBottom: '20px' }}>
            <table style={{ border: 'none', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '130px', fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Student Name:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{data.attempt.student_name} ({data.attempt.roll_number || 'N/A'})</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Quiz Title:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{data.attempt.quiz_title}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Subject:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{data.attempt.subject}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Score:</td>
                  <td style={{ border: 'none', padding: '4px 0', fontWeight: 'bold' }}>
                    {data.attempt.score} / {data.attempt.total_marks}
                    {' ('}
                    {data.attempt.total_marks > 0 ? ((data.attempt.score / data.attempt.total_marks) * 100).toFixed(1) : 0}%
                    {') - '}
                    <span className={data.attempt.score >= data.attempt.passing_marks ? 'status-pass' : 'status-fail'}>
                      {data.attempt.score >= data.attempt.passing_marks ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Submitted At:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{data.attempt.submitted_at?.replace('T', ' ').slice(0, 19)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Question by Question Review */}
          <h2>Answers Breakdown ({data.questions.length} Questions)</h2>

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
                  <strong>Student Selected: </strong>
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
