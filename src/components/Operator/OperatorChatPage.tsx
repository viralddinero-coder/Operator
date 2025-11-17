import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, User, Clock, Send, Lock, Unlock, BarChart3, Image as ImageIcon, Smile } from 'lucide-react';
import { chatService, operatorService, photoService, mediaService, coinService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Conversation } from '../../types';
import { supabase } from '../../lib/supabase';
import { useStrings } from '../../hooks/useStrings';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  message_type?: 'text' | 'image' | 'emoji';
}

const OperatorChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [lockedConversations, setLockedConversations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [targetsOnline, setTargetsOnline] = useState<any[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [operatorProfiles, setOperatorProfiles] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [targetPhotos, setTargetPhotos] = useState<Record<string, string | null>>({});
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [playerNoteText, setPlayerNoteText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [otherCoinBalance, setOtherCoinBalance] = useState<number | null>(null);
  const [ui, setUi] = useState<any>({ theme: 'light', chat_background_enabled: false, chat_background_url: '' })
  const s = useStrings('operator','en')
  const [stats, setStats] = useState({
    totalChats: 0,
    totalMessages: 0,
    avgResponseTime: 0,
    lockedCount: 0
  });

  useEffect(() => {
    if (user) {
      loadOperatorConversations();
      loadTargetsOnline();
    }
    // Demo seeding borttagen
  }, [user]);

  // Borttagen: onödig intervall som ändrade status slumpmässigt

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      loadNote();
      loadPlayerNote();
      loadOtherBalance();
      subscribeRealtime(selectedConversation.id);
    }
    return () => {
      supabase.removeAllChannels();
    };
  }, [selectedConversation]);

  useEffect(() => {
    const loadUi = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', `operator_ui:${user?.id || ''}`).maybeSingle()
      if (data?.value) setUi({ ...ui, ...data.value })
    }
    loadUi()
  }, [user?.id])

  const playPling = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    o.stop(ctx.currentTime + 0.3);
  };

  const loadOperatorConversations = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Hämta operatörens låsta konversationer
      const { conversations: lockedConvs, error: lockedError } = await chatService.getOperatorConversations(user.id);
      
      if (lockedError) throw lockedError;
      
      // Hämta tillgängliga konversationer för operatören
      const { conversations: availableConvs, error: availableError } = await chatService.getAvailableConversationsForOperator('default-site-id', user.id);
      
      if (availableError) throw availableError;
      
      // Kombinera och uppdatera låsta konversationer
      const allConversations = [...(lockedConvs || []), ...(availableConvs || [])];
      const lockedIds = new Set(lockedConvs?.map(conv => conv.id) || []);
      
      setConversations(allConversations);
      setLockedConversations(lockedIds);
      
      // Uppdatera statistik
      setStats(prev => ({
        ...prev,
        totalChats: allConversations.length,
        lockedCount: lockedIds.size
      }));
      
    } catch (error) {
      console.error('Kunde inte ladda konversationer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const seedMockData = () => {
    const mockOther: any = {
      id: 'user-mock-1',
      user_id: 'user-mock-1',
      site_id: 'site-mock',
      name: 'Amina95',
      age: 30,
      gender: 'female',
      location: 'Stockholm',
      bio: 'Älskar sena promenader och skratt. Letar efter kemi. 💖',
      online_status: 'online',
      is_profile_complete: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockOperatorProfile: any = {
      id: 'profile-mock-operator',
      user_id: 'operator-mock',
      site_id: 'site-mock',
      name: 'Luna',
      age: 24,
      gender: 'female',
      location: 'Göteborg',
      bio: 'Charmig och empatisk. Alltid med ett leende.',
      online_status: 'online',
      is_profile_complete: true,
      is_operator_profile: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockConv: any = {
      id: 'conv-mock-1',
      user1_id: 'operator-mock',
      user2_id: 'user-mock-1',
      site_id: 'site-mock',
      last_message_at: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      other_user: mockOther,
      profiles: [mockOther, mockOperatorProfile],
      last_message: {
        id: 'msg-mock-2',
        conversation_id: 'conv-mock-1',
        sender_id: 'user-mock-1',
        recipient_id: 'operator-mock',
        content: 'Vad gör du ikväll? 😊',
        message_type: 'text',
        is_read: false,
        coins_cost: 0,
        created_at: new Date().toISOString()
      }
    };

    const mockMsgs: Message[] = [
      {
        id: 'msg-mock-1',
        sender_id: 'operator-mock',
        content: 'Hej Amina! Hur mår du idag? 💖',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        message_type: 'text'
      },
      {
        id: 'msg-mock-2',
        sender_id: 'user-mock-1',
        content: 'Jag mår toppen! 😊',
        created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        message_type: 'text'
      }
    ];

    const mockOnline = [
      { id: 'user-mock-1', name: 'Amina95', age: 30, location: 'Stockholm', online_status: 'online' },
      { id: 'user-mock-2', name: 'Sofia88', age: 28, location: 'Göteborg', online_status: 'away' },
      { id: 'user-mock-3', name: 'Emma92', age: 32, location: 'Malmö', online_status: 'offline' }
    ];

    setConversations([mockConv]);
    setSelectedConversation(mockConv);
    setMessages(mockMsgs);
    setTargetsOnline(mockOnline);
    setIsLoading(false);
  };

  const loadTargetsOnline = async () => {
    try {
      const { profiles } = await operatorService.getTargetsOnlineForOperator();
      setTargetsOnline(profiles);
      const photoMap: Record<string, string | null> = {};
      for (const p of profiles || []) {
        const { photos } = await photoService.getPhotosByProfile(p.id);
        const primary = (photos || []).find((ph: any) => ph.is_primary && ph.is_approved);
        photoMap[p.id] = primary?.url || null;
      }
      setTargetPhotos(photoMap);
    } catch {}
  };

  const openStartModal = async (target: any) => {
    setSelectedTarget(target);
    if (user) {
      const { profiles } = await operatorService.getOperatorProfiles(user.id);
      setOperatorProfiles(profiles || []);
    } else {
      setOperatorProfiles([
        { id: 'profile-mock-operator', name: 'Luna', age: 24, user_id: 'operator-mock' },
      ]);
    }
    setShowStartModal(true);
  };

  const startOrResumeChat = async (profile: any) => {
    if (!user || !selectedTarget) return;
    const { conversations } = await chatService.getConversations(profile.user_id);
    const existing = (conversations || []).find((c: any) => (c.user1_id === profile.user_id && c.user2_id === selectedTarget.user_id) || (c.user2_id === profile.user_id && c.user1_id === selectedTarget.user_id));
    if (existing) {
      setSelectedConversation(existing);
      setShowStartModal(false);
      return;
    }
    const siteId = selectedTarget.site_id || 'default-site-id';
    const { conversation } = await chatService.createConversation(profile.user_id, selectedTarget.user_id, siteId);
    if (conversation) {
      setSelectedConversation(conversation as any);
    }
    setShowStartModal(false);
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;
    
    try {
      const { messages: conversationMessages, error } = await chatService.getMessages(selectedConversation.id);
      
      if (error) throw error;
      
      setMessages(conversationMessages || []);
      
      // Uppdatera meddelanderäknare
      setStats(prev => ({
        ...prev,
        totalMessages: (conversationMessages || []).length
      }));
      
    } catch (error) {
      console.error('Kunde inte ladda meddelanden:', error);
    }
  };

  const subscribeRealtime = (conversationId: string) => {
    const channel = supabase.channel(`messages_${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload: any) => {
        const msg = payload.new as Message;
        setMessages((prev) => [...prev, msg]);
        if (msg.sender_id !== user?.id) playPling();
      })
      .subscribe();
    return channel;
  };

  const loadNote = async () => {
    if (!user || !selectedConversation) return;
    const { note } = await chatService.getOperatorNotes(user.id, selectedConversation.id);
    setNoteText(note?.note_text || '');
  };

  const loadOtherBalance = async () => {
    if (!user || !selectedConversation) return;
    const otherId = selectedConversation.user1_id === user.id ? selectedConversation.user2_id : selectedConversation.user1_id;
    const { balance } = await coinService.getCoinBalance(otherId);
    setOtherCoinBalance(balance);
  };

  const loadPlayerNote = async () => {
    if (!user || !selectedConversation) return;
    const femaleProfile = selectedConversation.profiles?.find((p: any) => p.is_operator_profile) || null;
    if (!femaleProfile) return;
    const { note } = await operatorService.getPlayerNote(user.id, femaleProfile.id);
    setPlayerNoteText(note?.note_text || '');
  };

  const saveNote = async (text: string) => {
    if (!user || !selectedConversation) return;
    setSavingNote(true);
    await chatService.upsertOperatorNote(user.id, selectedConversation.id, text);
    setSavingNote(false);
  };

  const debouncedSave = useMemo(() => {
    let t: any;
    return (text: string) => {
      clearTimeout(t);
      t = setTimeout(() => saveNote(text), 500);
    };
  }, []);

  const debouncedSavePlayer = useMemo(() => {
    let t: any;
    return async (text: string) => {
      clearTimeout(t);
      t = setTimeout(async () => {
        if (!user || !selectedConversation) return;
        const femaleProfile = selectedConversation.profiles?.find((p: any) => p.is_operator_profile) || null;
        if (!femaleProfile) return;
        await operatorService.setPlayerNote(user.id, femaleProfile.id, text);
      }, 500);
    };
  }, [user?.id, selectedConversation?.id]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedConversation && user) {
      try {
        const { message, error } = await chatService.sendMessage({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          recipient_id: selectedConversation.user1_id === user.id ? selectedConversation.user2_id : selectedConversation.user1_id,
          content: newMessage,
          message_type: 'text',
          is_read: false,
          coins_cost: 0 // Gratis för operatörer
        });

        if (error) throw error;

        setMessages([...messages, message!]);
        setNewMessage('');
        
        // Uppdatera statistik
        setStats(prev => ({
          ...prev,
          totalMessages: prev.totalMessages + 1
        }));
        
      } catch (error) {
        console.error('Kunde inte skicka meddelande:', error);
      }
    }
  };

  const handleSendMediaUrl = async () => {
    if (!mediaUrl || !selectedConversation || !user) return;
    const type = mediaUrl.toLowerCase().includes('.gif') ? 'gif' : 'image';
    const { message } = await chatService.sendMessage({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      recipient_id: selectedConversation.user1_id === user.id ? selectedConversation.user2_id : selectedConversation.user1_id,
      content: mediaUrl,
      message_type: type as any,
      is_read: false,
      coins_cost: 0,
    });
    if (message) {
      setMessages([...messages, message]);
      setMediaUrl('');
      setShowMedia(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!file || !selectedConversation || !user) return;
    try {
      setUploading(true);
      const { message, error } = await mediaService.uploadMessageImage(file, user.id, selectedConversation.id);
      if (error) throw error as any;
      if (message) setMessages((prev) => [...prev, message]);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const toggleConversationLock = async (conversationId: string) => {
    if (!user) return;
    
    try {
      if (lockedConversations.has(conversationId)) {
        // Lås upp konversation
        const { error } = await chatService.unlockConversation(conversationId, user.id);
        if (error) throw error;
        
        setLockedConversations(prev => {
          const newSet = new Set(prev);
          newSet.delete(conversationId);
          return newSet;
        });
      } else {
        // Lås konversation
        const { lock, error } = await chatService.lockConversationForOperator(conversationId, user.id);
        if (error) throw error;
        
        setLockedConversations(prev => new Set(prev).add(conversationId));
      }
      
      // Uppdatera statistik
      setStats(prev => ({
        ...prev,
        lockedCount: lockedConversations.has(conversationId) ? prev.lockedCount - 1 : prev.lockedCount + 1
      }));
      
    } catch (error) {
      console.error('Kunde inte ändra låsstatus:', error);
    }
  };

  return (
    <div className={`${ui.theme==='dark'?'dark':''} min-h-screen ${ui.chat_background_enabled ? 'bg-cover bg-center' : 'bg-gray-50'}`} style={ui.chat_background_enabled ? { backgroundImage: `url(${ui.chat_background_url})`} : {}}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Vänster kolumn: konversationer */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-500" />
                  Konversationer ({conversations.length})
                </h3>
              </div>
              
              {isLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                </div>
              ) : (
                <div className="min-h-[calc(100vh-200px)] overflow-y-auto">
                  {conversations.slice(0, 9).map((conversation) => {
                    const otherUser = conversation.user1_id === user?.id ? conversation.profiles?.[1] : conversation.profiles?.[0];
                    const isLocked = lockedConversations.has(conversation.id);
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                        } ${isLocked ? 'border-l-4 border-l-red-400 bg-red-50' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-gray-300 rounded-sm" />
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {otherUser?.name || 'Okänd användare'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {otherUser?.location || 'Ingen plats'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {conversation.other_user?.online_status === 'online' && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                            {conversation.other_user?.online_status === 'away' && (
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            )}

                          </div>
                        </div>
                        
                        {conversation.last_message && (
                          <div className="ml-13">
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.last_message.content}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(conversation.last_message_at).toLocaleTimeString('sv-SE', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {conversations.length > 9 && (
                    <div className="p-4 text-sm text-gray-600 border-t">Pending {conversations.length - 9}</div>
                  )}
                  
                  {conversations.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Inga konversationer tillgängliga</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedConversation.other_user?.name || 'Användare'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedConversation.other_user?.location || 'Ingen plats'} • 
                          {selectedConversation.other_user?.online_status === 'online' ? 'Online' : 'Frånvarande'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 border rounded-lg text-sm">Om Mig</button>
                      <button className="px-3 py-1 border rounded-lg text-sm">Bilder</button>
                      <button className="px-3 py-1 border rounded-lg text-sm">Favorit</button>
                      <button className="px-3 py-1 border rounded-lg text-sm">Blockera</button>
                      {otherCoinBalance !== null && (
                        <div className="px-3 py-1 rounded-lg text-sm bg-yellow-100 text-yellow-700">Mynt: {otherCoinBalance}</div>
                      )}
                      
                    </div>
                  </div>
                </div>

                <div className="px-4 pt-3 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900">Anteckning (chatt)</h3>
                    <textarea
                      value={noteText}
                      onChange={(e) => { setNoteText(e.target.value); debouncedSave(e.target.value); }}
                      className="w-full h-28 border border-gray-300 rounded-lg p-3 resize-y"
                      placeholder="Skriv anteckningar här"
                    />
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${message.sender_id === user?.id ? 'text-blue-100' : 'text-green-100'}`}>
                          {new Date(message.created_at).toLocaleTimeString('sv-SE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Inga meddelanden ännu</p>
                      <p className="text-sm">Börja konversationen!</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Skriv ett meddelande..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="p-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                    title="Emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowMedia(!showMedia)}
                    className="p-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                    title="Bild/GIF"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                  {selectedConversation && (
                    <button
                      onClick={() => toggleConversationLock(selectedConversation.id)}
                      className={`p-2 rounded-lg ${
                        lockedConversations.has(selectedConversation.id)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      title={lockedConversations.has(selectedConversation.id) ? 'Lås upp' : 'Lås'}
                    >
                      {lockedConversations.has(selectedConversation.id) ? (
                        <Unlock className="h-5 w-5" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </button>
                  )}
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
                      <input
                        type="url"
                        placeholder="Klistra in bild/GIF URL"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded"
                      />
                      <button onClick={handleSendMediaUrl} className="px-3 py-2 bg-blue-600 text-white rounded">Skicka</button>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <input type="file" accept="image/*" onChange={(e) => e.target.files && handleUploadImage(e.target.files[0])} className="border rounded px-3 py-2 w-full" />
                      <span className="text-xs text-gray-500">{uploading ? 'Uppladdar...' : ''}</span>
                    </div>
                  </div>
                )}
              </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Välj en konversation för att starta chatt</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {lockedConversations.size > 0 && (
                      <>Du har {lockedConversations.size} låsta konversationer</>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {selectedConversation && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-900">Aktuell Player</h3>
                <div className="mt-3 flex items-start space-x-3">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center overflow-hidden">
                    <User className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {selectedConversation.profiles?.find((p: any) => p.is_operator_profile)?.name || 'Profil'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedConversation.profiles?.find((p: any) => p.is_operator_profile)?.age || ''} • {selectedConversation.profiles?.find((p: any) => p.is_operator_profile)?.location || ''}
                    </div>
                    <div className="mt-2 max-h-24 overflow-y-auto text-sm text-gray-700">
                      {selectedConversation.profiles?.find((p: any) => p.is_operator_profile)?.bio || ''}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Anteckning (player)</h3>
              <textarea
                value={playerNoteText}
                onChange={(e) => { setPlayerNoteText(e.target.value); debouncedSavePlayer(e.target.value); }}
                className="w-full h-28 border border-gray-300 rounded-lg p-3 resize-y overflow-auto"
                placeholder="Beständig anteckning för din kvinnliga profil"
              />
            </div>
            

            

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Online</h3>
              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto mt-3">
                {targetsOnline.map((t) => (
                  <button key={t.id} onClick={() => openStartModal(t)} className="relative text-left rounded-lg overflow-hidden group">
                    <div className="w-full h-24 bg-gray-200">
                      {targetPhotos[t.id] ? (
                        <img src={targetPhotos[t.id] as any} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100" />
                      )}
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 bg-black/40 text-white px-2 py-1 text-xs ${t.online_status==='offline' ? 'opacity-60' : ''}`}>{t.name} • {t.age}</div>
                  </button>
                ))}
                {targetsOnline.length === 0 && (
                  <div className="text-sm text-gray-500">Inga kunder online</div>
                )}
              </div>
            </div>

            {showStartModal && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Välj profil att chatta med {selectedTarget?.name}</h3>
                    <button onClick={() => setShowStartModal(false)} className="text-gray-500">✕</button>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {operatorProfiles.map((p) => (
                      <button key={p.id} onClick={() => startOrResumeChat(p)} className="border rounded-lg p-2 flex items-center gap-2 text-left">
                        <div className="w-8 h-8 bg-pink-200 rounded-full" />
                        <div>
                          <div className="text-sm font-medium">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.age}</div>
                        </div>
                      </button>
                    ))}
                    {operatorProfiles.length === 0 && (
                      <div className="text-sm text-gray-500">Inga profiler tilldelade</div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-200 text-right">
                    <button onClick={() => setShowStartModal(false)} className="px-3 py-2 border rounded">Stäng</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorChatPage;
