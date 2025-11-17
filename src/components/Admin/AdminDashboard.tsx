import React, { useEffect, useState } from 'react';
import { BarChart3, Globe, Users, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock, Camera, CreditCard, Settings, Flag, Shield, Tag, Mail, MessageSquare, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PhotoModeration } from './PhotoModeration';
import { PaymentSettings } from './PaymentSettings';
import { ContentModeration } from './ContentModeration';
import { supabase } from '../../lib/supabase';
import ChatMonitoring from './ChatMonitoring';
import SystemSettings from './SystemSettings';
import UserManagement from './UserManagement';
import CampaignManagement from './CampaignManagement';
import SupportSettings from './SupportSettings';
import MessageTemplates from './MessageTemplates';
import CoinPackagesManagement from './CoinPackagesManagement';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'payments' | 'settings' | 'chatMonitoring' | 'contentModeration' | 'userManagement' | 'campaigns' | 'support' | 'templates' | 'coinPackages'>('overview');
  const [stats, setStats] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [operatorMessageStats, setOperatorMessageStats] = useState<{ totalReceived: number; perOperator: Array<{ operator_id: string; received: number }> }>({ totalReceived: 0, perOperator: [] });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  useEffect(() => {
    const load = async () => {
      const { data: sites } = await supabase.from('sites').select('*').eq('is_active', true);
      const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5);
      const { data: ops } = await supabase.from('users').select('*').eq('role', 'operator');
      const { data: coinsToday } = await supabase
        .from('coin_transactions')
        .select('amount, created_at')
        .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
      const totalCoinsToday = (coinsToday || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      const revenueUSD = totalCoinsToday * 0.1; // Assuming 1 coin = $0.10
      // Operator message stats (received from customers)
      const operatorIds = (ops || []).map((o: any) => o.id);
      let totalReceived = 0;
      const perOperator: Array<{ operator_id: string; received: number }> = [];
      if (operatorIds.length) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('recipient_id')
          .in('recipient_id', operatorIds);
        const counts: Record<string, number> = {};
        (msgs || []).forEach((m: any) => { counts[m.recipient_id] = (counts[m.recipient_id] || 0) + 1; });
        totalReceived = Object.values(counts).reduce((a, b) => a + b, 0);
        perOperator.push(...Object.entries(counts).map(([operator_id, received]) => ({ operator_id, received })));
      }
      setOperatorMessageStats({ totalReceived, perOperator });
      setStats([
        { label: 'Aktiva sajter', value: (sites || []).length.toString(), color: 'blue', icon: Globe },
        { label: 'Operatörer', value: (ops || []).length.toString(), color: 'green', icon: Users },
        { label: 'Användare', value: (users || []).length.toString(), color: 'purple', icon: Users },
        { label: 'Dagens intäkter', value: formatCurrency(revenueUSD), color: 'orange', icon: DollarSign },
        { label: 'Mottagna (alla operatörer)', value: operatorMessageStats.totalReceived.toString(), color: 'pink', icon: MessageStatIcon }
      ]);
      setSites(sites || []);
      setRecentUsers(users || []);
    };
    load();
  }, []);

  

  const renderTabContent = () => {
    switch (activeTab) {
      case 'photos':
        return <PhotoModeration currentUserId="admin-user-id" />;
      case 'payments':
        return <PaymentSettings />;
      case 'settings':
        return <SystemSettings />;
      case 'chatMonitoring':
        return <ChatMonitoring />;
      case 'contentModeration':
        return <ContentModeration />;
      case 'userManagement':
        return <UserManagement />;
      case 'campaigns':
        return <CampaignManagement />;
      case 'support':
        return <SupportSettings />;
      case 'templates':
        return <MessageTemplates />;
      case 'coinPackages':
        return <CoinPackagesManagement />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sites Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Aktiva Sajter</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {sites.map((site: any, index: number) => (
              <div key={index} className="p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{site.name}</h3>
                    <p className="text-sm text-gray-600">{site.domain}</p>
                    <p className="text-sm text-gray-500">{site.users} användare</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Aktiv</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{site.revenue} kr</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Nya Användare</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentUsers.map((user: any, index: number) => (
              <div key={index} className="p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      {user.is_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className={`text-sm ${user.status === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {user.status === 'verified' ? 'Verifierad' : 'Väntar'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{user.registered}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operator Leaderboard */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Operatör – mottagna meddelanden</h2>
        </div>
        <div className="p-6">
          {(operatorMessageStats.perOperator || []).length === 0 ? (
            <div className="text-sm text-gray-600">Inga data</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operatorMessageStats.perOperator
                .sort((a, b) => b.received - a.received)
                .map((row) => (
                  <div key={row.operator_id} className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">Operatör</div>
                    <div className="text-lg font-semibold">{row.operator_id}</div>
                    <div className="text-sm">Mottagna: {row.received}</div>
                  </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Snabbåtgärder</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => navigate('/admin/sites')} className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors">
              <Globe className="h-5 w-5" />
              <span>Skapa ny sajt</span>
            </button>
            <button 
              onClick={() => navigate('/admin/operators')}
              className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors"
            >
              <Users className="h-5 w-5" />
              <span>Lägg till operatör</span>
            </button>
            <button 
              onClick={() => setActiveTab('contentModeration')}
              className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Visa rapporter</span>
            </button>
            <button 
              onClick={() => setActiveTab('contentModeration')}
              className="flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg transition-colors"
            >
              <Shield className="h-5 w-5" />
              <span>Moderera innehåll</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Översikt över alla dejtingsajter och system</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Översikt
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'photos'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Bildmoderering
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Betalningar
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Inställningar
            </button>
            <button
              onClick={() => setActiveTab('chatMonitoring')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'chatMonitoring'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Chatt‑övervakning
            </button>
            <button
              onClick={() => setActiveTab('contentModeration')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contentModeration'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Innehållsmoderering
            </button>
            <button
              onClick={() => setActiveTab('userManagement')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'userManagement'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Användare
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'campaigns'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              Kampanjer
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'support'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Support
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Mallar
            </button>
            <button
              onClick={() => setActiveTab('coinPackages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'coinPackages'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Coins className="w-4 h-4 inline mr-2" />
              Myntpaket
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
// dummy icon reutilize Users for consistency if MessageStatIcon not defined
const MessageStatIcon = Users;
