import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Settings, BarChart3, Globe, CreditCard, AlertTriangle } from 'lucide-react';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store';

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">Admin Panel</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-purple-600">Super Admin</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-purple-600" />
            </div>
            <button
              onClick={async () => { await authService.signOut(); logout(); navigate('/login'); }}
              className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md text-sm"
            >
              LOGGA UT
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
