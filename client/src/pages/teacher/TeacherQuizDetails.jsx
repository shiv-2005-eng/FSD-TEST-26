import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function TeacherQuizDetails() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuizDetails() {
      try {
        const data = await api.get(`/teacher/quizzes/${id}`);
        setQuiz(data.quiz);
        setAttempts(data.attempts);
        setQuestions(data.questions);
      } catch (err) {
        setError(err.message || 'Failed to load quiz details.');
      } finally {
        setLoading(false);
      }
    }
    loadQuizDetails();
  }, [id]);

  const handleExportCSV = async () => {
    try {
      const blob = await api.get(`/teacher/quizzes/${id}/results.csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz_${id}_student_attempts.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  return (
    <Layout>
      <div className="breadcrumb">
        Home &gt; <Link to="/teacher/quizzes">Quizzes</Link> &gt; {quiz?.title || 'Quiz Details'}
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
          <div className="panel" style={{ maxWidth: '650px', marginBottom: '20px' }}>
            <table style={{ border: 'none', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '130px', fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Quiz Title:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{quiz.title}</td>
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
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Questions:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{questions.length} questions attached</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Status:</td>
                  <td style={{ border: 'none', padding: '4px 0', textTransform: 'capitalize' }}>{quiz.status}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Student Attempt Results */}
          <h2>Student Attempt Results</h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
            <Link to="/teacher/quizzes" className="btn btn-secondary">
              &lt; Back to Quizzes
            </Link>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={attempts.length === 0}
              className="btn-secondary"
            >
              Export to CSV
            </button>
          </div>

          {attempts.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#666', marginTop: '10px' }}>
              No students have taken this quiz yet.
            </p>
          ) : (
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th style={{ width: '100px' }}>Score</th>
                  <th style={{ width: '90px' }}>Percentage</th>
                  <th style={{ width: '90px' }}>Status</th>
                  <th style={{ width: '110px' }}>Time Taken</th>
                  <th style={{ width: '150px' }}>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link to={`/teacher/attempts/${a.id}`}>
                        {a.student_name}
                      </Link>
                      {a.roll_number && <span style={{ color: '#555' }}> ({a.roll_number})</span>}
                    </td>
                    <td>{a.score} / {a.total_marks}</td>
                    <td>{a.percentage}%</td>
                    <td className={a.status === 'Pass' ? 'status-pass' : 'status-fail'}>
                      {a.status}
                    </td>
                    <td>{a.time_taken_mins || '< 1'} mins</td>
                    <td>{a.submitted_at ? a.submitted_at.replace('T', ' ').slice(0, 19) : 'N/A'}</td>
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
