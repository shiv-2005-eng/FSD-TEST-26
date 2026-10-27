import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function AdminAllResults() {
  const [results, setResults] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [searchStudent, setSearchStudent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadResults = async (targetPage = page, quizId = selectedQuiz, search = searchTerm) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: targetPage,
        limit: 10,
        quiz_id: quizId,
        search
      });
      const data = await api.get(`/admin/results?${query.toString()}`);
      setResults(data.results);
      setQuizzes(data.quizzes);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) {
      setError(err.message || 'Failed to load test results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults(1, selectedQuiz, searchTerm);
  }, [selectedQuiz]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchStudent);
    loadResults(1, selectedQuiz, searchStudent);
  };

  const handleExportCSV = async () => {
    try {
      const query = new URLSearchParams({
        quiz_id: selectedQuiz,
        search: searchTerm,
        format: 'csv'
      });
      const blob = await api.get(`/admin/results?${query.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_test_results_${Date.now()}.csv`;
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
      <div className="breadcrumb">Home &gt; All Results</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h1>Admin &gt; All Results</h1>
        <button type="button" onClick={handleExportCSV} className="btn-primary">
          Export CSV
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Filter and Search */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: '6px', fontWeight: 'bold' }}>Select Quiz:</label>
          <select value={selectedQuiz} onChange={(e) => setSelectedQuiz(e.target.value)}>
            <option value="all">-- All Quizzes --</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ marginRight: '6px', fontWeight: 'bold' }}>Search Student:</label>
          <input
            type="text"
            placeholder="Search Student"
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            style={{ width: '180px' }}
          />
        </div>

        <button type="submit" className="btn-secondary">
          Search
        </button>
      </form>

      {/* Results Table */}
      {loading ? (
        <div>Loading test results...</div>
      ) : results.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>No student test results found.</p>
      ) : (
        <>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Quiz</th>
                <th style={{ width: '110px' }}>Date</th>
                <th style={{ width: '70px' }}>Score</th>
                <th style={{ width: '70px' }}>Total</th>
                <th style={{ width: '90px' }}>Percentage</th>
                <th style={{ width: '80px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>{r.student_name}</td>
                  <td>{r.quiz_title}</td>
                  <td>{r.submitted_at ? r.submitted_at.slice(0, 10) : 'N/A'}</td>
                  <td>{r.score}</td>
                  <td>{r.total_marks}</td>
                  <td>{r.percentage}%</td>
                  <td className={r.resultStatus === 'Pass' ? 'status-pass' : 'status-fail'}>
                    {r.resultStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <span>Showing {((page - 1) * 10) + 1}-{Math.min(page * 10, total)} of {total} results |</span>
            {' '}
            {page > 1 ? (
              <a href="#prev" onClick={(e) => { e.preventDefault(); loadResults(page - 1, selectedQuiz, searchTerm); }}>
                Previous
              </a>
            ) : (
              <span style={{ color: '#888' }}>Previous</span>
            )}
            {' '}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <span key={p}>
                {p === page ? (
                  <span className="active">[{p}]</span>
                ) : (
                  <a href={`#page-${p}`} onClick={(e) => { e.preventDefault(); loadResults(p, selectedQuiz, searchTerm); }}>
                    {p}
                  </a>
                )}
                {' '}
              </span>
            ))}
            {page < totalPages ? (
              <a href="#next" onClick={(e) => { e.preventDefault(); loadResults(page + 1, selectedQuiz, searchTerm); }}>
                Next
              </a>
            ) : (
              <span style={{ color: '#888' }}>Next</span>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
