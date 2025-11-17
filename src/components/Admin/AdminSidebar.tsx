import React, { useEffect, useState } from 'react';
import { Shield, Users, Globe, Settings, BarChart3, CreditCard, AlertTriangle, User, MessageCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AdminSidebar: React.FC = () => {
  const [allowed, setAllowed] = useState<string[] | null>(null)

  useEffect(() => {
    const loadPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const key = `admin_permissions:${user.id}`
      const { data } = await supabase.from('system_settings').select('value').eq('key', key).single()
      if (data?.value?.modules && Array.isArray(data.value.modules)) {
        setAllowed(data.value.modules)
      }
    }
    loadPermissions()
  }, [])

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Globe, label: 'Sajter', path: '/admin/sites' },
    { icon: Users, label: 'Profiler', path: '/admin/profiles' },
    { icon: Users, label: 'Operatörer', path: '/admin/operators' },
    { icon: Users, label: 'Användare', path: '/admin/users' },
    { icon: CreditCard, label: 'Transaktioner', path: '/admin/transactions' },
    { icon: CreditCard, label: 'Myntpaket', path: '/admin/coin-packages' },
    { icon: MessageCircle, label: 'Mass Message', path: '/admin/mass-message' },
    { icon: AlertTriangle, label: 'Moderering', path: '/admin/moderation' },
    { icon: Settings, label: 'Inställningar', path: '/admin/settings' }
  ];

  const [counts, setCounts] = useState<{ sites?: number; operators?: number; users?: number }>({});

  useEffect(() => {
    const loadCounts = async () => {
      const { data: sites } = await supabase.from('sites').select('*').eq('is_active', true);
      const { data: operators } = await supabase.from('users').select('*').eq('role', 'operator');
      const { data: users } = await supabase.from('users').select('*');
      setCounts({ sites: (sites || []).length, operators: (operators || []).length, users: (users || []).length });
    };
    loadCounts();
  }, []);

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      {/* Admin Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Admin User</p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Aktiva sajter</span>
            <span className="font-semibold text-purple-600">{counts.sites ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Operatörer</span>
            <span className="font-semibold text-green-600">{counts.operators ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Användare</span>
            <span className="font-semibold text-blue-600">{counts.users ?? '–'}</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems
            .filter((item) => !allowed || allowed.includes(item.label.toLowerCase()))
            .map((item) => {
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors ${isActive ? 'bg-white' : ''}`}
                >
                  <Icon className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
