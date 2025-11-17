import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Coins, Image as ImageIcon, Smile } from 'lucide-react';
import { Message, Conversation } from '../types';
import chatSocketService from '../services/chatSocket';
import { chatService as apiChatService, coinService } from '../services/api';
import { useAuthStore } from '../store';
import { toast } from 'sonner';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [coinBalance, setCoinBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');

  const loadConversations = async () => {
    if (!user) return;
    try {
      const { conversations, error } = await apiChatService.getConversations(user.id);
      if (error) throw error;
      const first = conversations[0];
      setActiveConversation(first || null);
      if (first) {
        const { messages: msgs } = await apiChatService.getMessages(first.id);
        setMessages(msgs || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      toast.error('Kunde inte ladda konversationer');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      setupRealtimeChat();
      loadBalance();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!activeConversation) return;
    const channel = chatSocketService;
    channel.connect(user?.id || '');
    channel.onNewMessage((message: Message) => {
      if (message.conversation_id === activeConversation.id) {
        setMessages(prev => [...prev, message]);
      }
    });
    return () => {
      channel.disconnect();
    };
  }, [activeConversation]);

  const setupRealtimeChat = () => {};

  const loadBalance = async () => {
    if (!user) return;
    const { balance } = await coinService.getCoinBalance(user.id);
    setCoinBalance(balance);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !mediaUrl.trim()) || !user || coinBalance <= 0) {
      if (coinBalance <= 0) {
        toast.error('Du har inga mynt kvar. Köp fler mynt för att fortsätta chatta.');
      }
      return;
    }

    try {
      // Spend 1 coin for this send action
      const spend = await coinService.spendCoins(user.id, 1, 'Chat send');
      if (spend.error) throw spend.error;
      setCoinBalance(prev => Math.max(0, prev - 1));

      const msgBase = {
        conversation_id: activeConversation?.id || '',
        sender_id: user.id,
        recipient_id: activeConversation?.id ? '' : '',
        is_read: false,
        coins_cost: 1,
        created_at: new Date().toISOString()
      } as Partial<Message>;

      if (newMessage.trim()) {
        const { message } = await apiChatService.sendMessage({
          ...msgBase,
          content: newMessage,
          message_type: 'text'
        });
        if (message) setMessages(prev => [...prev, message]);
      }

      if (mediaUrl.trim()) {
        const type = mediaUrl.toLowerCase().includes('.gif') ? 'gif' : 'image';
        const { message } = await apiChatService.sendMessage({
          ...msgBase,
          content: mediaUrl,
          message_type: type as any
        });
        if (message) setMessages(prev => [...prev, message]);
      }
      setNewMessage('');
      setMediaUrl('');
      setShowMedia(false);

    } catch (error) {
      toast.error('Kunde inte skicka meddelande');
    }
  };

  return (
    <div className="min-h-screen bg-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mina chattar</h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                      <span className="text-pink-700 font-medium">A</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Amina95, 30</p>
                      <p className="text-sm text-gray-600">Stockholm</p>
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                    <span className="text-pink-700 font-medium">A</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Amina95, 30</p>
                    <p className="text-sm text-gray-600">Stockholm • Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === 'current_user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === 'current_user'
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${message.sender_id === 'current_user' ? 'text-pink-100' : 'text-gray-500'}`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Skriv ett meddelande..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 border rounded-lg text-gray-600 hover:bg-gray-50" title="Emoji"><Smile className="h-5 w-5" /></button>
                  <button onClick={() => setShowMedia(!showMedia)} className="p-2 border rounded-lg text-gray-600 hover:bg-gray-50" title="Bild/GIF"><ImageIcon className="h-5 w-5" /></button>
                  <button
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !mediaUrl.trim()) || coinBalance === 0}
                    className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                {showEmoji && (
                  <div className="mt-2 p-2 border rounded-lg bg-white shadow-sm grid grid-cols-8 gap-1 text-xl">
                    {['😊','😍','😘','😂','😉','😇','🤗','💖','🔥','✨','💋','🥰','👍','👏','🙌','💎'].map((e) => (
                      <button key={e} onClick={() => setNewMessage((prev) => prev + e)}>{e}</button>
                    ))}
                  </div>
                )}
                {showMedia && (
                  <div className="mt-2 p-3 border rounded-lg bg-white shadow-sm">
                    <div className="flex items-center space-x-2">
                      <input type="url" placeholder="Klistra in bild/GIF URL" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
                      <button onClick={handleSendMessage} className="px-3 py-2 bg-pink-600 text-white rounded">Skicka</button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ett skick drar 1 mynt oavsett om text och bild/GIF skickas samtidigt.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coin Balance */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Coins className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{coinBalance}</p>
                <p className="text-sm text-gray-600 mb-4">Mynt kvar</p>
                <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors" onClick={() => window.location.href='/purchase-coins'}>
                  Köp fler mynt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
 
