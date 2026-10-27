import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { logActivity } from '../utils/logger.js';
import { convertToCSV } from '../utils/csv.js';

const router = express.Router();

// Apply auth and Admin role check to all admin routes
router.use(authenticate, authorizeRoles('Admin'));

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'Student'").get().count;
    const totalTeachers = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'Teacher'").get().count;
    const totalQuizzes = db.prepare("SELECT COUNT(*) AS count FROM quizzes").get().count;
    
    // Active quizzes: status = 'published' AND datetime('now') BETWEEN start_at AND end_at
    const activeQuizzes = db.prepare(`
      SELECT COUNT(*) AS count FROM quizzes 
      WHERE status = 'published' 
      AND datetime('now') BETWEEN datetime(start_at) AND datetime(end_at)
    `).get().count;

    // Attempts today: started_at or submitted_at on today's date
    const attemptsToday = db.prepare(`
      SELECT COUNT(*) AS count FROM attempts 
      WHERE date(started_at) = date('now')
    `).get().count;

    // Recent 10 activity log entries with user names
    const recentActivity = db.prepare(`
      SELECT a.id, a.action, a.created_at, u.name AS user_name, u.email, u.role
      FROM activity_log a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all();

    return res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalQuizzes,
        activeQuizzes,
        attemptsToday,
        systemStatus: 'Online'
      },
      recentActivity
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to retrieve admin stats.' });
  }
});

// GET /api/admin/users - Search, role filter, pagination (10 per page)
router.get('/users', (req, res) => {
  try {
    const { search = '', role = 'All', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * pageLimit;

    let whereClauses = [];
    let params = [];

    if (search.trim()) {
      whereClauses.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(roll_number) LIKE ?)');
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term, term);
    }

    if (role && role !== 'All') {
      whereClauses.push('role = ?');
      params.push(role);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalCount = db.prepare(`SELECT COUNT(*) AS count FROM users ${whereSQL}`).get(...params).count;

    const users = db.prepare(`
      SELECT id, name, email, role, roll_number, status, created_at
      FROM users
      ${whereSQL}
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `).all(...params, pageLimit, offset);

    return res.json({
      users,
      total: totalCount,
      page: pageNum,
      limit: pageLimit,
      totalPages: Math.ceil(totalCount / pageLimit) || 1
    });
  } catch (err) {
    console.error('Admin get users error:', err);
    return res.status(500).json({ error: 'Failed to load users.' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, roll_number, status, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load user details.' });
  }
});

// POST /api/admin/users
router.post('/users', async (req, res) => {
  try {
    const { name, email, role, password, status = 'active', roll_number } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Full name, email, role, and password are required.' });
    }

    if (!['Admin', 'Teacher', 'Student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, roll_number, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), normalizedEmail, passwordHash, role, roll_number ? roll_number.trim() : null, status);

    logActivity(req.user.id, `Created User: ${name.trim()} (${role})`);

    return res.status(201).json({
      message: 'User created successfully.',
      userId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { name, email, role, password, status, roll_number } = req.body;

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetId === req.user.id && status === 'blocked') {
      return res.status(400).json({ error: 'Admin cannot block their own account.' });
    }

    if (targetId === req.user.id && role !== 'Admin') {
      return res.status(400).json({ error: 'Admin cannot demote their own role.' });
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : existing.email;
    const emailConflict = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?').get(normalizedEmail, targetId);
    if (emailConflict) {
      return res.status(400).json({ error: 'Email is already taken by another user.' });
    }

    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }
      const newHash = await bcrypt.hash(password, 10);
      db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, role = ?, password_hash = ?, roll_number = ?, status = ?
        WHERE id = ?
      `).run(
        name ? name.trim() : existing.name,
        normalizedEmail,
        role || existing.role,
        newHash,
        roll_number !== undefined ? (roll_number ? roll_number.trim() : null) : existing.roll_number,
        status || existing.status,
        targetId
      );
    } else {
      db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, role = ?, roll_number = ?, status = ?
        WHERE id = ?
      `).run(
        name ? name.trim() : existing.name,
        normalizedEmail,
        role || existing.role,
        roll_number !== undefined ? (roll_number ? roll_number.trim() : null) : existing.roll_number,
        status || existing.status,
        targetId
      );
    }

    logActivity(req.user.id, `Updated User #${targetId} (${name || existing.name})`);

    return res.json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error('Admin edit user error:', err);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
});

// PATCH /api/admin/users/:id/status - Toggle active/blocked
router.patch('/users/:id/status', (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'Admin cannot block themselves.' });
    }

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or blocked.' });
    }

    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, targetId);

    logActivity(req.user.id, `${status === 'blocked' ? 'Blocked' : 'Unblocked'} User: ${user.name}`);

    return res.json({ message: `User status changed to ${status}.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change user status.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);

    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'Admin cannot delete themselves.' });
    }

    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);

    logActivity(req.user.id, `Deleted User: ${user.name} (#${targetId})`);

    return res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// GET /api/admin/quizzes - View all quizzes across all teachers
router.get('/quizzes', (req, res) => {
  try {
    const quizzes = db.prepare(`
      SELECT q.id, q.title, q.subject, q.duration_min, q.total_marks, q.passing_marks,
             q.start_at, q.end_at, q.status, u.name AS teacher_name,
             (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
             (SELECT COUNT(*) FROM attempts WHERE quiz_id = q.id) AS attempt_count
      FROM quizzes q
      JOIN users u ON q.teacher_id = u.id
      ORDER BY q.id DESC
    `).all();

    return res.json({ quizzes });
  } catch (err) {
    console.error('Admin get quizzes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve quizzes.' });
  }
});

// GET /api/admin/quizzes/:id - Read-only Quiz Details
router.get('/quizzes/:id', (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = db.prepare(`
      SELECT q.*, u.name AS teacher_name,
             (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count
      FROM quizzes q
      JOIN users u ON q.teacher_id = u.id
      WHERE q.id = ?
    `).get(quizId);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    const attempts = db.prepare(`
      SELECT a.id, a.started_at, a.submitted_at, a.score, a.total_marks, a.status,
             u.name AS student_name, u.email AS student_email, u.roll_number
      FROM attempts a
      JOIN users u ON a.student_id = u.id
      WHERE a.quiz_id = ?
      ORDER BY a.submitted_at DESC
    `).all(quizId);

    return res.json({ quiz, attempts });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve quiz details.' });
  }
});

// DELETE /api/admin/quizzes/:id
router.delete('/quizzes/:id', (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = db.prepare('SELECT title FROM quizzes WHERE id = ?').get(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    db.prepare('DELETE FROM quizzes WHERE id = ?').run(quizId);

    logActivity(req.user.id, `Deleted Quiz: ${quiz.title} (#${quizId})`);

    return res.json({ message: 'Quiz deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete quiz.' });
  }
});

// GET /api/admin/results - All Results with filter, search, pagination, and CSV export
router.get('/results', (req, res) => {
  try {
    const { quiz_id, search = '', page = 1, limit = 10, format } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * pageLimit;

    let whereClauses = ["a.status = 'submitted'"];
    let params = [];

    if (quiz_id && quiz_id !== 'all') {
      whereClauses.push('a.quiz_id = ?');
      params.push(quiz_id);
    }

    if (search.trim()) {
      whereClauses.push('(LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.roll_number) LIKE ?)');
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term, term);
    }

    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

    // If CSV requested
    if (format === 'csv') {
      const allResults = db.prepare(`
        SELECT a.id, u.name AS student_name, u.roll_number, q.title AS quiz_title,
               a.submitted_at, a.score, a.total_marks, q.passing_marks
        FROM attempts a
        JOIN users u ON a.student_id = u.id
        JOIN quizzes q ON a.quiz_id = q.id
        ${whereSQL}
        ORDER BY a.submitted_at DESC
      `).all(...params);

      const rows = allResults.map(r => {
        const percentage = r.total_marks > 0 ? ((r.score / r.total_marks) * 100).toFixed(1) : 0;
        const passFail = r.score >= r.passing_marks ? 'Pass' : 'Fail';
        return {
          student: r.student_name,
          roll_number: r.roll_number || 'N/A',
          quiz: r.quiz_title,
          date: r.submitted_at ? r.submitted_at.slice(0, 10) : 'N/A',
          score: r.score,
          total: r.total_marks,
          percentage: `${percentage}%`,
          status: passFail
        };
      });

      const csvHeaders = [
        { label: 'Student', key: 'student' },
        { label: 'Roll Number', key: 'roll_number' },
        { label: 'Quiz', key: 'quiz' },
        { label: 'Date', key: 'date' },
        { label: 'Score', key: 'score' },
        { label: 'Total', key: 'total' },
        { label: 'Percentage', key: 'percentage' },
        { label: 'Status', key: 'status' }
      ];

      const csvContent = convertToCSV(csvHeaders, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="all_quiz_results.csv"');
      return res.send(csvContent);
    }

    const totalCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM attempts a
      JOIN users u ON a.student_id = u.id
      JOIN quizzes q ON a.quiz_id = q.id
      ${whereSQL}
    `).get(...params).count;

    const results = db.prepare(`
      SELECT a.id, a.submitted_at, a.score, a.total_marks,
             u.name AS student_name, u.email AS student_email, u.roll_number,
             q.title AS quiz_title, q.passing_marks
      FROM attempts a
      JOIN users u ON a.student_id = u.id
      JOIN quizzes q ON a.quiz_id = q.id
      ${whereSQL}
      ORDER BY a.submitted_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageLimit, offset);

    const formattedResults = results.map(r => {
      const percentage = r.total_marks > 0 ? ((r.score / r.total_marks) * 100).toFixed(1) : 0;
      const status = r.score >= r.passing_marks ? 'Pass' : 'Fail';
      return {
        ...r,
        percentage,
        resultStatus: status
      };
    });

    // Also get all quizzes for dropdown
    const allQuizzes = db.prepare('SELECT id, title FROM quizzes ORDER BY title ASC').all();

    return res.json({
      results: formattedResults,
      quizzes: allQuizzes,
      total: totalCount,
      page: pageNum,
      limit: pageLimit,
      totalPages: Math.ceil(totalCount / pageLimit) || 1
    });
  } catch (err) {
    console.error('Admin results error:', err);
    return res.status(500).json({ error: 'Failed to retrieve results.' });
  }
});

export default router;
