import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import Modal from '../../components/Modal.jsx';
import { api } from '../../services/api.js';

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, quiz: null });

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/quizzes');
      setQuizzes(data.quizzes);
    } catch (err) {
      setError(err.message || 'Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const confirmDelete = async () => {
    if (!deleteModal.quiz) return;
    try {
      await api.delete(`/admin/quizzes/${deleteModal.quiz.id}`);
      setActionSuccess(`Quiz "${deleteModal.quiz.title}" deleted successfully.`);
      setDeleteModal({ isOpen: false, quiz: null });
      loadQuizzes();
    } catch (err) {
      setError(err.message || 'Failed to delete quiz.');
      setDeleteModal({ isOpen: false, quiz: null });
    }
  };

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; Quizzes &gt; Manage Quizzes</div>
      <h1>Manage Quizzes</h1>

      {actionSuccess && <div className="alert-success">{actionSuccess}</div>}
      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>No quizzes exist in the system yet.</p>
      ) : (
        <table className="grid-table">
          <thead>
            <tr>
              <th>Quiz Title</th>
              <th>Teacher</th>
              <th>Subject</th>
              <th style={{ width: '80px' }}>Duration</th>
              <th style={{ width: '80px' }}>Questions</th>
              <th style={{ width: '130px' }}>Start</th>
              <th style={{ width: '130px' }}>End</th>
              <th style={{ width: '90px' }}>Status</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => (
              <tr key={q.id}>
                <td>
                  <strong>{q.title}</strong>
                </td>
                <td>{q.teacher_name}</td>
                <td>{q.subject}</td>
                <td>{q.duration_min} mins</td>
                <td>{q.question_count}</td>
                <td>{q.start_at ? q.start_at.slice(0, 16) : 'N/A'}</td>
                <td>{q.end_at ? q.end_at.slice(0, 16) : 'N/A'}</td>
                <td style={{ textTransform: 'capitalize' }}>{q.status}</td>
                <td>
                  <Link to={`/admin/quizzes/${q.id}`}>View</Link>
                  {' | '}
                  <a href="#delete" onClick={(e) => { e.preventDefault(); setDeleteModal({ isOpen: true, quiz: q }); }}>
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
        title="Confirm Quiz Deletion"
        message={`Are you sure you want to delete quiz "${deleteModal.quiz?.title}"? All associated questions links and student attempts will also be removed.`}
        confirmText="Delete Quiz"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, quiz: null })}
      />
    </Layout>
  );
}
