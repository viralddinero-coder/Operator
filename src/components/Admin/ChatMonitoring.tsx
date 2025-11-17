import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle } from 'lucide-react';

const ChatMonitoring: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(50);
      setConversations(data || []);
    };
    load();
  }, []);

  useEffect(() => {
    const loadMsgs = async () => {
      if (!selected) return;
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selected.id)
        .order('created_at', { ascending: true })
        .limit(200);
      setMessages(data || []);
    };
    loadMsgs();
  }, [selected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-pink-500" />
          Senaste konversationer
        </h3>
        <div className="mt-3 max-h-96 overflow-y-auto divide-y">
          {conversations.map((c) => (
            <div key={c.id} className={`p-2 cursor-pointer ${selected?.id === c.id ? 'bg-pink-50' : ''}`} onClick={() => setSelected(c)}>
              <div className="text-sm text-gray-800">{c.id}</div>
              <div className="text-xs text-gray-500">{new Date(c.last_message_at).toLocaleString('sv-SE')}</div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-sm text-gray-600">Inga konversationer</div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900">Meddelanden</h3>
        <div className="mt-3 max-h-96 overflow-y-auto space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="border rounded p-2 text-sm">
              <div className="text-gray-800">{m.content}</div>
              <div className="text-xs text-gray-500">{m.sender_id} • {new Date(m.created_at).toLocaleString('sv-SE')}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-sm text-gray-600">Välj en konversation</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMonitoring;
