import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { logActivity } from '../utils/logger.js';
import { convertToCSV } from '../utils/csv.js';

const router = express.Router();

router.use(authenticate, authorizeRoles('Teacher'));

// GET /api/teacher/stats
router.get('/stats', (req, res) => {
  try {
    const teacherId = req.user.id;
    const myQuestionsCount = db.prepare('SELECT COUNT(*) AS count FROM questions WHERE teacher_id = ?').get(teacherId).count;
    const myQuizzesCount = db.prepare('SELECT COUNT(*) AS count FROM quizzes WHERE teacher_id = ?').get(teacherId).count;
    
    const totalAttempts = db.prepare(`
      SELECT COUNT(*) AS count 
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE q.teacher_id = ?
    `).get(teacherId).count;

    const recentQuizzes = db.prepare(`
      SELECT id, title, subject, start_at, status
      FROM quizzes
      WHERE teacher_id = ?
      ORDER BY id DESC
      LIMIT 5
    `).all(teacherId);

    return res.json({
      stats: {
        myQuestions: myQuestionsCount,
        myQuizzes: myQuizzesCount,
        totalAttempts
      },
      recentQuizzes
    });
  } catch (err) {
    console.error('Teacher stats error:', err);
    return res.status(500).json({ error: 'Failed to load teacher stats.' });
  }
});

// GET /api/teacher/questions - List with search and subject filter
router.get('/questions', (req, res) => {
  try {
    const teacherId = req.user.id;
    const { search = '', subject = 'All' } = req.query;

    let whereClauses = ['teacher_id = ?'];
    let params = [teacherId];

    if (search.trim()) {
      whereClauses.push('(LOWER(text) LIKE ? OR LOWER(topic) LIKE ?)');
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term);
    }

    if (subject && subject !== 'All') {
      whereClauses.push('subject = ?');
      params.push(subject);
    }

    const questions = db.prepare(`
      SELECT id, teacher_id, subject, topic, text, option_a, option_b, option_c, option_d,
             correct_option, marks, difficulty
      FROM questions
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY id DESC
    `).all(...params);

    // Get unique subjects for filter dropdown
    const subjects = db.prepare('SELECT DISTINCT subject FROM questions WHERE teacher_id = ? ORDER BY subject ASC').all(teacherId).map(s => s.subject);

    return res.json({ questions, subjects });
  } catch (err) {
    console.error('Teacher questions error:', err);
    return res.status(500).json({ error: 'Failed to load questions.' });
  }
});

// GET /api/teacher/questions/:id
router.get('/questions/:id', (req, res) => {
  try {
    const question = db.prepare('SELECT * FROM questions WHERE id = ? AND teacher_id = ?').get(req.params.id, req.user.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found or access denied.' });
    }
    return res.json({ question });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve question.' });
  }
});

// POST /api/teacher/questions
router.post('/questions', (req, res) => {
  try {
    const { subject, topic, text, option_a, option_b, option_c, option_d, correct_option, marks, difficulty } = req.body;

    if (!subject || !topic || !text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.status(400).json({ error: 'All question fields are required.' });
    }

    if (!['A', 'B', 'C', 'D'].includes(correct_option)) {
      return res.status(400).json({ error: 'Correct option must be A, B, C, or D.' });
    }

    const marksNum = parseInt(marks, 10) || 1;
    const diff = ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium';

    const result = db.prepare(`
      INSERT INTO questions (teacher_id, subject, topic, text, option_a, option_b, option_c, option_d, correct_option, marks, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      subject.trim(),
      topic.trim(),
      text.trim(),
      option_a.trim(),
      option_b.trim(),
      option_c.trim(),
      option_d.trim(),
      correct_option,
      marksNum,
      diff
    );

    logActivity(req.user.id, `Added Question #${result.lastInsertRowid} (${subject.trim()})`);

    return res.status(201).json({
      message: 'Question created successfully.',
      questionId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Create question error:', err);
    return res.status(500).json({ error: 'Failed to create question.' });
  }
});

// PUT /api/teacher/questions/:id
router.put('/questions/:id', (req, res) => {
  try {
    const questionId = req.params.id;
    const existing = db.prepare('SELECT id FROM questions WHERE id = ? AND teacher_id = ?').get(questionId, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Question not found or access denied.' });
    }

    const { subject, topic, text, option_a, option_b, option_c, option_d, correct_option, marks, difficulty } = req.body;

    if (!subject || !topic || !text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.status(400).json({ error: 'All question fields are required.' });
    }

    const marksNum = parseInt(marks, 10) || 1;
    const diff = ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium';

    db.prepare(`
      UPDATE questions
      SET subject = ?, topic = ?, text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?,
          correct_option = ?, marks = ?, difficulty = ?
      WHERE id = ? AND teacher_id = ?
    `).run(
      subject.trim(),
      topic.trim(),
      text.trim(),
      option_a.trim(),
      option_b.trim(),
      option_c.trim(),
      option_d.trim(),
      correct_option,
      marksNum,
      diff,
      questionId,
      req.user.id
    );

    logActivity(req.user.id, `Updated Question #${questionId}`);

    return res.json({ message: 'Question updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update question.' });
  }
});

// DELETE /api/teacher/questions/:id
router.delete('/questions/:id', (req, res) => {
  try {
    const questionId = req.params.id;
    const existing = db.prepare('SELECT id FROM questions WHERE id = ? AND teacher_id = ?').get(questionId, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Question not found or access denied.' });
    }

    db.prepare('DELETE FROM questions WHERE id = ? AND teacher_id = ?').run(questionId, req.user.id);

    logActivity(req.user.id, `Deleted Question #${questionId}`);

    return res.json({ message: 'Question deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete question.' });
  }
});

// GET /api/teacher/quizzes
router.get('/quizzes', (req, res) => {
  try {
    const teacherId = req.user.id;
    const { subject = 'All', status = 'All' } = req.query;

    let whereClauses = ['q.teacher_id = ?'];
    let params = [teacherId];

    if (subject && subject !== 'All') {
      whereClauses.push('q.subject = ?');
      params.push(subject);
    }

    if (status && status !== 'All') {
      whereClauses.push('q.status = ?');
      params.push(status.toLowerCase());
    }

    const quizzes = db.prepare(`
      SELECT q.id, q.title, q.subject, q.duration_min, q.total_marks, q.passing_marks,
             q.start_at, q.end_at, q.status,
             (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
             (SELECT COUNT(*) FROM attempts WHERE quiz_id = q.id) AS attempt_count
      FROM quizzes q
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY q.id DESC
    `).all(...params);

    const subjects = db.prepare('SELECT DISTINCT subject FROM quizzes WHERE teacher_id = ? ORDER BY subject ASC').all(teacherId).map(s => s.subject);

    return res.json({ quizzes, subjects });
  } catch (err) {
    console.error('Teacher get quizzes error:', err);
    return res.status(500).json({ error: 'Failed to load quizzes.' });
  }
});

// GET /api/teacher/quizzes/:id - Details + student attempts + question bank
router.get('/quizzes/:id', (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = db.prepare(`
      SELECT q.*, (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count
      FROM quizzes q
      WHERE q.id = ? AND q.teacher_id = ?
    `).get(quizId, req.user.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found or access denied.' });
    }

    // Questions included in this quiz
    const quizQuestions = db.prepare(`
      SELECT q.id, q.subject, q.topic, q.text, q.marks, q.difficulty, q.correct_option
      FROM quiz_questions qq
      JOIN questions q ON qq.question_id = q.id
      WHERE qq.quiz_id = ?
    `).all(quizId);

    // Student attempt results
    const attempts = db.prepare(`
      SELECT a.id, a.started_at, a.submitted_at, a.score, a.total_marks,
             u.name AS student_name, u.email AS student_email, u.roll_number,
             ROUND((JULIANDAY(a.submitted_at) - JULIANDAY(a.started_at)) * 1440, 1) AS time_taken_mins
      FROM attempts a
      JOIN users u ON a.student_id = u.id
      WHERE a.quiz_id = ? AND a.status = 'submitted'
      ORDER BY a.submitted_at DESC
    `).all(quizId);

    const attemptsWithStats = attempts.map(a => {
      const percentage = a.total_marks > 0 ? ((a.score / a.total_marks) * 100).toFixed(1) : 0;
      const pass = a.score >= quiz.passing_marks;
      return {
        ...a,
        percentage,
        status: pass ? 'Pass' : 'Fail'
      };
    });

    return res.json({ quiz, questions: quizQuestions, attempts: attemptsWithStats });
  } catch (err) {
    console.error('Teacher get quiz details error:', err);
    return res.status(500).json({ error: 'Failed to retrieve quiz details.' });
  }
});

// POST /api/teacher/quizzes - Create Quiz
router.post('/quizzes', (req, res) => {
  try {
    const { title, subject, description, duration_min, passing_marks, start_at, end_at, question_ids = [] } = req.body;

    if (!title || !subject || !duration_min || !passing_marks || !start_at || !end_at) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!Array.isArray(question_ids) || question_ids.length === 0) {
      return res.status(400).json({ error: 'Please select at least 1 question for the quiz.' });
    }

    // Auto-sum total marks of selected questions
    const placeholders = question_ids.map(() => '?').join(',');
    const selectedQuestions = db.prepare(`
      SELECT id, marks FROM questions 
      WHERE id IN (${placeholders}) AND teacher_id = ?
    `).all(...question_ids, req.user.id);

    if (selectedQuestions.length !== question_ids.length) {
      return res.status(400).json({ error: 'Some selected questions are invalid or do not belong to you.' });
    }

    const calculatedTotalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
    const passMarksNum = parseInt(passing_marks, 10);

    if (passMarksNum > calculatedTotalMarks) {
      return res.status(400).json({ error: `Passing marks (${passMarksNum}) cannot exceed total marks (${calculatedTotalMarks}).` });
    }

    const insertQuiz = db.prepare(`
      INSERT INTO quizzes (teacher_id, title, subject, description, duration_min, total_marks, passing_marks, start_at, end_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `);

    const result = insertQuiz.run(
      req.user.id,
      title.trim(),
      subject.trim(),
      description ? description.trim() : '',
      parseInt(duration_min, 10),
      calculatedTotalMarks,
      passMarksNum,
      start_at,
      end_at
    );

    const quizId = result.lastInsertRowid;

    const insertQQ = db.prepare('INSERT INTO quiz_questions (quiz_id, question_id) VALUES (?, ?)');
    for (const qId of question_ids) {
      insertQQ.run(quizId, qId);
    }

    logActivity(req.user.id, `Created Quiz: ${title.trim()} (${calculatedTotalMarks} Marks)`);

    return res.status(201).json({
      message: 'Quiz created successfully.',
      quizId
    });
  } catch (err) {
    console.error('Create quiz error:', err);
    return res.status(500).json({ error: 'Failed to create quiz.' });
  }
});

// PUT /api/teacher/quizzes/:id - Edit Quiz
router.put('/quizzes/:id', (req, res) => {
  try {
    const quizId = req.params.id;
    const existing = db.prepare('SELECT * FROM quizzes WHERE id = ? AND teacher_id = ?').get(quizId, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Quiz not found or access denied.' });
    }

    // Business rule: Do not allow editing the questions of a quiz that already has attempts.
    const attemptCount = db.prepare('SELECT COUNT(*) AS count FROM attempts WHERE quiz_id = ?').get(quizId).count;

    const { title, subject, description, duration_min, passing_marks, start_at, end_at, question_ids } = req.body;

    if (!title || !subject || !duration_min || !passing_marks || !start_at || !end_at) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    let calculatedTotalMarks = existing.total_marks;

    if (question_ids && Array.isArray(question_ids)) {
      if (attemptCount > 0) {
        return res.status(400).json({ error: 'Cannot modify questions of a quiz that already has student attempts.' });
      }

      if (question_ids.length === 0) {
        return res.status(400).json({ error: 'A quiz must contain at least 1 question.' });
      }

      const placeholders = question_ids.map(() => '?').join(',');
      const selectedQuestions = db.prepare(`
        SELECT id, marks FROM questions 
        WHERE id IN (${placeholders}) AND teacher_id = ?
      `).all(...question_ids, req.user.id);

      calculatedTotalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

      // Replace quiz_questions
      db.prepare('DELETE FROM quiz_questions WHERE quiz_id = ?').run(quizId);
      const insertQQ = db.prepare('INSERT INTO quiz_questions (quiz_id, question_id) VALUES (?, ?)');
      for (const qId of question_ids) {
        insertQQ.run(quizId, qId);
      }
    }

    const passMarksNum = parseInt(passing_marks, 10);
    if (passMarksNum > calculatedTotalMarks) {
      return res.status(400).json({ error: `Passing marks (${passMarksNum}) cannot exceed total marks (${calculatedTotalMarks}).` });
    }

    db.prepare(`
      UPDATE quizzes
      SET title = ?, subject = ?, description = ?, duration_min = ?, total_marks = ?, passing_marks = ?,
          start_at = ?, end_at = ?
      WHERE id = ? AND teacher_id = ?
    `).run(
      title.trim(),
      subject.trim(),
      description ? description.trim() : '',
      parseInt(duration_min, 10),
      calculatedTotalMarks,
      passMarksNum,
      start_at,
      end_at,
      quizId,
      req.user.id
    );

    logActivity(req.user.id, `Updated Quiz: ${title.trim()} (#${quizId})`);

    return res.json({ message: 'Quiz updated successfully.' });
  } catch (err) {
    console.error('Update quiz error:', err);
    return res.status(500).json({ error: 'Failed to update quiz.' });
  }
});

// PATCH /api/teacher/quizzes/:id/publish - Toggle draft / published
router.patch('/quizzes/:id/publish', (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ? AND teacher_id = ?').get(quizId, req.user.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found or access denied.' });
    }

    // Business rule: A quiz needs at least 1 question before it can be published.
    const qCount = db.prepare('SELECT COUNT(*) AS count FROM quiz_questions WHERE quiz_id = ?').get(quizId).count;
    if (qCount === 0 && quiz.status !== 'published') {
      return res.status(400).json({ error: 'A quiz needs at least 1 question before it can be published.' });
    }

    const nextStatus = quiz.status === 'published' ? 'draft' : 'published';
    db.prepare('UPDATE quizzes SET status = ? WHERE id = ?').run(nextStatus, quizId);

    logActivity(req.user.id, `Changed Quiz #${quizId} status to ${nextStatus}`);

    return res.json({ message: `Quiz is now ${nextStatus}.`, status: nextStatus });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change quiz publish state.' });
  }
});

// DELETE /api/teacher/quizzes/:id
router.delete('/quizzes/:id', (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = db.prepare('SELECT title FROM quizzes WHERE id = ? AND teacher_id = ?').get(quizId, req.user.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found or access denied.' });
    }

    db.prepare('DELETE FROM quizzes WHERE id = ?').run(quizId);
    logActivity(req.user.id, `Deleted Quiz: ${quiz.title} (#${quizId})`);

    return res.json({ message: 'Quiz deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete quiz.' });
  }
});

// GET /api/teacher/quizzes/:id/results.csv - Export CSV of student attempts
router.get('/quizzes/:id/results.csv', (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ? AND teacher_id = ?').get(quizId, req.user.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found or access denied.' });
    }

    const attempts = db.prepare(`
      SELECT a.id, u.name AS student_name, u.roll_number, u.email,
             a.score, a.total_marks, a.correct, a.wrong, a.skipped, a.submitted_at,
             ROUND((JULIANDAY(a.submitted_at) - JULIANDAY(a.started_at)) * 1440, 1) AS time_taken_mins
      FROM attempts a
      JOIN users u ON a.student_id = u.id
      WHERE a.quiz_id = ? AND a.status = 'submitted'
      ORDER BY a.submitted_at DESC
    `).all(quizId);

    const rows = attempts.map(a => {
      const percentage = a.total_marks > 0 ? ((a.score / a.total_marks) * 100).toFixed(1) : 0;
      const pass = a.score >= quiz.passing_marks ? 'Pass' : 'Fail';
      return {
        student: a.student_name,
        roll_number: a.roll_number || 'N/A',
        email: a.email,
        score: `${a.score} / ${a.total_marks}`,
        percentage: `${percentage}%`,
        status: pass,
        time_taken: `${a.time_taken_mins || 0} mins`,
        submitted_at: a.submitted_at || 'N/A'
      };
    });

    const csvHeaders = [
      { label: 'Student', key: 'student' },
      { label: 'Roll Number', key: 'roll_number' },
      { label: 'Email', key: 'email' },
      { label: 'Score', key: 'score' },
      { label: 'Percentage', key: 'percentage' },
      { label: 'Status', key: 'status' },
      { label: 'Time Taken', key: 'time_taken' },
      { label: 'Submitted At', key: 'submitted_at' }
    ];

    const csvContent = convertToCSV(csvHeaders, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="quiz_${quizId}_results.csv"`);
    return res.send(csvContent);
  } catch (err) {
    console.error('Export CSV error:', err);
    return res.status(500).json({ error: 'Failed to export CSV.' });
  }
});

// GET /api/teacher/attempts/:id - Teacher view of student attempt review
router.get('/attempts/:id', (req, res) => {
  try {
    const attemptId = req.params.id;
    const attempt = db.prepare(`
      SELECT a.*, u.name AS student_name, u.email AS student_email, u.roll_number,
             q.title AS quiz_title, q.subject, q.passing_marks, q.teacher_id
      FROM attempts a
      JOIN users u ON a.student_id = u.id
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.id = ?
    `).get(attemptId);

    if (!attempt || attempt.teacher_id !== req.user.id) {
      return res.status(404).json({ error: 'Attempt not found or access denied.' });
    }

    // Answers review per question
    const questionsAndAnswers = db.prepare(`
      SELECT q.id, q.text, q.option_a, q.option_b, q.option_c, q.option_d,
             q.correct_option, q.marks,
             aa.selected_option
      FROM quiz_questions qq
      JOIN questions q ON qq.question_id = q.id
      LEFT JOIN attempt_answers aa ON aa.question_id = q.id AND aa.attempt_id = ?
      WHERE qq.quiz_id = ?
      ORDER BY q.id ASC
    `).all(attemptId, attempt.quiz_id);

    const questionsWithEval = questionsAndAnswers.map(q => {
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
    console.error('Teacher attempt review error:', err);
    return res.status(500).json({ error: 'Failed to retrieve attempt review.' });
  }
});

// GET /api/teacher/results - List of teacher's quizzes with attempt count & avg score
router.get('/results', (req, res) => {
  try {
    const teacherId = req.user.id;
    const quizResults = db.prepare(`
      SELECT q.id, q.title, q.subject, q.total_marks, q.passing_marks, q.status,
             COUNT(a.id) AS attempt_count,
             AVG(a.score) AS avg_score
      FROM quizzes q
      LEFT JOIN attempts a ON a.quiz_id = q.id AND a.status = 'submitted'
      WHERE q.teacher_id = ?
      GROUP BY q.id
      ORDER BY q.id DESC
    `).all(teacherId);

    const formatted = quizResults.map(q => ({
      ...q,
      avg_score: q.avg_score !== null ? Number(q.avg_score).toFixed(1) : 'N/A'
    }));

    return res.json({ results: formatted });
  } catch (err) {
    console.error('Teacher results summary error:', err);
    return res.status(500).json({ error: 'Failed to retrieve results summary.' });
  }
});

export default router;
