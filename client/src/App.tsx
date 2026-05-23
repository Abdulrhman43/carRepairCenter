import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useEffect, type ReactNode } from 'react';
import MainLayout from './layouts/MainLayout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';

import CustomersPage from './features/customers/CustomersPage';
import VehiclesPage from './features/vehicles/VehiclesPage';
import RepairOrdersPage from './features/orders/RepairOrdersPage';
import PaymentsPage from './features/payments/PaymentsPage';
import InventoryPage from './features/inventory/InventoryPage';
import ServicesPage from './features/services/ServicesPage';
import ReportsPage from './features/reports/ReportsPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { hydrate: hydrateAuth } = useAuthStore();
  const { hydrate: hydrateTheme } = useThemeStore();

  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
  }, [hydrateAuth, hydrateTheme]);

  return (
    <div className="grain-overlay">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/repair-orders" element={<RepairOrdersPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route
              path="/inventory"
              element={
                <AdminRoute>
                  <InventoryPage />
                </AdminRoute>
              }
            />
            <Route
              path="/services"
              element={
                <AdminRoute>
                  <ServicesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <AdminRoute>
                  <ReportsPage />
                </AdminRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
