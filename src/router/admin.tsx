import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute, AuthRoute } from '../components/Auth/ProtectedRoute'
import AdminHeader from '../components/Admin/AdminHeader'
import AdminSidebar from '../components/Admin/AdminSidebar'
import AdminDashboard from '../components/Admin/AdminDashboard'
import SystemSettings from '../components/Admin/SystemSettings'
import ChatMonitoring from '../components/Admin/ChatMonitoring'
import { PhotoModeration } from '../components/Admin/PhotoModeration'
import AdminSitesPage from '../components/Admin/AdminSitesPage'
import AdminOperatorsPage from '../components/Admin/AdminOperatorsPage'
import AdminUsersPage from '../components/Admin/AdminUsersPage'
import AdminTransactionsPage from '../components/Admin/AdminTransactionsPage'
import AdminAffiliatesPage from '../components/Admin/AdminAffiliatesPage'
import AdminProfilesPage from '../components/Admin/AdminProfilesPage'
import AdminCoinPackagesPage from '../components/Admin/AdminCoinPackagesPage'
import AdminMassMessagePage from '../components/Admin/AdminMassMessagePage'
import LoginPage from '../pages/LoginPage'
import HealthPage from '../pages/HealthPage'
import { Outlet, Navigate } from 'react-router-dom'

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
)

export const adminRouter = createBrowserRouter([
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
])

