import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import Modal from '../../components/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });

  const loadUsers = async (targetPage = page, searchTerm = search, role = roleFilter) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: targetPage,
        limit: 10,
        search: searchTerm,
        role: role
      });
      const data = await api.get(`/admin/users?${query.toString()}`);
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1, search, roleFilter);
  }, [roleFilter]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    loadUsers(1, searchInput, roleFilter);
  };

  const handleToggleBlock = async (user) => {
    if (user.id === currentUser.id) {
      alert('You cannot block your own admin account.');
      return;
    }
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
      setActionSuccess(`User ${user.name} has been ${newStatus}.`);
      loadUsers(page, search, roleFilter);
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.user) return;
    try {
      await api.delete(`/admin/users/${deleteModal.user.id}`);
      setActionSuccess(`User ${deleteModal.user.name} deleted successfully.`);
      setDeleteModal({ isOpen: false, user: null });
      loadUsers(page, search, roleFilter);
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
      setDeleteModal({ isOpen: false, user: null });
    }
  };

  return (
    <Layout>
      <div className="breadcrumb">Home &gt; User Management &gt; Manage Users</div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h1>Manage Users</h1>
        <Link to="/admin/users/new" className="btn btn-primary">
          Add New User
        </Link>
      </div>

      {actionSuccess && <div className="alert-success">{actionSuccess}</div>}
      {error && <div className="alert-error">{error}</div>}

      {/* Filter and Search Bar */}
      <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <label style={{ marginRight: '6px', fontWeight: 'bold' }}>Search:</label>
          <input
            type="text"
            placeholder="Name, email, roll number"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: '220px' }}
          />
        </div>

        <div>
          <label style={{ marginRight: '6px', fontWeight: 'bold' }}>Role:</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Admin">Admin</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
          </select>
        </div>

        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      {/* Users Table */}
      {loading ? (
        <div>Loading users...</div>
      ) : users.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>No users found matching criteria.</p>
      ) : (
        <>
          <table className="grid-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th style={{ width: '90px' }}>Role</th>
                <th style={{ width: '80px' }}>Status</th>
                <th style={{ width: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td style={{ color: u.status === 'blocked' ? '#c62828' : '#000', fontWeight: u.status === 'blocked' ? 'bold' : 'normal' }}>
                      {u.status === 'active' ? 'Active' : 'Blocked'}
                    </td>
                    <td>
                      <Link to={`/admin/users/${u.id}/edit`}>Edit</Link>
                      {' | '}
                      {isSelf ? (
                        <span style={{ color: '#888' }} title="Admin cannot block self">Block</span>
                      ) : (
                        <a href="#toggle-block" onClick={(e) => { e.preventDefault(); handleToggleBlock(u); }}>
                          {u.status === 'active' ? 'Block' : 'Unblock'}
                        </a>
                      )}
                      {' | '}
                      {isSelf ? (
                        <span style={{ color: '#888' }} title="Admin cannot delete self">Delete</span>
                      ) : (
                        <a href="#delete" onClick={(e) => { e.preventDefault(); setDeleteModal({ isOpen: true, user: u }); }}>
                          Delete
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <span>Showing {((page - 1) * 10) + 1}-{Math.min(page * 10, total)} of {total} users.</span>
            {' '}
            {page > 1 && (
              <a href="#prev" onClick={(e) => { e.preventDefault(); loadUsers(page - 1, search, roleFilter); }}>
                Prev
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <span key={p}>
                {p === page ? (
                  <span className="active">{p}</span>
                ) : (
                  <a href={`#page-${p}`} onClick={(e) => { e.preventDefault(); loadUsers(p, search, roleFilter); }}>
                    {p}
                  </a>
                )}
              </span>
            ))}
            {page < totalPages && (
              <a href="#next" onClick={(e) => { e.preventDefault(); loadUsers(page + 1, search, roleFilter); }}>
                Next
              </a>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        title="Confirm User Deletion"
        message={`Are you sure you want to delete user "${deleteModal.user?.name}" (${deleteModal.user?.email})? This action is permanent and cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, user: null })}
      />
    </Layout>
  );
}
