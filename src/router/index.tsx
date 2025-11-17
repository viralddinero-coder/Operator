import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HealthPage from '../pages/HealthPage';
import Layout from '../components/Layout/Layout';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import DevBootstrapAdmin from '../pages/DevBootstrapAdmin';
import ProfilePage from '../pages/ProfilePage';
import ChatPage from '../pages/ChatPage';
import SearchPage from '../pages/SearchPage';
import PurchaseCoinsPage from '../pages/PurchaseCoinsPage';
import SettingsPage from '../pages/SettingsPage';
import RegisterPage from '../pages/RegisterPage';
import { ProtectedRoute, AuthRoute } from '../components/Auth/ProtectedRoute';

// Operator Panel Components
import OperatorHeader from '../components/Operator/OperatorHeader';
// OperatorSidebar removed (header navigation only)
import OperatorDashboard from '../components/Operator/OperatorDashboard';
import OperatorChatPage from '../components/Operator/OperatorChatPage';
import OperatorProfilesPage from '../components/Operator/OperatorProfilesPage';
import OperatorSettings from '../components/Operator/OperatorSettings';

// Admin Panel Components
import AdminHeader from '../components/Admin/AdminHeader';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminDashboard from '../components/Admin/AdminDashboard';
import SystemSettings from '../components/Admin/SystemSettings';
import ChatMonitoring from '../components/Admin/ChatMonitoring';
import { PhotoModeration } from '../components/Admin/PhotoModeration';
import AdminSitesPage from '../components/Admin/AdminSitesPage';
import AdminOperatorsPage from '../components/Admin/AdminOperatorsPage';
import AdminUsersPage from '../components/Admin/AdminUsersPage';
import AdminTransactionsPage from '../components/Admin/AdminTransactionsPage';
import AdminAffiliatesPage from '../components/Admin/AdminAffiliatesPage';
import AdminProfilesPage from '../components/Admin/AdminProfilesPage';
import AdminCoinPackagesPage from '../components/Admin/AdminCoinPackagesPage';
import AdminMassMessagePage from '../components/Admin/AdminMassMessagePage';

// Layout components for operator and admin panels
const OperatorLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <OperatorHeader />
      <main className="flex-1">
        <OperatorDashboard />
      </main>
    </div>
  );
};

import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';

const AdminLayout: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <AdminHeader />
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  </div>
);

const DevLogin: React.FC<{ role: 'user' | 'operator' | 'admin' }> = ({ role }) => {
  const { setUser, setProfile } = useAuthStore();
  const navigate = useNavigate();
  useEffect(() => {
    const mockUser = {
      id: `dev-${role}`,
      email: `${role}@local`,
      name: role,
      role,
      is_verified: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any;
    setUser(mockUser);
    setProfile(null);
    if (role === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (role === 'operator') navigate('/operator', { replace: true });
    else navigate('/', { replace: true });
  }, [role, setUser, setProfile, navigate]);
  return null;
};

const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
const isAdminDomain = hostname.startsWith('admin.');
const isOperatorDomain = hostname.startsWith('operator.');

const routes = isAdminDomain
  ? [
      { path: '/', element: <Navigate to="/admin" replace /> },
      { path: '/admin/login', element: (<AuthRoute redirectTo="/admin"><LoginPage requiredRole="admin" /></AuthRoute>) },
      { path: '/health', element: <HealthPage /> },
      {
        path: '/admin',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'moderation', element: <PhotoModeration currentUserId="admin" /> },
          { path: 'settings', element: <SystemSettings /> },
          { path: 'chat-monitoring', element: <ChatMonitoring /> },
          { path: 'sites', element: <AdminSitesPage /> },
          { path: 'profiles', element: <AdminProfilesPage /> },
          { path: 'operators', element: <AdminOperatorsPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'transactions', element: <AdminTransactionsPage /> },
          { path: 'coin-packages', element: <AdminCoinPackagesPage /> },
          { path: 'mass-message', element: <AdminMassMessagePage /> },
          { path: 'affiliates', element: <AdminAffiliatesPage /> }
        ]
      }
    ]
  : isOperatorDomain
  ? [
      { path: '/', element: <Navigate to="/operator" replace /> },
      { path: '/operator/login', element: (<AuthRoute redirectTo="/operator"><LoginPage requiredRole="operator" /></AuthRoute>) },
      { path: '/health', element: <HealthPage /> },
      {
        path: '/operator',
        element: (
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorLayout />
          </ProtectedRoute>
        )
      },
      {
        path: '/operator/chat',
        element: (
          <ProtectedRoute allowedRoles={['operator']}>
            <div className="min-h-screen bg-gray-50">
              <OperatorHeader />
              <main className="flex-1">
                <OperatorChatPage />
              </main>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: '/operator/profiles',
        element: (
          <ProtectedRoute allowedRoles={['operator']}>
            <div className="min-h-screen bg-gray-50">
              <OperatorHeader />
              <main className="flex-1">
                <OperatorProfilesPage />
              </main>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: '/operator/settings',
        element: (
          <ProtectedRoute allowedRoles={['operator']}>
            <div className="min-h-screen bg-gray-50">
              <OperatorHeader />
              <main className="flex-1">
                <OperatorSettings />
              </main>
            </div>
          </ProtectedRoute>
        )
      }
    ]
  : [
      { path: '/', element: <RegisterPage /> },
      { path: '/login', element: (<AuthRoute><LoginPage /></AuthRoute>) },
      { path: '/register', element: (<AuthRoute><RegisterPage /></AuthRoute>) },
      { path: '/health', element: <HealthPage /> },
      { path: '/bootstrap-admin', element: <DevBootstrapAdmin /> }
    ];

const router = createBrowserRouter(routes);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
