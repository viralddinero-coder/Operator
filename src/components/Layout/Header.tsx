import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Search, Settings, User, CreditCard, LogOut, Coins } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { useUIStore } from '../../store';
import { useAuthStore } from '../../store';
import { authService, coinService } from '../../services/api';
import { toast } from 'sonner';

const Header: React.FC = () => {
  const { setShowHiddenAdmin } = useUIStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [balance, setBalance] = React.useState<number | null>(null);

  React.useEffect(() => {
    const loadBalance = async () => {
      if (!user) { setBalance(null); return; }
      const { balance } = await coinService.getCoinBalance(user.id);
      setBalance(balance);
    };
    loadBalance();
  }, [user?.id]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Heart className="h-8 w-8 text-pink-500" />
              <span className="text-2xl font-bold text-gray-900">{siteConfig.name}</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/search" className="flex items-center space-x-1 text-gray-700 hover:text-pink-500 transition-colors">
              <Search className="h-5 w-5" />
              <span>Sök</span>
            </Link>
            <Link to="/chat" className="flex items-center space-x-1 text-gray-700 hover:text-pink-500 transition-colors">
              <MessageCircle className="h-5 w-5" />
              <span>Chatt</span>
            </Link>
            <Link to="/profile" className="flex items-center space-x-1 text-gray-700 hover:text-pink-500 transition-colors">
              <User className="h-5 w-5" />
              <span>Profil</span>
            </Link>
            <Link to="/settings" className="flex items-center space-x-1 text-gray-700 hover:text-pink-500 transition-colors">
              <Settings className="h-5 w-5" />
              <span>Inställningar</span>
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  {balance !== null && (
                    <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-3 py-2 rounded-full">
                      <Coins className="h-4 w-4" />
                      <span>{balance}</span>
                    </div>
                  )}
                  <Link
                    to="/purchase-coins"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-medium transition-colors flex items-center space-x-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Köp Krediter</span>
                  </Link>
                </div>
                <div className="flex items-center space-x-3">
                  <Link to="/profile" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-pink-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user?.email}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="Logga ut"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-pink-500 transition-colors font-medium"
                >
                  Logga in
                </Link>
                <Link
                  to="/register"
                  className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full font-medium transition-colors"
                >
                  Registrera
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
