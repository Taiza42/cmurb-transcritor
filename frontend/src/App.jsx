import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import TranscriptionPage from './pages/TranscriptionPage';
import UserManagementPage from './pages/UserManagementPage';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{
                 className: 'dark:bg-gray-800 dark:text-white',
                 style: { borderRadius: '10px', background: '#333', color: '#fff' },
                 success: { style: { background: '#10B981' }, iconTheme: { primary: 'white', secondary: '#10B981' } },
                 error: { style: { background: '#EF4444' }, iconTheme: { primary: 'white', secondary: '#EF4444' } },
             }} />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
                <ProtectedRoute>
                  <TranscriptionPage />
                </ProtectedRoute>
              }
            />
<Route path="/acessos" element={
                <ProtectedRoute adminOnly={true}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

