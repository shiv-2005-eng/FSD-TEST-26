import bcrypt from 'bcryptjs';
import db, { initDatabase } from './database.js';
import { logActivity } from '../utils/logger.js';

export async function seed() {
  console.log('--- Starting Seed Process ---');
  initDatabase();

  // Clear existing data in reverse FK order
  db.exec(`
    DELETE FROM attempt_answers;
    DELETE FROM attempts;
    DELETE FROM quiz_questions;
    DELETE FROM quizzes;
    DELETE FROM questions;
    DELETE FROM activity_log;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN ('users', 'questions', 'quizzes', 'attempts', 'activity_log');
  `);

  const passwordHash = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  // 1. Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, roll_number, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const adminResult = insertUser.run('System Admin', 'admin@test.com', passwordHash, 'Admin', null, 'active');
  const teacherResult = insertUser.run('Ashish Bajpai', 'teacher@test.com', teacherHash, 'Teacher', null, 'active');
  const studentResult = insertUser.run('Shivam Sharma', 'student@test.com', studentHash, 'Student', 'STU-1001', 'active');
  const student2Result = insertUser.run('Shivam Kumar', 'shivam@test.com', studentHash, 'Student', 'STU-1002', 'active');

  const adminId = adminResult.lastInsertRowid;
  const teacherId = teacherResult.lastInsertRowid;
  const studentId = studentResult.lastInsertRowid;
  const student2Id = student2Result.lastInsertRowid;

  logActivity(adminId, 'Initialized System Data & Seed Records');
  logActivity(teacherId, 'Teacher Account Activated (Ashish Bajpai)');
  logActivity(studentId, 'Student Registered Account (Shivam Sharma)');
  logActivity(student2Id, 'Student Registered Account (Shivam Kumar)');

  // 2. Insert 20 Questions (10 CS, 10 Math) owned by the teacher
  const insertQuestion = db.prepare(`
    INSERT INTO questions (teacher_id, subject, topic, text, option_a, option_b, option_c, option_d, correct_option, marks, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const questionsData = [
    // 10 Computer Science Questions
    [teacherId, 'Computer Science', 'Architecture', 'Which of the following is NOT a high-level programming language?', 'Python', 'Java', 'Assembly Language', 'C++', 'C', 5, 'Medium'],
    [teacherId, 'Computer Science', 'Networking', 'What does HTTP stand for?', 'HyperText Transfer Protocol', 'HyperText Transmission Process', 'High Transfer Text Protocol', 'Hyperlink Text Technology Protocol', 'A', 2, 'Easy'],
    [teacherId, 'Computer Science', 'Algorithms', 'What is the time complexity of binary search on a sorted array of size n?', 'O(n)', 'O(log n)', 'O(n log n)', 'O(1)', 'B', 3, 'Medium'],
    [teacherId, 'Computer Science', 'Data Structures', 'Which data structure uses the LIFO (Last In First Out) principle?', 'Queue', 'Stack', 'Linked List', 'Tree', 'B', 2, 'Easy'],
    [teacherId, 'Computer Science', 'Databases', 'In relational databases, what does SQL stand for?', 'Simple Query Language', 'Structured Query Language', 'Standard Question Language', 'System Query Logic', 'B', 2, 'Easy'],
    [teacherId, 'Computer Science', 'Operating Systems', 'What is the main purpose of an operating system kernel?', 'To render user graphics', 'To bridge applications and data processing at hardware level', 'To compile high-level code', 'To browse the internet', 'B', 4, 'Hard'],
    [teacherId, 'Computer Science', 'Networking', 'Which standard port is used for HTTPS traffic?', '80', '21', '443', '8080', 'C', 2, 'Easy'],
    [teacherId, 'Computer Science', 'Algorithms', 'Which sorting algorithm has an average time complexity of O(n log n) and uses divide-and-conquer?', 'Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort', 'C', 3, 'Medium'],
    [teacherId, 'Computer Science', 'OOP', 'Which concept describes wrapping data and methods into a single unit?', 'Polymorphism', 'Encapsulation', 'Inheritance', 'Abstraction', 'B', 3, 'Medium'],
    [teacherId, 'Computer Science', 'Hardware', 'What does RAM stand for?', 'Read Access Memory', 'Random Access Memory', 'Rapid Action Module', 'Readily Accessible Memory', 'B', 2, 'Easy'],

    // 10 Mathematics Questions
    [teacherId, 'Mathematics', 'Arithmetic', 'What is the value of 5! (5 factorial)?', '20', '60', '120', '720', 'C', 2, 'Easy'],
    [teacherId, 'Mathematics', 'Algebra', 'Solve for x: 3x - 7 = 14', '5', '7', '6', '9', 'B', 3, 'Medium'],
    [teacherId, 'Mathematics', 'Calculus', 'What is the derivative of f(x) = x^3 with respect to x?', '3x^2', 'x^2', '3x', '6x', 'A', 3, 'Medium'],
    [teacherId, 'Mathematics', 'Geometry', 'What is the sum of the interior angles of a triangle?', '90 degrees', '180 degrees', '270 degrees', '360 degrees', 'B', 2, 'Easy'],
    [teacherId, 'Mathematics', 'Geometry', 'If a circle has a radius of 7 cm, what is its approximate circumference? (pi = 22/7)', '22 cm', '44 cm', '88 cm', '154 cm', 'B', 3, 'Medium'],
    [teacherId, 'Mathematics', 'Arithmetic', 'What is the square root of 256?', '14', '16', '18', '24', 'B', 2, 'Easy'],
    [teacherId, 'Mathematics', 'Logarithms', 'What is the value of log10(1000)?', '1', '2', '3', '10', 'C', 2, 'Easy'],
    [teacherId, 'Mathematics', 'Statistics', 'What is the median of the numbers 4, 1, 7, 3, 9?', '3', '4', '5', '7', 'B', 3, 'Medium'],
    [teacherId, 'Mathematics', 'Trigonometry', 'What is the hypotenuse of a right-angled triangle with legs of length 6 and 8?', '9', '10', '12', '14', 'B', 3, 'Medium'],
    [teacherId, 'Mathematics', 'Probability', 'What is the probability of rolling an even number on a fair six-sided die?', '1/6', '1/3', '1/2', '2/3', 'C', 2, 'Easy']
  ];

  const createdQuestionIds = [];
  for (const q of questionsData) {
    const res = insertQuestion.run(...q);
    createdQuestionIds.push(res.lastInsertRowid);
  }

  logActivity(teacherId, `Created 20 questions in Question Bank`);

  // 3. Create 1 Published Quiz using the 10 Computer Science Questions
  // Active window: Started yesterday, ends in 30 days
  const now = new Date();
  const startAt = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  const endAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

  const csQuestionIds = createdQuestionIds.slice(0, 10);
  const totalCsMarks = 5 + 2 + 3 + 2 + 2 + 4 + 2 + 3 + 3 + 2; // = 28
  const passingMarks = 14;

  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (teacher_id, title, subject, description, duration_min, total_marks, passing_marks, start_at, end_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const quizResult = insertQuiz.run(
    teacherId,
    'Computer Science Quiz 1',
    'Computer Science',
    'Covers computer architecture, operating systems, networking, and foundational data structures.',
    30,
    totalCsMarks,
    passingMarks,
    startAt,
    endAt,
    'published'
  );

  const quizId = quizResult.lastInsertRowid;

  const insertQuizQuestion = db.prepare(`
    INSERT INTO quiz_questions (quiz_id, question_id) VALUES (?, ?)
  `);

  for (const qId of csQuestionIds) {
    insertQuizQuestion.run(quizId, qId);
  }

  logActivity(teacherId, `Published Quiz: Computer Science Quiz 1 (${totalCsMarks} Marks)`);

  console.log('--- Seed Completed Successfully! ---');
  console.log('Demo Credentials:');
  console.log('Admin:     admin@test.com / admin123');
  console.log('Teacher:   teacher@test.com / teacher123 (Ashish Bajpai)');
  console.log('Student 1: student@test.com / student123 (Shivam Sharma)');
  console.log('Student 2: shivam@test.com / student123 (Shivam Kumar)');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed();
}
