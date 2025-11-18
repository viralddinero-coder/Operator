import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ProfilePage from '../pages/ProfilePage'
import ChatPage from '../pages/ChatPage'
import SearchPage from '../pages/SearchPage'
import PurchaseCoinsPage from '../pages/PurchaseCoinsPage'
import SettingsPage from '../pages/SettingsPage'
import HealthPage from '../pages/HealthPage'
import { ProtectedRoute, AuthRoute } from '../components/Auth/ProtectedRoute'
import { Outlet } from 'react-router-dom'

const SiteLayout: React.FC = () => (
  <div className="min-h-screen bg-white">
    <Outlet />
  </div>
)

export const datingRouter = createBrowserRouter([
  { path: '/', element: (<AuthRoute><RegisterPage /></AuthRoute>) },
  { path: '/login', element: (<AuthRoute><LoginPage /></AuthRoute>) },
  { path: '/register', element: (<AuthRoute><RegisterPage /></AuthRoute>) },
  { path: '/health', element: <HealthPage /> },
  { path: '/home', element: (<ProtectedRoute allowedRoles={['user']}><SiteLayout /></ProtectedRoute>), children: [
    { index: true, element: <HomePage /> },
    { path: 'chat', element: <ChatPage /> },
    { path: 'profile', element: <ProfilePage /> },
    { path: 'search', element: <SearchPage /> },
    { path: 'coins', element: <PurchaseCoinsPage /> },
    { path: 'settings', element: <SettingsPage /> }
  ]}
])

