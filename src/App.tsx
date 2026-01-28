import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from './stores/authStore';
import { useOnlineStatus } from './hooks/useRealtime';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { SearchPage } from './pages/SearchPage';
import { StatusPage } from './pages/StatusPage';
import { RandomPage } from './pages/RandomPage';
import { SettingsPage } from './pages/SettingsPage';
import { StoragePage } from './pages/StoragePage';
import { HelpSupportPage } from './pages/HelpSupportPage';

// Components
import { BottomNavigation } from './components/common/BottomNavigation';
import { ProtectedRoute } from './components/common/ProtectedRoute';

function AppContent() {
  const { isAuthenticated, isLoading, refreshUser } = useAuthStore();
  const { applyTheme } = useThemeStore();

  // Initialize auth on mount
  useEffect(() => {
    refreshUser();
    applyTheme();
  }, [refreshUser, applyTheme]);

  // Online status tracking
  useOnlineStatus();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading Kutx Chat...</p>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/status"
          element={
            <ProtectedRoute>
              <StatusPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/random"
          element={
            <ProtectedRoute>
              <RandomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/storage"
          element={
            <ProtectedRoute>
              <StoragePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/help"
          element={
            <ProtectedRoute>
              <HelpSupportPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Bottom Navigation (only for authenticated users) */}
      {isAuthenticated && <BottomNavigation />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
