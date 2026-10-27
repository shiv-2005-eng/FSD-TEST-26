import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { authenticate, JWT_SECRET } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Please enter email, password, and select a role.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'Your account is blocked. Please contact the administrator.' });
  }

  // Business rule: Role selected in dropdown MUST match account's real role
  if (user.role.toLowerCase() !== role.trim().toLowerCase()) {
    return res.status(400).json({
      error: `Invalid role selected. This account is registered as ${user.role}, not ${role}.`
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logActivity(user.id, `User logged in (${user.role})`);

  const userSafe = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roll_number: user.roll_number,
    status: user.status
  };

  return res.json({
    message: 'Login successful.',
    token,
    user: userSafe
  });
});

// POST /api/auth/register (Students only)
router.post('/register', async (req, res) => {
  const { name, email, roll_number, password, confirm_password } = req.body;

  if (!name || !email || !roll_number || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, roll_number, status)
      VALUES (?, ?, ?, 'Student', ?, 'active')
    `).run(name.trim(), normalizedEmail, passwordHash, roll_number.trim());

    const newUserId = result.lastInsertRowid;
    logActivity(newUserId, 'Student registered new account');

    return res.status(201).json({
      message: 'Registration successful! You may now log in with your credentials.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create student account.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  const { old_password, new_password, confirm_password } = req.body;

  if (!old_password || !new_password || !confirm_password) {
    return res.status(400).json({ error: 'All password fields are required.' });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ error: 'New passwords do not match.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const isOldValid = await bcrypt.compare(old_password, user.password_hash);
  if (!isOldValid) {
    return res.status(400).json({ error: 'Incorrect existing password.' });
  }

  const newHash = await bcrypt.hash(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  logActivity(req.user.id, 'User changed password');

  return res.json({ message: 'Password updated successfully.' });
});

export default router;
