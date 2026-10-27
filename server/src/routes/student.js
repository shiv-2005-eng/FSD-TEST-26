import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

router.use(authenticate, authorizeRoles('Student'));

// Helper to calculate remaining time in seconds on server
function getRemainingSeconds(startedAtStr, durationMin) {
  if (!startedAtStr) return durationMin * 60;
  let isoStr = startedAtStr;
  if (!isoStr.endsWith('Z')) {
    isoStr = isoStr.replace(' ', 'T') + 'Z';
  }
  const startedAt = new Date(isoStr).getTime();
  const now = Date.now();
  const elapsedSec = Math.floor((now - startedAt) / 1000);
  const totalSec = durationMin * 60;
  return totalSec - elapsedSec;
}

// Helper to grade and finalize an attempt
function finalizeAttempt(attemptId) {
  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ?').get(attemptId);
  if (!attempt || attempt.status === 'submitted') return attempt;

  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(attempt.quiz_id);

  const questions = db.prepare(`
    SELECT q.id, q.correct_option, q.marks
    FROM quiz_questions qq
    JOIN questions q ON qq.question_id = q.id
    WHERE qq.quiz_id = ?
  `).all(attempt.quiz_id);

  const savedAnswers = db.prepare(`
    SELECT question_id, selected_option
    FROM attempt_answers
    WHERE attempt_id = ?
  `).all(attemptId);

  const answerMap = {};
  for (const a of savedAnswers) {
    if (a.selected_option) {
      answerMap[a.question_id] = a.selected_option;
    }
  }

  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let totalScore = 0;

  for (const q of questions) {
    const selected = answerMap[q.id];
    if (!selected) {
      skipped++;
    } else if (selected === q.correct_option) {
      correct++;
      totalScore += q.marks;
    } else {
      wrong++;
    }
  }

  db.prepare(`
    UPDATE attempts
    SET status = 'submitted', submitted_at = ?,
        score = ?, correct = ?, wrong = ?, skipped = ?
    WHERE id = ?
  `).run(new Date().toISOString(), totalScore, correct, wrong, skipped, attemptId);

  logActivity(attempt.student_id, `Submitted Quiz: ${quiz?.title || 'Quiz'} (Score: ${totalScore}/${attempt.total_marks})`);

  return db.prepare('SELECT * FROM attempts WHERE id = ?').get(attemptId);
}

// GET /api/student/stats
router.get('/stats', (req, res) => {
  try {
    const studentId = req.user.id;

    // Quizzes attempted
    const submittedAttempts = db.prepare(`
      SELECT score, total_marks 
      FROM attempts 
      WHERE student_id = ? AND status = 'submitted'
    `).all(studentId);

    const quizzesAttempted = submittedAttempts.length;

    let averageScore = 0;
    if (quizzesAttempted > 0) {
      const totalPct = submittedAttempts.reduce((acc, curr) => {
        const pct = curr.total_marks > 0 ? (curr.score / curr.total_marks) * 100 : 0;
        return acc + pct;
      }, 0);
      averageScore = Math.round(totalPct / quizzesAttempted);
    }

    // Pending quizzes (published, within date window, not yet attempted by this student)
    const pendingQuizzes = db.prepare(`
      SELECT q.id, q.title, q.subject, q.start_at, q.duration_min
      FROM quizzes q
      WHERE q.status = 'published'
        AND datetime('now') BETWEEN datetime(q.start_at) AND datetime(q.end_at)
        AND q.id NOT IN (
          SELECT quiz_id FROM attempts WHERE student_id = ?
        )
      ORDER BY q.start_at ASC
    `).all(studentId);

    return res.json({
      stats: {
        quizzesAttempted,
        averageScore: `${averageScore}%`,
        pendingQuizzes: pendingQuizzes.length
      },
      upcomingQuizzes: pendingQuizzes
    });
  } catch (err) {
    console.error('Student stats error:', err);
    return res.status(500).json({ error: 'Failed to load student statistics.' });
  }
});

// GET /api/student/quizzes - Available quizzes
router.get('/quizzes', (req, res) => {
  try {
    const studentId = req.user.id;

    // Available quizzes are published and within time window
    const quizzes = db.prepare(`
      SELECT q.id, q.title, q.subject, q.description, q.duration_min, q.total_marks,
             q.passing_marks, q.start_at, q.end_at,
             (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
             a.id AS attempt_id, a.status AS attempt_status
      FROM quizzes q
      LEFT JOIN attempts a ON a.quiz_id = q.id AND a.student_id = ?
      WHERE q.status = 'published'
        AND datetime('now') BETWEEN datetime(q.start_at) AND datetime(q.end_at)
      ORDER BY q.start_at ASC
    `).all(studentId);

    return res.json({ quizzes });
  } catch (err) {
    console.error('Student quizzes error:', err);
    return res.status(500).json({ error: 'Failed to load available quizzes.' });
  }
});

// GET /api/student/quizzes/:id - Quiz instructions info
router.get('/quizzes/:id', (req, res) => {
  try {
    const quizId = req.params.id;
    const studentId = req.user.id;

    const quiz = db.prepare(`
      SELECT q.id, q.title, q.subject, q.description, q.duration_min, q.total_marks,
             q.passing_marks, q.start_at, q.end_at, q.status,
             (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
             a.id AS attempt_id, a.status AS attempt_status
      FROM quizzes q
      LEFT JOIN attempts a ON a.quiz_id = q.id AND a.student_id = ?
      WHERE q.id = ?
    `).get(studentId, quizId);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    if (quiz.status !== 'published') {
      return res.status(400).json({ error: 'This quiz is not currently published.' });
    }

    return res.json({ quiz });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load quiz instructions.' });
  }
});

// POST /api/student/quizzes/:id/start - Start or resume attempt
router.post('/quizzes/:id/start', (req, res) => {
  try {
    const quizId = req.params.id;
    const studentId = req.user.id;

    const quiz = db.prepare(`
      SELECT * FROM quizzes WHERE id = ?
    `).get(quizId);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    if (quiz.status !== 'published') {
      return res.status(400).json({ error: 'This quiz is not published.' });
    }

    // Check time window
    const now = new Date();
    const start = new Date(quiz.start_at);
    const end = new Date(quiz.end_at);
    if (now < start || now > end) {
      return res.status(400).json({ error: 'This quiz is not currently within its open schedule window.' });
    }

    // Check if attempt exists
    let attempt = db.prepare('SELECT * FROM attempts WHERE quiz_id = ? AND student_id = ?').get(quizId, studentId);

    if (attempt) {
      if (attempt.status === 'submitted') {
        return res.status(400).json({
          error: 'You have already completed this quiz.',
          completed: true,
          attemptId: attempt.id
        });
      }

      // Check remaining time for existing in_progress attempt
      const remainingSec = getRemainingSeconds(attempt.started_at, quiz.duration_min);
      if (remainingSec <= 0) {
        finalizeAttempt(attempt.id);
        return res.status(400).json({
          error: 'Time expired for this quiz.',
          completed: true,
          attemptId: attempt.id
        });
      }
    } else {
      // Create new attempt
      const result = db.prepare(`
        INSERT INTO attempts (quiz_id, student_id, started_at, total_marks, status)
        VALUES (?, ?, ?, ?, 'in_progress')
      `).run(quizId, studentId, new Date().toISOString(), quiz.total_marks);

      attempt = db.prepare('SELECT * FROM attempts WHERE id = ?').get(result.lastInsertRowid);
      logActivity(studentId, `Started Quiz: ${quiz.title}`);
    }

    // Fetch quiz questions WITHOUT correct_option
    const questions = db.prepare(`
      SELECT q.id, q.text, q.option_a, q.option_b, q.option_c, q.option_d, q.marks
      FROM quiz_questions qq
      JOIN questions q ON qq.question_id = q.id
      WHERE qq.quiz_id = ?
      ORDER BY q.id ASC
    `).all(quizId);

    // Fetch saved answers
    const savedAnswers = db.prepare(`
      SELECT question_id, selected_option
      FROM attempt_answers
      WHERE attempt_id = ?
    `).all(attempt.id);

    const answersMap = {};
    for (const a of savedAnswers) {
      answersMap[a.question_id] = a.selected_option;
    }

    const remainingSec = getRemainingSeconds(attempt.started_at, quiz.duration_min);

    return res.json({
      attemptId: attempt.id,
      quizTitle: quiz.title,
      subject: quiz.subject,
      durationMin: quiz.duration_min,
      remainingSeconds: Math.max(0, remainingSec),
      questions,
      savedAnswers: answersMap
    });
  } catch (err) {
    console.error('Start attempt error:', err);
    return res.status(500).json({ error: 'Failed to start or resume quiz attempt.' });
  }
});

// PUT /api/student/attempts/:id/answer - Save or clear answer
router.put('/attempts/:id/answer', (req, res) => {
  try {
    const attemptId = req.params.id;
    const studentId = req.user.id;
    const { question_id, selected_option } = req.body;

    const attempt = db.prepare(`
      SELECT a.*, q.duration_min 
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.id = ? AND a.student_id = ?
    `).get(attemptId, studentId);

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found or access denied.' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ error: 'Attempt has already been submitted.' });
    }

    // Check timer
    const remainingSec = getRemainingSeconds(attempt.started_at, attempt.duration_min);
    if (remainingSec <= 0) {
      finalizeAttempt(attempt.id);
      return res.status(400).json({
        error: 'Time expired! Your quiz was automatically submitted.',
        autoSubmitted: true,
        attemptId: attempt.id
      });
    }

    if (selected_option === null || selected_option === '') {
      // Clear answer
      db.prepare('DELETE FROM attempt_answers WHERE attempt_id = ? AND question_id = ?').run(attemptId, question_id);
      return res.json({ message: 'Answer cleared.' });
    }

    if (!['A', 'B', 'C', 'D'].includes(selected_option)) {
      return res.status(400).json({ error: 'Invalid option selected.' });
    }

    db.prepare(`
      INSERT INTO attempt_answers (attempt_id, question_id, selected_option)
      VALUES (?, ?, ?)
      ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected_option = excluded.selected_option
    `).run(attemptId, question_id, selected_option);

    return res.json({ message: 'Answer saved.' });
  } catch (err) {
    console.error('Save answer error:', err);
    return res.status(500).json({ error: 'Failed to save answer.' });
  }
});

// POST /api/student/attempts/:id/submit - Finalize attempt
router.post('/attempts/:id/submit', (req, res) => {
  try {
    const attemptId = req.params.id;
    const studentId = req.user.id;

    const attempt = db.prepare('SELECT * FROM attempts WHERE id = ? AND student_id = ?').get(attemptId, studentId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found or access denied.' });
    }

    if (attempt.status === 'submitted') {
      return res.json({ message: 'Attempt was already submitted.', attemptId });
    }

    const finalized = finalizeAttempt(attemptId);

    return res.json({
      message: 'Quiz submitted successfully.',
      attemptId: finalized.id
    });
  } catch (err) {
    console.error('Submit attempt error:', err);
    return res.status(500).json({ error: 'Failed to submit quiz.' });
  }
});

// GET /api/student/results/:attemptId - Quiz result card
router.get('/results/:attemptId', (req, res) => {
  try {
    const attemptId = req.params.attemptId;
    const studentId = req.user.id;

    const attempt = db.prepare(`
      SELECT a.*, q.title AS quiz_title, q.subject, q.passing_marks,
             (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS total_questions
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.id = ? AND a.student_id = ?
    `).get(attemptId, studentId);

    if (!attempt) {
      return res.status(404).json({ error: 'Result not found or access denied.' });
    }

    const percentage = attempt.total_marks > 0 ? ((attempt.score / attempt.total_marks) * 100).toFixed(1) : 0;
    const isPass = attempt.score >= attempt.passing_marks;

    return res.json({
      result: {
        ...attempt,
        percentage,
        pass: isPass,
        statusText: isPass ? 'PASS' : 'FAIL'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve quiz result.' });
  }
});

// GET /api/student/results/:attemptId/review - Question by question review
router.get('/results/:attemptId/review', (req, res) => {
  try {
    const attemptId = req.params.attemptId;
    const studentId = req.user.id;

    const attempt = db.prepare(`
      SELECT a.*, q.title AS quiz_title, q.subject, q.passing_marks
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.id = ? AND a.student_id = ?
    `).get(attemptId, studentId);

    if (!attempt) {
      return res.status(404).json({ error: 'Result review not found or access denied.' });
    }

    const questions = db.prepare(`
      SELECT q.id, q.text, q.option_a, q.option_b, q.option_c, q.option_d,
             q.correct_option, q.marks,
             aa.selected_option
      FROM quiz_questions qq
      JOIN questions q ON qq.question_id = q.id
      LEFT JOIN attempt_answers aa ON aa.question_id = q.id AND aa.attempt_id = ?
      WHERE qq.quiz_id = ?
      ORDER BY q.id ASC
    `).all(attemptId, attempt.quiz_id);

    const questionsWithEval = questions.map(q => {
      const isAnswered = !!q.selected_option;
      const isCorrect = isAnswered && q.selected_option === q.correct_option;
      return {
        ...q,
        isAnswered,
        isCorrect,
        statusText: !isAnswered ? 'Skipped' : (isCorrect ? 'Correct' : 'Wrong')
      };
    });

    return res.json({
      attempt,
      questions: questionsWithEval
    });
  } catch (err) {
    console.error('Student review error:', err);
    return res.status(500).json({ error: 'Failed to retrieve answer review.' });
  }
});

// GET /api/student/results - Results history with date filter
router.get('/results', (req, res) => {
  try {
    const studentId = req.user.id;
    const { from, to } = req.query;

    let whereClauses = ['a.student_id = ?', "a.status = 'submitted'"];
    let params = [studentId];

    if (from) {
      whereClauses.push('date(a.submitted_at) >= date(?)');
      params.push(from);
    }
    if (to) {
      whereClauses.push('date(a.submitted_at) <= date(?)');
      params.push(to);
    }

    const results = db.prepare(`
      SELECT a.id, a.submitted_at, a.score, a.total_marks,
             q.title AS quiz_title, q.passing_marks
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY a.submitted_at DESC
    `).all(...params);

    const formatted = results.map(r => {
      const percentage = r.total_marks > 0 ? ((r.score / r.total_marks) * 100).toFixed(1) : 0;
      const isPass = r.score >= r.passing_marks;
      return {
        ...r,
        percentage,
        pass: isPass,
        statusText: isPass ? 'Pass' : 'Fail',
        dateTaken: r.submitted_at ? r.submitted_at.slice(0, 10) : 'N/A'
      };
    });

    return res.json({ results: formatted });
  } catch (err) {
    console.error('Student results error:', err);
    return res.status(500).json({ error: 'Failed to retrieve results history.' });
  }
});

export default router;
