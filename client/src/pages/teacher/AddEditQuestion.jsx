import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function AddEditQuestion() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const initialFormState = {
    subject: 'Computer Science',
    topic: '',
    text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    marks: 2,
    difficulty: 'Medium'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      async function fetchQuestion() {
        try {
          const res = await api.get(`/teacher/questions/${id}`);
          setFormData(res.question);
        } catch (err) {
          setError(err.message || 'Failed to load question details.');
        } finally {
          setLoading(false);
        }
      }
      fetchQuestion();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.subject || !formData.topic || !formData.text ||
        !formData.option_a || !formData.option_b || !formData.option_c || !formData.option_d) {
      setError('Please fill in all question fields and options.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/teacher/questions/${id}`, formData);
      } else {
        await api.post('/teacher/questions', formData);
      }
      navigate('/teacher/questions');
    } catch (err) {
      setError(err.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="breadcrumb">
        You are here: <Link to="/teacher/dashboard">Home</Link> &gt; <Link to="/teacher/questions">Question Bank</Link> &gt; {isEdit ? 'Edit Question' : 'Add New Question'}
      </div>

      <div className="panel" style={{ maxWidth: '720px' }}>
        <div className="panel-header" style={{ fontSize: '16px' }}>
          {isEdit ? `Edit Question #${id}` : 'Add New Question'}
        </div>

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <div>Loading question...</div>
        ) : (
          <form onSubmit={handleSubmit}>
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
                placeholder="e.g. Computer Science, Mathematics"
                style={{ width: '320px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                Topic:
              </label>
              <input
                type="text"
                name="topic"
                required
                value={formData.topic}
                onChange={handleChange}
                placeholder="e.g. Data Structures, Algebra"
                style={{ width: '420px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                Question Text:
              </label>
              <textarea
                name="text"
                required
                rows={4}
                value={formData.text}
                onChange={handleChange}
                style={{ width: '100%' }}
                placeholder="Type question content here..."
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                Option A:
              </label>
              <input
                type="text"
                name="option_a"
                required
                value={formData.option_a}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                Option B:
              </label>
              <input
                type="text"
                name="option_b"
                required
                value={formData.option_b}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                Option C:
              </label>
              <input
                type="text"
                name="option_c"
                required
                value={formData.option_c}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                Option D:
              </label>
              <input
                type="text"
                name="option_d"
                required
                value={formData.option_d}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            {/* Correct Answer Selection */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                Correct Answer:
              </label>
              {['A', 'B', 'C', 'D'].map((opt) => (
                <label key={opt} style={{ marginRight: '20px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="correct_option"
                    value={opt}
                    checked={formData.correct_option === opt}
                    onChange={handleChange}
                  />
                  Option {opt}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '30px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                  Marks:
                </label>
                <input
                  type="number"
                  name="marks"
                  min="1"
                  max="100"
                  required
                  value={formData.marks}
                  onChange={handleChange}
                  style={{ width: '90px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
                  Difficulty:
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  style={{ width: '120px' }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving Question...' : 'Save Question'}
              </button>
              {!isEdit && (
                <button type="button" onClick={handleReset} className="btn-secondary">
                  Reset
                </button>
              )}
              <Link to="/teacher/questions" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
