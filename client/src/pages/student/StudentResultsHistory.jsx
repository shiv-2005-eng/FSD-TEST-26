import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../services/api.js';

export default function StudentResultsHistory() {
  const [results, setResults] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);

      const data = await api.get(`/student/results?${query.toString()}`);
      setResults(data.results);
    } catch (err) {
      setError(err.message || 'Failed to load results history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadHistory();
  };

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; My Results History</div>
      <h1>My Results History</h1>

      {error && <div className="alert-error">{error}</div>}

      {/* Date Filter */}
      <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '12px' }}>Date Range:</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={{ width: '130px' }}
        />
        <span>To</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={{ width: '130px' }}
        />
        <button type="submit" className="btn-secondary">
          Go
        </button>
      </form>

      {/* Results Table */}
      {loading ? (
        <div>Loading your results...</div>
      ) : results.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>No completed test attempts found.</p>
      ) : (
        <table className="grid-table" style={{ maxWidth: '850px' }}>
          <thead>
            <tr>
              <th>Quiz Name</th>
              <th style={{ width: '130px' }}>Date Taken</th>
              <th style={{ width: '90px' }}>Score</th>
              <th style={{ width: '90px' }}>Percentage</th>
              <th style={{ width: '80px' }}>Status</th>
              <th style={{ width: '120px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.quiz_title}</strong>
                </td>
                <td>{r.dateTaken}</td>
                <td>{r.score} / {r.total_marks}</td>
                <td>{r.percentage}%</td>
                <td className={r.pass ? 'status-pass' : 'status-fail'}>
                  {r.statusText}
                </td>
                <td>
                  <Link to={`/student/results/${r.id}`}>
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
