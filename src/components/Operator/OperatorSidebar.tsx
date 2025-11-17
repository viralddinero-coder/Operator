import React, { useEffect, useState } from 'react';
import { Users, MessageCircle, BarChart3, Settings, Clock, TrendingUp, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';

const OperatorSidebar: React.FC = () => {
  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/operator/dashboard' },
    { icon: MessageCircle, label: 'Chattar', path: '/operator/chat' },
    { icon: Users, label: 'Användare', path: '/operator/users' },
    { icon: TrendingUp, label: 'Statistik', path: '/operator/statistics' },
    { icon: Settings, label: 'Inställningar', path: '/operator/settings' }
  ];

  const { user } = useAuthStore();
  const [stats, setStats] = useState<{ active?: number; sent?: number; received?: number }>({});
  useEffect(() => {
    const load = async () => {
      // active chats approximated as conversations where user is participant and is_active is true
      const { data: convs } = await supabase.from('conversations').select('*').or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`).eq('is_active', true);
      const { data: sentMsgs } = await supabase.from('messages').select('id').eq('sender_id', user?.id);
      const { data: recvMsgs } = await supabase.from('messages').select('id').eq('recipient_id', user?.id);
      setStats({ active: (convs || []).length, sent: (sentMsgs || []).length, received: (recvMsgs || []).length });
    };
    if (user?.id) load();
  }, [user?.id]);

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      {/* Operator Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Operator 1</p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Aktiva chattar</span>
            <span className="font-semibold text-blue-600">{stats.active ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Skickade meddelanden</span>
            <span className="font-semibold text-green-600">{stats.sent ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Mottagna meddelanden</span>
            <span className="font-semibold text-purple-600">{stats.received ?? '–'}</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
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

export default OperatorSidebar;
