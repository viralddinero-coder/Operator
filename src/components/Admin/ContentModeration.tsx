import React, { useState, useEffect } from 'react';
import { Flag, MessageSquare, UserX, Eye, Search, Filter, Clock, Check, X, AlertTriangle, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter: {
    name: string;
    email: string;
  };
  reported_user: {
    name: string;
    email: string;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    name: string;
    email: string;
  };
  is_flagged: boolean;
}

interface ModerationStats {
  pending_reports: number;
  flagged_messages: number;
  blocked_users: number;
  resolved_today: number;
}

export const ContentModeration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'messages' | 'users' | 'stats'>('reports');
  const [reports, setReports] = useState<UserReport[]>([]);
  const [flaggedMessages, setFlaggedMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ModerationStats>({
    pending_reports: 0,
    flagged_messages: 0,
    blocked_users: 0,
    resolved_today: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    try {
      setIsLoading(true);
      
      // Ladda användarrapporter
      const { data: reportsData, error: reportsError } = await supabase
        .from('user_reports')
        .select(`
          *,
          reporter:reporter_id(name, email),
          reported_user:reported_user_id(name, email)
        `)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);

      // Ladda flaggade meddelanden
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(name, email)
        `)
        .eq('is_flagged', true)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      setFlaggedMessages(messagesData || []);

      // Räkna statistik
      const pendingReports = (reportsData || []).filter(r => r.status === 'pending').length;
      const flaggedMsgs = (messagesData || []).length;
      
      // Räkna blockerade användare
      const { count: blockedCount, error: blockedError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_blocked', true);

      if (blockedError) throw blockedError;

      // Räkna lösta ärenden idag
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: resolvedToday, error: resolvedError } = await supabase
        .from('user_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('updated_at', today.toISOString());

      if (resolvedError) throw resolvedError;

      setStats({
        pending_reports: pendingReports,
        flagged_messages: flaggedMsgs,
        blocked_users: blockedCount || 0,
        resolved_today: resolvedToday || 0
      });

    } catch (error) {
      console.error('Fel vid laddning av modereringsdata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss' | 'block_user') => {
    try {
      // Uppdatera rapportstatus
      const { error: updateError } = await supabase
        .from('user_reports')
        .update({ 
          status: action === 'resolve' ? 'resolved' : 'dismissed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      // Om vi ska blockera användaren
      if (action === 'block_user') {
        const report = reports.find(r => r.id === reportId);
        if (report) {
          const { error: blockError } = await supabase
            .from('users')
            .update({ is_blocked: true, blocked_at: new Date().toISOString() })
            .eq('id', report.reported_user_id);

          if (blockError) throw blockError;
        }
      }

      // Uppdatera lokala state
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, status: action === 'resolve' ? 'resolved' : 'dismissed' as any }
          : r
      ));

      // Uppdatera statistik
      loadModerationData();

    } catch (error) {
      console.error('Fel vid hantering av rapport:', error);
      alert('Kunde inte utföra åtgärden');
    }
  };

  const handleMessageAction = async (messageId: string, action: 'unflag' | 'delete') => {
    try {
      if (action === 'unflag') {
        const { error } = await supabase
          .from('messages')
          .update({ is_flagged: false })
          .eq('id', messageId);

        if (error) throw error;
      } else if (action === 'delete') {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId);

        if (error) throw error;
      }

      // Uppdatera lokala state
      setFlaggedMessages(prev => prev.filter(m => m.id !== messageId));
      loadModerationData();

    } catch (error) {
      console.error('Fel vid hantering av meddelande:', error);
      alert('Kunde inte utföra åtgärden');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reported_user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Innehållsmoderering</h2>
          <p className="text-gray-600">Hantera rapporter, flaggat innehåll och användare</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <AlertTriangle className="w-4 h-4" />
          <span>{stats.pending_reports + stats.flagged_messages} väntande ärenden</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Väntande rapporter</p>
              <p className="text-2xl font-bold text-red-600">{stats.pending_reports}</p>
            </div>
            <Flag className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Flaggade meddelanden</p>
              <p className="text-2xl font-bold text-orange-600">{stats.flagged_messages}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blockerade användare</p>
              <p className="text-2xl font-bold text-gray-600">{stats.blocked_users}</p>
            </div>
            <UserX className="h-8 w-8 text-gray-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lösta idag</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved_today}</p>
            </div>
            <Check className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Flag className="w-4 h-4 inline mr-2" />
            Användarrapporter ({stats.pending_reports})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messages'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Flaggade meddelanden ({stats.flagged_messages})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Statistik
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Sök efter användare, email eller anledning..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">Alla status</option>
              <option value="pending">Väntande</option>
              <option value="resolved">Lösta</option>
              <option value="dismissed">Avfärdade</option>
            </select>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Flag className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <h3 className="text-lg font-medium">Inga rapporter hittades</h3>
              <p className="text-sm">Det finns inga rapporter som matchar dina filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className={`bg-white rounded-lg shadow-sm border p-4 ${
                  report.status === 'pending' ? 'border-red-200' : 
                  report.status === 'resolved' ? 'border-green-200' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900">{report.reported_user.name}</h4>
                        <p className="text-sm text-gray-600">{report.reported_user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.status === 'pending' ? 'bg-red-100 text-red-800' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status === 'pending' ? 'Väntande' :
                         report.status === 'resolved' ? 'Löst' : 'Avfärdad'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(report.created_at).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Anledning:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {report.reason}
                    </p>
                  </div>

                  {report.description && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Beskrivning:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {report.description}
                      </p>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-xs text-gray-500">
                      Rapporterad av: {report.reporter.name} ({report.reporter.email})
                    </p>
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReportAction(report.id, 'resolve')}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Markera som löst
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'dismiss')}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        Avfärda
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'block_user')}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <UserX className="w-4 h-4" />
                        Blockera användare
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-4">
          {flaggedMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <h3 className="text-lg font-medium">Inga flaggade meddelanden</h3>
              <p className="text-sm">Alla meddelanden är granskade!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {flaggedMessages.map((message) => (
                <div key={message.id} className="bg-white rounded-lg shadow-sm border border-orange-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900">{message.sender.name}</h4>
                        <p className="text-sm text-gray-600">{message.sender.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Flagga
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.created_at).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700 bg-orange-50 p-3 rounded border border-orange-200">
                      {message.content}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMessageAction(message.id, 'unflag')}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Ta bort flagga
                    </button>
                    <button
                      onClick={() => handleMessageAction(message.id, 'delete')}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      Ta bort meddelande
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modereringsaktivitet</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Totalt antal rapporter:</span>
                <span className="font-medium">{reports.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lösta rapporter:</span>
                <span className="font-medium">{reports.filter(r => r.status === 'resolved').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avfärdade rapporter:</span>
                <span className="font-medium">{reports.filter(r => r.status === 'dismissed').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Flaggade meddelanden:</span>
                <span className="font-medium">{flaggedMessages.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Snabbåtgärder</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setActiveTab('reports')}
                className="w-full text-left p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-800">Granska väntande rapporter</span>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {stats.pending_reports}
                  </span>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('messages')}
                className="w-full text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-800">Granska flaggade meddelanden</span>
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                    {stats.flagged_messages}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};