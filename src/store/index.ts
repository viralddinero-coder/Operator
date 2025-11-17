import { create } from 'zustand';
import { User, Profile, Conversation, Message, SearchFilters } from '../types';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

interface ChatStore {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

interface SearchStore {
  filters: SearchFilters;
  results: Profile[];
  isLoading: boolean;
  error: string | null;
  setFilters: (filters: SearchFilters) => void;
  setResults: (results: Profile[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

interface UIStore {
  sidebarOpen: boolean;
  showHiddenAdmin: boolean;
  theme: 'light' | 'dark';
  currentOperatorProfileId?: string | null;
  setSidebarOpen: (open: boolean) => void;
  setShowHiddenAdmin: (show: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrentOperatorProfileId: (id: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => set({ 
    user: null, 
    profile: null, 
    isAuthenticated: false,
    error: null 
  })
}));

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (activeConversation) => set({ activeConversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));

export const useSearchStore = create<SearchStore>((set) => ({
  filters: {},
  results: [],
  isLoading: false,
  error: null,
  setFilters: (filters) => set({ filters }),
  setResults: (results) => set({ results }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  showHiddenAdmin: false,
  theme: 'light',
  currentOperatorProfileId: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setShowHiddenAdmin: (showHiddenAdmin) => set({ showHiddenAdmin }),
  setTheme: (theme) => set({ theme }),
  setCurrentOperatorProfileId: (id) => set({ currentOperatorProfileId: id })
}));
