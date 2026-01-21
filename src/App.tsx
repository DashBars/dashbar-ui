import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { EventsListPage } from './pages/EventsListPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { EventsBarsPage } from './pages/EventsBarsPage';
import { SuppliersAndInventoryPage } from './pages/SuppliersAndInventoryPage';
import { VenuesPage } from './pages/VenuesPage';
import { BarInventoryPage } from './pages/BarInventoryPage';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/events' : '/login'} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={<RootRedirect />}
            />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/suppliers" element={<SuppliersAndInventoryPage />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/events" element={<EventsListPage />} />
              <Route path="/events/:eventId" element={<EventDetailsPage />} />
              <Route path="/events/:eventId/bars/:barId/inventory" element={<BarInventoryPage />} />
              <Route path="/events/:eventId/bars" element={<EventsBarsPage />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
