import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

// Auth Pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

// Shared Pages
import Profile from './pages/shared/Profile.jsx';
import Unauthorized from './pages/shared/Unauthorized.jsx';
import NotFound from './pages/shared/NotFound.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import AddEditUser from './pages/admin/AddEditUser.jsx';
import ManageQuizzes from './pages/admin/ManageQuizzes.jsx';
import AdminQuizDetails from './pages/admin/AdminQuizDetails.jsx';
import AdminAllResults from './pages/admin/AdminAllResults.jsx';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx';
import QuestionBank from './pages/teacher/QuestionBank.jsx';
import AddEditQuestion from './pages/teacher/AddEditQuestion.jsx';
import CreateEditQuiz from './pages/teacher/CreateEditQuiz.jsx';
import TeacherQuizzes from './pages/teacher/TeacherQuizzes.jsx';
import TeacherQuizDetails from './pages/teacher/TeacherQuizDetails.jsx';
import TeacherAttemptReview from './pages/teacher/TeacherAttemptReview.jsx';
import TeacherResults from './pages/teacher/TeacherResults.jsx';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import AvailableQuizzes from './pages/student/AvailableQuizzes.jsx';
import QuizInstructions from './pages/student/QuizInstructions.jsx';
import AttendQuiz from './pages/student/AttendQuiz.jsx';
import QuizResult from './pages/student/QuizResult.jsx';
import StudentResultsHistory from './pages/student/StudentResultsHistory.jsx';
import StudentAnswerReview from './pages/student/StudentAnswerReview.jsx';

// Root redirect component
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'Teacher') return <Navigate to="/teacher/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Shared Authenticated Routes */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><ManageUsers /></ProtectedRoute>} />
      <Route path="/admin/users/new" element={<ProtectedRoute allowedRoles={['Admin']}><AddEditUser /></ProtectedRoute>} />
      <Route path="/admin/users/:id/edit" element={<ProtectedRoute allowedRoles={['Admin']}><AddEditUser /></ProtectedRoute>} />
      <Route path="/admin/quizzes" element={<ProtectedRoute allowedRoles={['Admin']}><ManageQuizzes /></ProtectedRoute>} />
      <Route path="/admin/quizzes/:id" element={<ProtectedRoute allowedRoles={['Admin']}><AdminQuizDetails /></ProtectedRoute>} />
      <Route path="/admin/results" element={<ProtectedRoute allowedRoles={['Admin']}><AdminAllResults /></ProtectedRoute>} />

      {/* Teacher Routes */}
      <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['Teacher']}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/questions" element={<ProtectedRoute allowedRoles={['Teacher']}><QuestionBank /></ProtectedRoute>} />
      <Route path="/teacher/questions/new" element={<ProtectedRoute allowedRoles={['Teacher']}><AddEditQuestion /></ProtectedRoute>} />
      <Route path="/teacher/questions/:id/edit" element={<ProtectedRoute allowedRoles={['Teacher']}><AddEditQuestion /></ProtectedRoute>} />
      <Route path="/teacher/quizzes/new" element={<ProtectedRoute allowedRoles={['Teacher']}><CreateEditQuiz /></ProtectedRoute>} />
      <Route path="/teacher/quizzes" element={<ProtectedRoute allowedRoles={['Teacher']}><TeacherQuizzes /></ProtectedRoute>} />
      <Route path="/teacher/quizzes/:id/edit" element={<ProtectedRoute allowedRoles={['Teacher']}><CreateEditQuiz /></ProtectedRoute>} />
      <Route path="/teacher/quizzes/:id" element={<ProtectedRoute allowedRoles={['Teacher']}><TeacherQuizDetails /></ProtectedRoute>} />
      <Route path="/teacher/attempts/:attemptId" element={<ProtectedRoute allowedRoles={['Teacher']}><TeacherAttemptReview /></ProtectedRoute>} />
      <Route path="/teacher/results" element={<ProtectedRoute allowedRoles={['Teacher']}><TeacherResults /></ProtectedRoute>} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['Student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/quizzes" element={<ProtectedRoute allowedRoles={['Student']}><AvailableQuizzes /></ProtectedRoute>} />
      <Route path="/student/quizzes/:quizId/instructions" element={<ProtectedRoute allowedRoles={['Student']}><QuizInstructions /></ProtectedRoute>} />
      <Route path="/student/quizzes/:quizId/attempt" element={<ProtectedRoute allowedRoles={['Student']}><AttendQuiz /></ProtectedRoute>} />
      <Route path="/student/results/:attemptId" element={<ProtectedRoute allowedRoles={['Student']}><QuizResult /></ProtectedRoute>} />
      <Route path="/student/results" element={<ProtectedRoute allowedRoles={['Student']}><StudentResultsHistory /></ProtectedRoute>} />
      <Route path="/student/results/:attemptId/review" element={<ProtectedRoute allowedRoles={['Student']}><StudentAnswerReview /></ProtectedRoute>} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
