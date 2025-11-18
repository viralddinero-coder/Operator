import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute, AuthRoute } from '../components/Auth/ProtectedRoute'
import OperatorHeader from '../components/Operator/OperatorHeader'
import OperatorDashboard from '../components/Operator/OperatorDashboard'
import OperatorChatPage from '../components/Operator/OperatorChatPage'
import OperatorProfilesPage from '../components/Operator/OperatorProfilesPage'
import OperatorSettings from '../components/Operator/OperatorSettings'
import LoginPage from '../pages/LoginPage'
import HealthPage from '../pages/HealthPage'
import { Outlet, Navigate } from 'react-router-dom'

const OperatorLayout: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <OperatorHeader />
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
)

export const operatorRouter = createBrowserRouter([
  { path: '/', element: <Navigate to="/operator" replace /> },
  { path: '/operator/login', element: (<AuthRoute redirectTo="/operator"><LoginPage requiredRole="operator" /></AuthRoute>) },
  { path: '/health', element: <HealthPage /> },
  { path: '/operator', element: (<ProtectedRoute allowedRoles={['operator']}><OperatorLayout /></ProtectedRoute>), children: [
    { index: true, element: <OperatorDashboard /> },
    { path: 'chat', element: <OperatorChatPage /> },
    { path: 'profiles', element: <OperatorProfilesPage /> },
    { path: 'settings', element: <OperatorSettings /> }
  ]}
])

