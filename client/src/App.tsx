import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Workspace } from '@/pages/Workspace';
import { PageView } from '@/pages/PageView';
import { Spinner } from '@/components/ui/Spinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated, setUser, token, logout } = useAuthStore();

  // Fetch current user on mount if authenticated
  const { data, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authAPI.getCurrentUser,
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error, logout]);

  // Setup WebSocket connection
  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = connectSocket(token);

      socket.on('connect', () => {
        console.log('✅ Connected to WebSocket');
      });

      socket.on('disconnect', () => {
        console.log('❌ Disconnected from WebSocket');
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [isAuthenticated, token]);

  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/page/:pageId"
          element={
            <ProtectedRoute>
              <PageView />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
