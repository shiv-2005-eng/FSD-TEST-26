import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function CreateEditQuiz() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    title: '',
    subject: 'Computer Science',
    description: '',
    duration_min: 30,
    passing_marks: 10,
    start_at: '',
    end_at: ''
  });

  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasAttempts, setHasAttempts] = useState(false);

  // Helper to format Date to YYYY-MM-DDTHH:MM for datetime-local
  const formatForInput = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        // Fetch teacher's questions
        const qRes = await api.get('/teacher/questions');
        setAvailableQuestions(qRes.questions);

        // Pre-select questions from URL query param if present
        const queryParams = new URLSearchParams(location.search);
        const preselected = queryParams.get('selected');
        let initialSelected = preselected ? preselected.split(',').map(Number) : [];

        if (isEdit) {
          const quizRes = await api.get(`/teacher/quizzes/${id}`);
          const q = quizRes.quiz;
          setFormData({
            title: q.title,
            subject: q.subject,
            description: q.description || '',
            duration_min: q.duration_min,
            passing_marks: q.passing_marks,
            start_at: formatForInput(q.start_at),
            end_at: formatForInput(q.end_at)
          });
          initialSelected = quizRes.questions.map((item) => item.id);
          if (quizRes.attempts && quizRes.attempts.length > 0) {
            setHasAttempts(true);
          }
        } else {
          // Defaults for new quiz: start today, end in 7 days
          const now = new Date();
          const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          setFormData((prev) => ({
            ...prev,
            start_at: formatForInput(now.toISOString()),
            end_at: formatForInput(nextWeek.toISOString())
          }));
        }

        setSelectedQuestionIds(initialSelected);
      } catch (err) {
        setError(err.message || 'Failed to initialize quiz form.');
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [id, isEdit, location.search]);

  // Compute total marks from selected questions
  const totalMarks = availableQuestions
    .filter((q) => selectedQuestionIds.includes(q.id))
    .reduce((sum, q) => sum + q.marks, 0);

  const handleToggleQuestion = (qId) => {
    if (hasAttempts) return;
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((item) => item !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const handleSelectAll = (e) => {
    if (hasAttempts) return;
    if (e.target.checked) {
      setSelectedQuestionIds(availableQuestions.map((q) => q.id));
    } else {
      setSelectedQuestionIds([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedQuestionIds.length === 0) {
      setError('Please select at least one question from the question bank.');
      return;
    }

    if (parseInt(formData.passing_marks, 10) > totalMarks) {
      setError(`Passing marks cannot be greater than total marks (${totalMarks}).`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        question_ids: selectedQuestionIds
      };

      if (isEdit) {
        await api.put(`/teacher/quizzes/${id}`, payload);
      } else {
        await api.post('/teacher/quizzes', payload);
      }
      navigate('/teacher/quizzes');
    } catch (err) {
      setError(err.message || 'Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="breadcrumb">
        Home &gt; <Link to="/teacher/quizzes">Quizzes</Link> &gt; {isEdit ? 'Edit Quiz' : 'Create Quiz'}
      </div>

      <div className="panel" style={{ maxWidth: '900px' }}>
        <div className="panel-header" style={{ fontSize: '18px' }}>
          {isEdit ? `Edit Quiz #${id}` : 'Create New Quiz'}
        </div>

        {error && <div className="alert-error">{error}</div>}
        {hasAttempts && (
          <div className="alert-error" style={{ color: '#000', backgroundColor: '#fff3cd', borderColor: '#ffeeba' }}>
            <strong>Note:</strong> Students have already taken attempts on this quiz. Questions cannot be modified to preserve grading integrity.
          </div>
        )}

        {loading ? (
          <div>Loading quiz form...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                Quiz Title:
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Midterm Mathematics"
                style={{ width: '480px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                Subject:
              </label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                style={{ width: '280px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                Description:
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Instructions or syllabus covered..."
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '30px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                  Duration (minutes):
                </label>
                <input
                  type="number"
                  name="duration_min"
                  min="1"
                  max="300"
                  required
                  value={formData.duration_min}
                  onChange={handleChange}
                  style={{ width: '100px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                  Total Marks:
                </label>
                <input
                  type="text"
                  readOnly
                  value={totalMarks}
                  style={{ width: '100px', backgroundColor: '#e9e9e9', fontWeight: 'bold' }}
                  title="Auto-calculated sum of selected questions"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                  Passing Marks:
                </label>
                <input
                  type="number"
                  name="passing_marks"
                  min="1"
                  max={totalMarks || 100}
                  required
                  value={formData.passing_marks}
                  onChange={handleChange}
                  style={{ width: '100px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '30px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                  Start Date/Time:
                </label>
                <input
                  type="datetime-local"
                  name="start_at"
                  required
                  value={formData.start_at}
                  onChange={handleChange}
                  style={{ width: '220px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                  End Date/Time:
                </label>
                <input
                  type="datetime-local"
                  name="end_at"
                  required
                  value={formData.end_at}
                  onChange={handleChange}
                  style={{ width: '220px' }}
                />
              </div>
            </div>

            {/* Question Bank Selection Table */}
            <div style={{ marginTop: '20px', marginBottom: '15px' }}>
              <h3>Question Bank Selection ({selectedQuestionIds.length} selected, {totalMarks} Marks total)</h3>
              
              {availableQuestions.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#666' }}>
                  No questions in question bank. Please add questions first.
                </p>
              ) : (
                <table className="grid-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          disabled={hasAttempts}
                          onChange={handleSelectAll}
                          checked={availableQuestions.length > 0 && selectedQuestionIds.length === availableQuestions.length}
                        />
                      </th>
                      <th style={{ width: '50px' }}>ID</th>
                      <th>Question Text</th>
                      <th style={{ width: '120px' }}>Subject</th>
                      <th style={{ width: '80px' }}>Difficulty</th>
                      <th style={{ width: '60px' }}>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableQuestions.map((q) => {
                      const isChecked = selectedQuestionIds.includes(q.id);
                      return (
                        <tr key={q.id}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              disabled={hasAttempts}
                              checked={isChecked}
                              onChange={() => handleToggleQuestion(q.id)}
                            />
                          </td>
                          <td>Q{q.id}</td>
                          <td>{q.text}</td>
                          <td>{q.subject}</td>
                          <td>{q.difficulty}</td>
                          <td>{q.marks}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving Quiz...' : (isEdit ? 'Save Changes' : 'Create Quiz')}
              </button>
              <Link to="/teacher/quizzes" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
