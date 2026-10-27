import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import Modal from '../../components/Modal.jsx';
import { api } from '../../services/api.js';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, question: null });

  const navigate = useNavigate();

  const loadQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        search,
        subject: subjectFilter
      });
      const data = await api.get(`/teacher/questions?${query.toString()}`);
      setQuestions(data.questions);
      setSubjects(data.subjects);
    } catch (err) {
      setError(err.message || 'Failed to load question bank.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [subjectFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadQuestions();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(questions.map((q) => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddSelectedToQuiz = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one question first.');
      return;
    }
    navigate(`/teacher/quizzes/new?selected=${selectedIds.join(',')}`);
  };

  const confirmDelete = async () => {
    if (!deleteModal.question) return;
    try {
      await api.delete(`/teacher/questions/${deleteModal.question.id}`);
      setActionSuccess(`Question #${deleteModal.question.id} deleted successfully.`);
      setDeleteModal({ isOpen: false, question: null });
      loadQuestions();
    } catch (err) {
      setError(err.message || 'Failed to delete question.');
      setDeleteModal({ isOpen: false, question: null });
    }
  };

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; Question Bank</div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h1>Question Bank</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={handleAddSelectedToQuiz} className="btn-secondary">
            Add Selected to Quiz ({selectedIds.length})
          </button>
          <Link to="/teacher/questions/new" className="btn btn-primary">
            Add Question
          </Link>
        </div>
      </div>

      {actionSuccess && <div className="alert-success">{actionSuccess}</div>}
      {error && <div className="alert-error">{error}</div>}

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <label style={{ marginRight: '6px', fontWeight: 'bold' }}>Subject:</label>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="All">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ marginRight: '6px', fontWeight: 'bold' }}>Search:</label>
          <input
            type="text"
            placeholder="Search questions or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '220px' }}
          />
        </div>

        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      {/* Questions Table */}
      {loading ? (
        <div>Loading questions...</div>
      ) : questions.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>No questions found.</p>
      ) : (
        <table className="grid-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={questions.length > 0 && selectedIds.length === questions.length}
                />
              </th>
              <th style={{ width: '60px' }}>ID</th>
              <th>Question Text</th>
              <th style={{ width: '130px' }}>Subject</th>
              <th style={{ width: '110px' }}>Topic</th>
              <th style={{ width: '70px' }}>Marks</th>
              <th style={{ width: '80px' }}>Difficulty</th>
              <th style={{ width: '110px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(q.id)}
                    onChange={() => handleToggleSelect(q.id)}
                  />
                </td>
                <td>Q{q.id}</td>
                <td>{q.text}</td>
                <td>{q.subject}</td>
                <td>{q.topic}</td>
                <td>{q.marks}</td>
                <td>{q.difficulty}</td>
                <td>
                  <Link to={`/teacher/questions/${q.id}/edit`}>Edit</Link>
                  {' | '}
                  <a href="#delete" onClick={(e) => { e.preventDefault(); setDeleteModal({ isOpen: true, question: q }); }}>
                    Delete
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        title="Confirm Question Deletion"
        message={`Are you sure you want to delete Question Q${deleteModal.question?.id}? It will be unlinked from any quizzes using it.`}
        confirmText="Delete Question"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, question: null })}
      />
    </Layout>
  );
}
