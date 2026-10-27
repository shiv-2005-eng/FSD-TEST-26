import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function QuizInstructions() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    async function loadQuiz() {
      try {
        const data = await api.get(`/student/quizzes/${quizId}`);
        setQuiz(data.quiz);
        if (data.quiz.attempt_status === 'submitted') {
          navigate(`/student/results/${data.quiz.attempt_id}`);
        }
      } catch (err) {
        setError(err.message || 'Failed to load quiz details.');
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [quizId, navigate]);

  const handleStartTest = () => {
    if (!agreed) {
      alert('Please check the box confirming you have read the instructions.');
      return;
    }
    navigate(`/student/quizzes/${quizId}/attempt`);
  };

  return (
    <Layout>
      <div className="breadcrumb">
        Home &gt; <Link to="/student/quizzes">Available Quizzes</Link> &gt; Instructions
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading quiz instructions...</div>
      ) : !quiz ? (
        <p>Quiz not found.</p>
      ) : (
        <>
          <h1>Quiz Instructions: {quiz.title}</h1>

          <div className="panel" style={{ maxWidth: '700px', margin: '15px 0' }}>
            <div className="panel-header" style={{ fontSize: '15px' }}>
              Important Examination Guidelines
            </div>

            <table style={{ border: 'none', width: '100%', marginBottom: '15px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '140px', fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Subject:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{quiz.subject}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Total Questions:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{quiz.question_count}</td>
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
                  <td style={{ fontWeight: 'bold', border: 'none', padding: '4px 0' }}>Test Duration:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}><strong>{quiz.duration_min} Minutes</strong></td>
                </tr>
              </tbody>
            </table>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #7f9db9', padding: '12px', fontSize: '12px', lineHeight: '1.6', marginBottom: '15px' }}>
              <strong>Rules &amp; Regulations:</strong>
              <ol style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>This examination is strictly timed by the server. Once started, the countdown timer cannot be paused.</li>
                <li>Each question carries its assigned marks. There is <strong>no negative marking</strong> for incorrect or unanswered questions.</li>
                <li>You can navigate between questions at any time using the <em>Previous</em>, <em>Next</em> buttons or the <em>Question Palette</em>.</li>
                <li>Your selected answers are saved continuously on the server. If your browser or internet disconnects, you can resume as long as time remains.</li>
                <li>When the timer reaches <strong>00:00:00</strong>, your test will be automatically submitted with your saved answers.</li>
                <li>Only one attempt is allowed per student for this quiz.</li>
              </ol>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                I have read, understood, and agree to the instructions.
              </label>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                type="button"
                onClick={handleStartTest}
                disabled={!agreed}
                className="btn-primary"
                style={{ padding: '6px 18px', fontSize: '13px' }}
              >
                Start Test
              </button>
              <Link to="/student/quizzes" className="btn btn-secondary" style={{ padding: '6px 14px' }}>
                Back
              </Link>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
