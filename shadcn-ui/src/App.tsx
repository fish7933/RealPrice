import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FreightProvider } from '@/contexts/FreightContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Index from './pages/Index';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Calculator from './pages/Calculator';
import UserManagement from './pages/UserManagement';
import ProfileSettings from './pages/ProfileSettings';
import Migration from './pages/Migration';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// Clear cache on app load
const clearCache = async () => {
  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    }

    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('All service workers unregistered');
    }

    // Clear localStorage version check
    const currentVersion = import.meta.env.VITE_APP_VERSION || Date.now().toString();
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion !== currentVersion) {
      console.log('Version mismatch detected, clearing localStorage');
      // Keep auth data but clear other cached data
      const authData = localStorage.getItem('auth_user');
      localStorage.clear();
      if (authData) {
        localStorage.setItem('auth_user', authData);
      }
      localStorage.setItem('app_version', currentVersion);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Admin/Superadmin Only Route
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

// Dashboard Route - redirects based on role
function DashboardRoute() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role === 'admin' || user.role === 'superadmin') {
    return <AdminDashboard />;
  }
  
  return <UserDashboard />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/migration" element={<Migration />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calculator"
        element={
          <ProtectedRoute>
            <Calculator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  // Clear cache on mount
  useEffect(() => {
    clearCache();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <FreightProvider>
                <AppRoutes />
              </FreightProvider>
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;