import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import Modal from '../../components/Modal.jsx';
import { api } from '../../services/api.js';

export default function TeacherQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, quiz: null });

  const loadQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        subject: subjectFilter,
        status: statusFilter
      });
      const data = await api.get(`/teacher/quizzes?${query.toString()}`);
      setQuizzes(data.quizzes);
      setSubjects(data.subjects);
    } catch (err) {
      setError(err.message || 'Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [subjectFilter, statusFilter]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadQuizzes();
  };

  const handleTogglePublish = async (quiz) => {
    try {
      const res = await api.patch(`/teacher/quizzes/${quiz.id}/publish`, {});
      setActionSuccess(`Quiz "${quiz.title}" is now ${res.status}.`);
      loadQuizzes();
    } catch (err) {
      setError(err.message || 'Failed to change publish status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.quiz) return;
    try {
      await api.delete(`/teacher/quizzes/${deleteModal.quiz.id}`);
      setActionSuccess(`Quiz "${deleteModal.quiz.title}" was deleted.`);
      setDeleteModal({ isOpen: false, quiz: null });
      loadQuizzes();
    } catch (err) {
      setError(err.message || 'Failed to delete quiz.');
      setDeleteModal({ isOpen: false, quiz: null });
    }
  };

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; View Quizzes</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h1>Teacher View: Quizzes</h1>
        <Link to="/teacher/quizzes/new" className="btn btn-primary">
          [ + Create New Quiz ]
        </Link>
      </div>

      {actionSuccess && <div className="alert-success">{actionSuccess}</div>}
      {error && <div className="alert-error">{error}</div>}

      {/* Filter Form */}
      <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <label style={{ marginRight: '6px', fontWeight: 'bold' }}>Show Subject:</label>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="All">All</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ marginRight: '6px', fontWeight: 'bold' }}>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <button type="submit" className="btn-secondary">
          Go
        </button>
      </form>

      {/* Quizzes Table */}
      {loading ? (
        <div>Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>No quizzes found matching criteria.</p>
      ) : (
        <>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th style={{ width: '130px' }}>Subject</th>
                <th style={{ width: '80px' }}>Duration</th>
                <th style={{ width: '80px' }}>Questions</th>
                <th style={{ width: '130px' }}>Start</th>
                <th style={{ width: '130px' }}>End</th>
                <th style={{ width: '90px' }}>Status</th>
                <th style={{ width: '220px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <strong>{q.title}</strong>
                  </td>
                  <td>{q.subject}</td>
                  <td>{q.duration_min} mins</td>
                  <td>{q.question_count}</td>
                  <td>{q.start_at ? q.start_at.slice(0, 16) : 'N/A'}</td>
                  <td>{q.end_at ? q.end_at.slice(0, 16) : 'N/A'}</td>
                  <td style={{ textTransform: 'capitalize', fontWeight: q.status === 'published' ? 'bold' : 'normal' }}>
                    {q.status}
                  </td>
                  <td>
                    <Link to={`/teacher/quizzes/${q.id}`}>View</Link>
                    {' | '}
                    <Link to={`/teacher/quizzes/${q.id}/edit`}>Edit</Link>
                    {' | '}
                    <a href="#toggle-publish" onClick={(e) => { e.preventDefault(); handleTogglePublish(q); }}>
                      {q.status === 'published' ? 'Unpublish' : 'Publish'}
                    </a>
                    {' | '}
                    <a href="#delete" onClick={(e) => { e.preventDefault(); setDeleteModal({ isOpen: true, quiz: q }); }}>
                      Delete
                    </a>
                    {' | '}
                    <Link to={`/teacher/quizzes/${q.id}`}>Results</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '10px', fontSize: '12px', color: '#555' }}>
            Page: 1 of 1 (Showing {quizzes.length} quizzes)
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        title="Confirm Quiz Deletion"
        message={`Are you sure you want to delete quiz "${deleteModal.quiz?.title}"? All questions associations and student attempts will be deleted.`}
        confirmText="Delete Quiz"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, quiz: null })}
      />
    </Layout>
  );
}
