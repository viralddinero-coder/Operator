import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, MessageCircle, Users, Settings, CreditCard, TrendingUp, User } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { icon: Search, label: 'Sök', path: '/search' },
    { icon: Heart, label: 'Hiss eller Diss', path: '/hot-or-not' },
    { icon: MessageCircle, label: 'Mina chattar', path: '/chat' },
    { icon: MessageCircle, label: 'Inkorg', path: '/inbox' },
    { icon: TrendingUp, label: 'Tyckare', path: '/likes', badge: '1' },
    { icon: Users, label: 'Beundrare', path: '/admirers' },
    { icon: Users, label: 'Matchningar', path: '/matches' },
    { icon: Settings, label: 'Kontrollrum', path: '/control-panel' },
    { icon: CreditCard, label: 'Installera Appen', path: '/install-app' }
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      {/* User Card */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-pink-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Bajskorv, 20</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-pink-500">59</span>
              <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full">0%</span>
            </div>
          </div>
        </div>
        <button className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
          Köp Krediter
        </button>
      </div>

      {/* Menu */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;