import { Link, useNavigate } from 'react-router-dom';
import { LogOut, MessageCircle, Settings, User } from 'lucide-react';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store';
import { useStrings } from '../../hooks/useStrings';

const OperatorHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const s = useStrings('operator','en')

  const BrandMark = () => (
    <div className="flex items-center space-x-2">
      <svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 24 L12 8 L16 16 L20 8 L28 24" fill="none" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-2xl font-bold" style={{ color: '#d4af37' }}>Affilyx</span>
      <span className="text-sm font-semibold text-gray-200">Operators</span>
    </div>
  );

  return (
    <header className="bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <BrandMark />
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/operator" className="text-gray-200 hover:text-white transition-colors">{s.nav.dashboard}</Link>
              <Link to="/operator/settings" className="flex items-center space-x-1 text-gray-200 hover:text-white transition-colors">
                <Settings className="h-5 w-5" />
                <span>{s.nav.settings}</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4 mr-4">
              <Link to="/operator/chat" className="flex items-center space-x-1 text-gray-200 hover:text-white transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span>{s.nav.chats}</span>
              </Link>
              <Link to="/operator/profiles" className="text-gray-200 hover:text-white transition-colors">
                {s.nav.profiles}
              </Link>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-200">{user?.email || 'Operator'}</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
            <div className="w-8 h-8 bg-yellow-700 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-yellow-300" />
            </div>
            <button
              onClick={async () => { await authService.signOut(); logout(); navigate('/login'); }}
              className="px-3 py-2 bg-white/10 text-gray-200 rounded-md text-sm flex items-center space-x-2 hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span>{s.nav.logout}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default OperatorHeader;
