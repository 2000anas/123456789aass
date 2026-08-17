import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import EmployeeDetailPage from './pages/admin/EmployeeDetailPage';
import AttendancePage from './pages/admin/AttendancePage';
import SalariesPage from './pages/admin/SalariesPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';
import EmployeeDashboardPage from './pages/employee/EmployeeDashboardPage';
import EmployeeAttendancePage from './pages/employee/EmployeeAttendancePage';
import { setLocale } from './i18n';

setLocale('ar');

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/salaries" element={<SalariesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={['employee']} />}>
            <Route element={<AppLayout />}>
              <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
              <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </AuthProvider>
  );
}
