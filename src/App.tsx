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
import { BarManagementPage } from './pages/BarManagementPage';
import { BarTabRedirect } from './pages/BarTabRedirect';
import { ReportsPage } from './pages/ReportsPage';
import { AssistantPage } from './pages/AssistantPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { POSLoginPage, POSKioskPage, POSReceiptPage } from './pages/pos';
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
            {/* POS Routes - Outside protected routes, uses POS token auth */}
            <Route path="/pos/login" element={<POSLoginPage />} />
            <Route path="/pos/:posnetId/kiosk" element={<POSKioskPage />} />
            <Route path="/pos/:posnetId/receipt/:saleId" element={<POSReceiptPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/suppliers" element={<SuppliersAndInventoryPage />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/events" element={<EventsListPage />} />
              <Route path="/events/:eventId" element={<EventDetailsPage />} />
              <Route path="/events/:eventId/bars/:barId" element={<BarManagementPage />} />
              {/* Legacy deep-links -> redirect to new bar management tabs */}
              <Route path="/events/:eventId/bars/:barId/stock" element={<BarTabRedirect tab="stock" />} />
              <Route path="/events/:eventId/bars/:barId/recipes" element={<BarTabRedirect tab="recipes" />} />
              <Route path="/events/:eventId/bars/:barId/pos" element={<BarTabRedirect tab="pos" />} />
              <Route path="/events/:eventId/bars/:barId/overview" element={<BarTabRedirect tab="overview" />} />
              <Route path="/events/:eventId/bars/:barId/inventory" element={<BarInventoryPage />} />
              <Route path="/events/:eventId/bars" element={<EventsBarsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
