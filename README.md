# Online Test System (Intranet Web Application)

A full-stack, minimal, early-2000s intranet-style **Online Test System** built with **React JS (Vite)**, **React Router v6**, **Vanilla CSS**, **Node.js + Express**, and **SQLite (better-sqlite3)**.

Designed with a utilitarian, high-contrast intranet aesthetic (white background, `#f2f2f2` panels, navy `#1f3a5f` headers/primary buttons, 1px visible grid borders, square controls, and strict green/red Pass/Fail indicators).

---

## 1. Quick Start

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Launch

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```
   *(or run `npm install` in the root, `/server`, and `/client`)*

2. **Seed the database with real demo data:**
   ```bash
   npm run seed
   ```

3. **Start both Frontend and Backend concurrently:**
   ```bash
   npm run dev
   ```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001/api`

---

## 2. Demo User Credentials

The database comes pre-seeded with initial accounts, a question bank with 20 real questions across 2 subjects (Computer Science & Mathematics), and 1 published active quiz:

| Role | Email | Password | Role Dropdown Selection | Description |
|------|-------|----------|-------------------------|-------------|
| **Admin** | `admin@test.com` | `admin123` | **Admin** | Full system control, user management, global quiz and results audits |
| **Teacher** | `teacher@test.com` | `teacher123` | **Teacher** | Question bank creator, quiz authoring, attempt grading & reviews |
| **Student** | `student@test.com` | `student123` | **Student** | Examination taker, live server timer, instant scoring & review |

*Note: New students can also self-register directly via the **Register** link on the login page.*

---

## 3. Technology Stack & Design System

- **Frontend**:
  - React 18 (Vite)
  - React Router v6
  - AuthContext for session management & token persistence
  - Zero UI libraries (Pure CSS with 1px borders, square controls, no shadows/gradients/animations)
- **Backend**:
  - Node.js & Express
  - SQLite via `better-sqlite3` (with foreign keys and cascade deletes enabled)
  - `bcryptjs` password hashing
  - `jsonwebtoken` (JWT) authentication
- **Proxy**:
  - Vite dev server proxies `/api` requests directly to Express (`http://localhost:5001`).

---

## 4. Project Structure

```
/
├── package.json               # Root scripts: dev, seed, install:all, build
├── README.md                  # Documentation and API references
├── TEST_CHECKLIST.md          # Manual testing verification report
├── server/
│   ├── package.json
│   ├── test_system.db         # SQLite database file
│   └── src/
│       ├── index.js           # Server entrypoint and route mounting
│       ├── db/
│       │   ├── database.js    # Schema setup & better-sqlite3 initialization
│       │   └── seed.js        # Seed script for users, questions, quizzes
│       ├── middleware/
│       │   ├── auth.js        # JWT validation & active user status verification
│       │   └── roles.js       # Role-based route guard
│       ├── routes/
│       │   ├── auth.js        # /api/auth (login, register, me, change-password)
│       │   ├── admin.js       # /api/admin (stats, users, quizzes, results, CSV)
│       │   ├── teacher.js     # /api/teacher (questions, quizzes, publish, reviews)
│       │   └── student.js     # /api/student (quizzes, attempt, timer, submit, review)
│       └── utils/
│           ├── logger.js      # Activity logging utility
│           └── csv.js         # CSV export formatter
└── client/
    ├── package.json
    ├── vite.config.js         # Proxy configuration
    ├── index.html
    └── src/
        ├── index.css          # Early-2000s global intranet stylesheet
        ├── main.jsx           # Application bootstrapper
        ├── App.jsx            # Router and route guard configuration
        ├── context/
        │   └── AuthContext.jsx # Auth state management
        ├── services/
        │   └── api.js         # Authenticated API fetch client
        ├── components/
        │   ├── Layout.jsx     # Shared header + role sidebar + content
        │   ├── ProtectedRoute.jsx # Route authentication & role redirect guards
        │   └── Modal.jsx      # Confirmation modal dialog
        └── pages/
            ├── auth/          # Login, Register
            ├── shared/        # Profile, Unauthorized, NotFound
            ├── admin/         # AdminDashboard, ManageUsers, AddEditUser, ManageQuizzes, AdminQuizDetails, AdminAllResults
            ├── teacher/       # TeacherDashboard, QuestionBank, AddEditQuestion, CreateEditQuiz, TeacherQuizzes, TeacherQuizDetails, TeacherAttemptReview, TeacherResults
            └── student/       # StudentDashboard, AvailableQuizzes, QuizInstructions, AttendQuiz, QuizResult, StudentResultsHistory, StudentAnswerReview
```

---

## 5. REST API Endpoints

### Auth (`/api/auth`)
- `POST /api/auth/login` - Authenticate user; requires matching role selection
- `POST /api/auth/register` - Student self-registration (name, email, roll number, password)
- `GET /api/auth/me` - Fetch currently authenticated user details
- `POST /api/auth/change-password` - Verify old password and set new password

### Admin (`/api/admin`)
- `GET /api/admin/stats` - Metric counts & recent activity log
- `GET /api/admin/users` - Paginated user list with role & text search
- `POST /api/admin/users` - Create user
- `GET /api/admin/users/:id` - Fetch user details
- `PUT /api/admin/users/:id` - Update user
- `PATCH /api/admin/users/:id/status` - Block / unblock user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/quizzes` - List all quizzes across all teachers
- `GET /api/admin/quizzes/:id` - Read-only quiz details & student attempts
- `DELETE /api/admin/quizzes/:id` - Delete quiz
- `GET /api/admin/results` - Filtered test attempts list with search & pagination
- `GET /api/admin/results?format=csv` - Download all results as CSV

### Teacher (`/api/teacher`)
- `GET /api/teacher/stats` - Question, quiz, and attempt statistics
- `GET /api/teacher/questions` - Teacher's question bank with search & subject filter
- `POST /api/teacher/questions` - Create new question
- `GET /api/teacher/questions/:id` - Fetch question details
- `PUT /api/teacher/questions/:id` - Edit question
- `DELETE /api/teacher/questions/:id` - Delete question
- `GET /api/teacher/quizzes` - Teacher's quizzes with subject and status filters
- `POST /api/teacher/quizzes` - Create quiz with auto-summed marks
- `GET /api/teacher/quizzes/:id` - Quiz details, questions list & student attempts
- `PUT /api/teacher/quizzes/:id` - Edit quiz details/questions (locked if attempts exist)
- `PATCH /api/teacher/quizzes/:id/publish` - Toggle quiz between draft and published
- `DELETE /api/teacher/quizzes/:id` - Delete quiz
- `GET /api/teacher/quizzes/:id/results.csv` - Download quiz attempt results as CSV
- `GET /api/teacher/attempts/:id` - Review student attempt with answer evaluation
- `GET /api/teacher/results` - Summary of quizzes with attempt counts and avg scores

### Student (`/api/student`)
- `GET /api/student/stats` - Quizzes attempted, average score %, pending quizzes
- `GET /api/student/quizzes` - Active published quizzes inside date window
- `GET /api/student/quizzes/:id` - Quiz instruction details
- `POST /api/student/quizzes/:id/start` - Start or resume quiz attempt (server timer)
- `PUT /api/student/attempts/:id/answer` - Save or clear answer (enforces server timer)
- `POST /api/student/attempts/:id/submit` - Finalize attempt and grade server-side
- `GET /api/student/results` - Student's completed test history with date filter
- `GET /api/student/results/:attemptId` - Score breakdown & PASS/FAIL card
- `GET /api/student/results/:attemptId/review` - Question review comparing selected vs correct answer
