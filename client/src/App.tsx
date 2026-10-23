import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { QuestionBankPage } from './pages/teacher/QuestionBankPage';
import { ExamBuilderPage } from './pages/teacher/ExamBuilderPage';
import { ExamAnalyticsPage } from './pages/teacher/ExamAnalyticsPage';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamRunnerPage } from './pages/student/ExamRunnerPage';
import { ExamResultPage } from './pages/student/ExamResultPage';
import { StudentHistoryPage } from './pages/student/StudentHistoryPage';

import { AdminDashboard } from './pages/admin/AdminDashboard';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role-based root dashboard dispatcher
const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }
  if (user.role === 'teacher') {
    return <TeacherDashboard />;
  }
  return <StudentDashboard />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Standalone Fullscreen Exam Runner */}
          <Route
            path="/exam/:examId"
            element={
              <ProtectedRoute>
                <ExamRunnerPage />
              </ProtectedRoute>
            }
          />

          {/* Standard App Layout Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RoleBasedDashboard />} />

            {/* Teacher / Admin Routes */}
            <Route path="/teacher/questions" element={<QuestionBankPage />} />
            <Route path="/teacher/exams/new" element={<ExamBuilderPage />} />
            <Route path="/teacher/exams/:examId/analytics" element={<ExamAnalyticsPage />} />

            {/* Student Routes */}
            <Route path="/student/history" element={<StudentHistoryPage />} />
            <Route path="/attempts/:attemptId/result" element={<ExamResultPage />} />

            {/* Admin Routes */}
            <Route path="/admin/users" element={<AdminDashboard />} />
            <Route path="/admin/subjects" element={<AdminDashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
