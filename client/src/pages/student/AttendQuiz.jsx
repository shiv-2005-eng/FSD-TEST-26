import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal.jsx';
import { api } from '../../services/api.js';

export default function AttendQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState(null);
  const [quizTitle, setQuizTitle] = useState('Online Examination');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Timer reference
  const timerRef = useRef(null);

  // 1. Initialize or resume test attempt
  useEffect(() => {
    async function startAttempt() {
      try {
        const data = await api.post(`/student/quizzes/${quizId}/start`, {});
        setAttemptId(data.attemptId);
        setQuizTitle(data.quizTitle);
        setQuestions(data.questions);
        setAnswers(data.savedAnswers || {});
        setRemainingSeconds(data.remainingSeconds);
      } catch (err) {
        if (err.message && err.message.includes('already completed')) {
          navigate('/student/results');
        } else {
          setError(err.message || 'Failed to start quiz attempt.');
        }
      } finally {
        setLoading(false);
      }
    }
    startAttempt();
  }, [quizId, navigate]);

  // 2. Countdown timer effect
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [remainingSeconds]);

  // Auto-submit when timer expires
  const handleAutoSubmit = async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/student/attempts/${attemptId}/submit`, {});
      navigate(`/student/results/${res.attemptId}?expired=true`);
    } catch (err) {
      console.error('Auto submit error:', err);
      navigate(`/student/results/${attemptId}`);
    }
  };

  // Manual submit confirmation
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const res = await api.post(`/student/attempts/${attemptId}/submit`, {});
      navigate(`/student/results/${res.attemptId}`);
    } catch (err) {
      setError(err.message || 'Failed to submit quiz.');
      setSubmitting(false);
    }
  };

  // Option selection handler
  const handleSelectOption = async (option) => {
    if (!attemptId || questions.length === 0) return;
    const currentQ = questions[currentIndex];

    // Optimistically update state
    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);

    // Persist to server
    setSavingAnswer(true);
    try {
      await api.put(`/student/attempts/${attemptId}/answer`, {
        question_id: currentQ.id,
        selected_option: option
      });
    } catch (err) {
      if (err.message && err.message.includes('Time expired')) {
        handleAutoSubmit();
      } else {
        console.error('Failed to save answer:', err);
      }
    } finally {
      setSavingAnswer(false);
    }
  };

  // Clear answer handler
  const handleClearAnswer = async () => {
    if (!attemptId || questions.length === 0) return;
    const currentQ = questions[currentIndex];

    const newAnswers = { ...answers };
    delete newAnswers[currentQ.id];
    setAnswers(newAnswers);

    try {
      await api.put(`/student/attempts/${attemptId}/answer`, {
        question_id: currentQ.id,
        selected_option: null
      });
    } catch (err) {
      console.error('Failed to clear answer:', err);
    }
  };

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec) => {
    if (totalSec === null || totalSec === undefined) return '00:00:00';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
        <h2>Loading Examination Interface...</h2>
        <p>Please wait while the questions are loaded from the server.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '30px', maxWidth: '600px', margin: '40px auto', background: '#f2f2f2', border: '1px solid #7f9db9' }}>
        <h2 style={{ color: '#c62828' }}>Examination Error</h2>
        <p style={{ margin: '15px 0' }}>{error}</p>
        <button type="button" onClick={() => navigate('/student/quizzes')} className="btn-secondary">
          Back to Available Quizzes
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Exam Header */}
      <div className="exam-header">
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
          {quizTitle}
        </div>
        <div className="exam-timer">
          Time Left: {formatTime(remainingSeconds)}
        </div>
      </div>

      {/* Main Body */}
      <div className="exam-body" style={{ flex: 1 }}>
        {/* Left: Active Question */}
        <div className="exam-main">
          {currentQ ? (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '18px' }}>
                Question {currentIndex + 1} of {questions.length}
                <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#555', marginLeft: '10px' }}>
                  ({currentQ.marks} Marks)
                </span>
              </h2>

              <p style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.5' }}>
                {currentIndex + 1}. {currentQ.text}
              </p>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optText = currentQ[`option_${opt.toLowerCase()}`];
                  const isChecked = answers[currentQ.id] === opt;
                  return (
                    <label
                      key={opt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        cursor: 'pointer',
                        padding: '6px 8px',
                        backgroundColor: isChecked ? '#f0f4f8' : 'transparent',
                        border: isChecked ? '1px solid #7f9db9' : '1px solid transparent'
                      }}
                    >
                      <input
                        type="radio"
                        name={`question_${currentQ.id}`}
                        value={opt}
                        checked={isChecked}
                        onChange={() => handleSelectOption(opt)}
                        style={{ marginRight: '10px' }}
                      />
                      <span><strong>{opt}.</strong> {optText}</span>
                    </label>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="btn-secondary"
                  style={{ padding: '6px 16px' }}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="btn-secondary"
                  style={{ padding: '6px 16px' }}
                >
                  Next
                </button>

                <button
                  type="button"
                  onClick={handleClearAnswer}
                  disabled={!answers[currentQ.id]}
                  className="btn-secondary"
                  style={{ padding: '6px 14px' }}
                >
                  Clear Answer
                </button>

                {savingAnswer && (
                  <span style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', marginLeft: '10px' }}>
                    Saving answer...
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p>No questions in this quiz.</p>
          )}
        </div>

        {/* Right: Question Palette */}
        <div className="exam-palette-panel">
          <h3 style={{ borderBottom: '1px solid #7f9db9', paddingBottom: '6px' }}>
            Question Palette
          </h3>

          <div className="palette-grid">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`palette-btn ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}`}
                  title={`Question ${idx + 1}`}
                >
                  {isAnswered ? `✓${idx + 1}` : idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #7f9db9', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '8px 0', fontSize: '14px', backgroundColor: '#800020', borderColor: '#500014' }}
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        title="Submit Test Confirmation"
        message={`You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to submit?`}
        confirmText="Yes, Submit"
        cancelText="Go Back"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
