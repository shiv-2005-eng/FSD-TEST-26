import db from '../db/database.js';

export function logActivity(userId, action) {
  try {
    const stmt = db.prepare('INSERT INTO activity_log (user_id, action) VALUES (?, ?)');
    stmt.run(userId, action);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
