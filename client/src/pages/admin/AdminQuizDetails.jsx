import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function AdminQuizDetails() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuizDetails() {
      try {
        const data = await api.get(`/admin/quizzes/${id}`);
        setQuiz(data.quiz);
        setAttempts(data.attempts);
      } catch (err) {
        setError(err.message || 'Failed to load quiz details.');
      } finally {
        setLoading(false);
      }
    }
    loadQuizDetails();
  }, [id]);

  return (
    <Layout>
      <div className="breadcrumb">
        Home &gt; Quizzes &gt; {quiz ? quiz.title : 'Quiz Details'}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <Link to="/admin/quizzes" className="btn btn-secondary">
          &lt; Back to Quizzes
        </Link>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading quiz details...</div>
      ) : !quiz ? (
        <p>Quiz not found.</p>
      ) : (
        <>
          <h1>Quiz Details: {quiz.title}</h1>

          {/* Info Box */}
          <div className="panel" style={{ maxWidth: '650px' }}>
            <table style={{ border: 'none', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '140px', fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Quiz Title:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{quiz.title}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Teacher:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{quiz.teacher_name}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Subject:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{quiz.subject}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Duration:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{quiz.duration_min} Mins</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Total Marks:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{quiz.total_marks}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Passing Marks:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{quiz.passing_marks}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Status:</td>
                  <td style={{ border: 'none', padding: '4px 0', textTransform: 'capitalize' }}>{quiz.status}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Student Attempt Results */}
          <h2>Student Attempt Results ({attempts.length})</h2>
          {attempts.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#666' }}>No students have attempted this quiz yet.</p>
          ) : (
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll Number</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const isPass = a.score >= quiz.passing_marks;
                  return (
                    <tr key={a.id}>
                      <td>{a.student_name}</td>
                      <td>{a.roll_number || 'N/A'}</td>
                      <td>{a.score} / {a.total_marks}</td>
                      <td className={isPass ? 'status-pass' : 'status-fail'}>
                        {isPass ? 'Pass' : 'Fail'}
                      </td>
                      <td>{a.submitted_at ? a.submitted_at.replace('T', ' ').slice(0, 19) : 'In Progress'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </Layout>
  );
}
