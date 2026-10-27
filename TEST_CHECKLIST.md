# Online Test System - Acceptance Test Checklist

Comprehensive verification report of manual and automated end-to-end tests across all roles and system components.

---

## 1. Authentication & Public Flow

- [x] **Login Interface (`/login`)**
  - Minimal intranet aesthetic matches screenshot (Navy top bar, centered grey form, square inputs).
  - Validated role match: selecting "Teacher" while entering student credentials produces an inline role mismatch error.
  - Blocked user check: blocked account login attempt produces "Your account is blocked" message.
  - Link "New student? Register here" navigates to `/register`.

- [x] **Student Registration (`/register`)**
  - Form fields: Full Name, Email, Roll Number, Password, Confirm Password.
  - Password mismatch validation triggers inline error message.
  - Submitting creates student account with role `Student` and status `active`.
  - Redirects back to `/login?registered=true` displaying green confirmation message.

---

## 2. Student Workflow

- [x] **Student Dashboard (`/student/dashboard`)**
  - Header displays student name (`Shivam Sharma`).
  - Stat boxes show: Quizzes Attempted, Average Score (%), Pending Quizzes.
  - Upcoming Quizzes table displays active published quizzes; title links to Instructions.
  - Sidebar links: Dashboard, Available Quizzes, My Results, Profile, Logout.

- [x] **Available Quizzes (`/student/quizzes`)**
  - Shows active published quizzes within valid start/end dates.
  - Completed quizzes show "Completed" with a direct link to result details.
  - Unattempted quizzes display "Start Quiz" button leading to instructions.

- [x] **Quiz Instructions (`/student/quizzes/:id/instructions`)**
  - Displays quiz duration, total marks, passing marks, and exam guidelines.
  - "Start Test" button is disabled until the agreement checkbox is checked.
  - Checking the box enables "Start Test" and navigates to the exam interface.

- [x] **Attend Quiz (`/student/quizzes/:id/attempt`)**
  - Header: Displays Quiz Title and server-synchronized countdown timer (`Time Left: HH:MM:SS`).
  - One question displayed at a time with radio options A-D.
  - Previous and Next buttons correctly traverse questions.
  - Clear Answer button removes selected radio option and updates server immediately.
  - Question Palette:
    - Numbered square buttons 1 to N.
    - Answered questions show green checkmark `✓` and green background.
    - Active question highlighted with thick 2px black border.
    - Clicking any palette button jumps directly to that question.
  - Server timer resilience: refreshing page mid-test successfully restores saved answers and remaining countdown.
  - Submit Test button triggers modal confirmation: *"You have answered X of N questions. Are you sure you want to submit?"*.
  - Auto-submit triggers when countdown timer reaches `00:00:00`.

- [x] **Quiz Result (`/student/results/:attemptId`)**
  - Result card matches mockup: Total Questions, Correct, Wrong, Skipped, Score, Percentage.
  - Pass shown in green text; Fail shown in red text.
  - Buttons: `[ View Answers ]` and `[ Back to Dashboard ]`.

- [x] **Answer Review (`/student/results/:attemptId/review`)**
  - Stacked question panels showing Question text, Options A-D.
  - Displays Student Selected option vs Correct Answer.
  - Tagged status: `[CORRECT]`, `[WRONG]`, or `[SKIPPED]`.

- [x] **My Results History (`/student/results`)**
  - Table showing past completed attempts with Date Taken, Score, Percentage, Status (Pass/Fail).
  - Date filter (From - To) functions correctly.
  - "View Details" link opens specific Quiz Result card.

---

## 3. Teacher Workflow

- [x] **Teacher Dashboard (`/teacher/dashboard`)**
  - Header displays `ONLINE TEST SYSTEM - Teacher Portal` and teacher name (`Ashish Bajpai`).
  - Stat boxes: My Questions, My Quizzes, Total Attempts.
  - "My Recent Quizzes" table with title links to quiz details.
  - Sidebar links: Dashboard, Question Bank, Add Question, Create Quiz, View Quizzes, Results, Profile, Logout.

- [x] **Question Bank (`/teacher/questions`)**
  - Displays list of 20 pre-seeded questions.
  - Subject filter dropdown and keyword search input filter questions dynamically.
  - Checkboxes enable selecting questions; "Add Selected to Quiz" navigates to `/teacher/quizzes/new` with preselected question IDs.
  - Delete question modal confirms removal.

- [x] **Add / Edit Question (`/teacher/questions/new`, `/teacher/questions/:id/edit`)**
  - Subject, Topic, Question Text, Options A-D, Correct Answer (radio A-D), Marks, Difficulty (Easy/Medium/Hard).
  - Form validation requires all fields.
  - Edit question pre-populates existing values and updates database.

- [x] **Create / Edit Quiz (`/teacher/quizzes/new`, `/teacher/quizzes/:id/edit`)**
  - Title, Subject, Description, Duration, Passing Marks, Start & End Date/Time.
  - Question Bank selection table allows picking questions.
  - Total Marks automatically sums up the marks of all selected questions.
  - Validation ensures passing marks <= total marks and at least 1 question selected.
  - Business rule verified: Editing questions on a quiz with existing student attempts is blocked.

- [x] **View Quizzes (`/teacher/quizzes`)**
  - Table: Title, Subject, Duration, Questions, Start, End, Status, Actions.
  - Publish / Unpublish action toggles status between `draft` and `published`.
  - Delete with confirmation.
  - `[ + Create New Quiz ]` button navigates to quiz creation form.

- [x] **Quiz Details & Student Attempts (`/teacher/quizzes/:id`)**
  - Info box displays metadata (Title, Subject, Duration, Total Marks, Passing Marks, Status).
  - Student Attempt Results table lists attempts with Student name, Score, Percentage, Status, Time Taken, and Submitted At.
  - "Export to CSV" triggers browser download of `quiz_:id_student_attempts.csv`.
  - Student name links directly to the detailed student attempt review (`/teacher/attempts/:attemptId`).

- [x] **Teacher Results Overview (`/teacher/results`)**
  - Summary table of all teacher's quizzes showing total attempt counts and calculated average scores.
  - View Details links to individual quiz results.

---

## 4. Admin Workflow

- [x] **Admin Dashboard (`/admin/dashboard`)**
  - Header displays `ONLINE TEST SYSTEM - Admin Portal` and admin name (`System Admin`).
  - Stat boxes (6 tiles): Total Students, Total Teachers, Total Quizzes, Active Quizzes, Attempts Today, System Status (Online).
  - "Recent Activity" table with real-time audit logs of all registrations, logins, quiz creation, and submissions.
  - Sidebar links: Dashboard, Manage Users, Manage Quizzes, All Results, Profile, Logout.

- [x] **Manage Users (`/admin/users`)**
  - User table lists ID, Name, Email, Role, Status, Actions (`Edit | Block/Unblock | Delete`).
  - Search input and Role filter (All / Admin / Teacher / Student) filter the table.
  - Pagination (10 per page): "Showing 1-10 of N users. Prev 1 2 Next".
  - Self-action protection: Admin cannot block or delete their own account (buttons disabled).
  - Block/Unblock action toggles user status and invalidates active sessions on subsequent API calls.
  - Delete confirmation modal safely removes user and cascades relationships.

- [x] **Add / Edit User (`/admin/users/new`, `/admin/users/:id/edit`)**
  - Full Name*, Email*, Role* (Admin / Teacher / Student), Password*, Status* (Active / Blocked), Roll Number.
  - Email uniqueness enforced.

- [x] **Manage Quizzes (`/admin/quizzes`)**
  - Global overview of all quizzes created across all teachers, including Teacher name column.
  - View action opens read-only quiz details and student results.
  - Delete action confirms and deletes quiz.

- [x] **All Results (`/admin/results`)**
  - Master examination results table: Student, Quiz, Date, Score, Total, Percentage, Status (Pass/Fail).
  - Select Quiz dropdown and Student search input filter results.
  - Pagination controls navigate between pages.
  - "Export CSV" generates and downloads `all_quiz_results.csv`.

---

## 5. Security & System Rules Verification

- [x] **Server-side Grading**: Correct answers are omitted from the student `/start` payload and evaluated strictly on the backend.
- [x] **Server Timer**: Remaining time is calculated on the server using UTC timestamps; expired attempts reject answers and auto-finalize.
- [x] **Single Attempt Enforcement**: Unique constraint on `attempts(quiz_id, student_id)` prevents repeat attempts.
- [x] **Route Guards**: Unauthenticated users visiting protected routes are redirected to `/login`. Role mismatches redirect to `/unauthorized`.
- [x] **Password Protection**: Passwords hashed with `bcryptjs` (salt rounds 10); hashes never sent in API responses.
- [x] **Audit Trail**: Key actions (login, register, user create/block, quiz create/publish, quiz submit) logged to `activity_log`.
