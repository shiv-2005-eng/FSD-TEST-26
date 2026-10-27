# Online Test System - Login Credentials

Use these credentials to log in to the application at [http://localhost:3000/login](http://localhost:3000/login).

> **Note:** Ensure you select the matching **Role** from the dropdown on the login screen.

---

## 1. Administrator Account
- **Role:** `Admin`
- **Email:** `admin@test.com`
- **Password:** `admin123`
- **Name:** System Admin
- **Access:**
  - Admin Dashboard (`/admin/dashboard`)
  - Manage Users - Add/Edit/Block/Delete (`/admin/users`)
  - View All Quizzes across all teachers (`/admin/quizzes`)
  - All Student Results & CSV Export (`/admin/results`)

---

## 2. Teacher Account
- **Role:** `Teacher`
- **Email:** `teacher@test.com`
- **Password:** `teacher123`
- **Name:** Ashish Bajpai
- **Access:**
  - Teacher Dashboard (`/teacher/dashboard`)
  - Question Bank - Add/Edit/Delete MCQs (`/teacher/questions`)
  - Create & Edit Quizzes (`/teacher/quizzes/create`)
  - Quiz Details & Student Attempts Breakdown (`/teacher/quizzes/:id`)
  - Results Summary & Per-Quiz CSV Export (`/teacher/results`)

---

## 3. Student Accounts

### Account A (Default Student)
- **Role:** `Student`
- **Email:** `student@test.com`
- **Password:** `student123`
- **Name:** Shivam Sharma
- **Roll Number:** `STU-1001`
- **Access:**
  - Student Dashboard (`/student/dashboard`)
  - Available Quizzes & Instructions (`/student/quizzes`)
  - Live Exam with Server Timer (`/student/quizzes/:id/take`)
  - My Results & Score History (`/student/results`)
  - Question-by-Question Answer Review (`/student/attempts/:id/review`)

### Account B (Student)
- **Role:** `Student`
- **Email:** `shivamkumar5263727@gmail.com`
- **Password:** `123456`
- **Name:** Shivam Kumar
- **Roll Number:** `cs26`

### Account C (Student)
- **Role:** `Student`
- **Email:** `neha@test.com`
- **Password:** `password123`
- **Name:** Shivam Kumar
- **Roll Number:** `STU-5001`

---

## Quick Reference Table

| Role | Name | Email | Password | Roll Number | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Admin | `admin@test.com` | `admin123` | - | Active |
| **Teacher** | Ashish Bajpai | `teacher@test.com` | `teacher123` | - | Active |
| **Student** | Shivam Sharma | `student@test.com` | `student123` | STU-1001 | Active |
| **Student** | Shivam Kumar | `shivamkumar5263727@gmail.com` | `123456` | cs26 | Active |
| **Student** | Shivam Kumar | `neha@test.com` | `password123` | STU-5001 | Active |
