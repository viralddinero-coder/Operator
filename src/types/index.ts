export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'operator' | 'admin';
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  site_id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  location: string;
  bio?: string;
  interests?: string[];
  online_status: 'online' | 'offline' | 'away';
  last_seen?: string;
  is_profile_complete: boolean;
  photos?: Photo[];
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  profile_id: string;
  url: string;
  thumbnail_url?: string;
  is_primary: boolean;
  is_approved: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: 'text' | 'image' | 'emoji';
  is_read: boolean;
  coins_cost: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  site_id: string;
  last_message_at: string;
  is_active: boolean;
  created_at: string;
  last_message?: Message;
  other_user?: Profile;
  profiles?: Profile[];
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  transaction_type: 'purchase' | 'spend' | 'refund' | 'bonus';
  amount: number;
  coins_balance_after: number;
  related_message_id?: string;
  payment_id?: string;
  description?: string;
  created_at: string;
}

export interface Site {
  id: string;
  name: string;
  domain: string;
  theme: string;
  primary_color: string;
  secondary_color: string;
  background_image_url?: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CoinPackage {
  id: string;
  name: string;
  price: number;
  coins: number;
  currency: string;
  is_active: boolean;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  age_min?: number;
  age_max?: number;
  gender?: string[];
  location?: string;
  interests?: string[];
  online_only?: boolean;
  with_photos?: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PromotionalCampaign {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionalCode {
  id: string;
  campaign_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'bonus_coins';
  discount_value: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  campaigns?: {
    name: string;
  };
}

export interface SupportConfiguration {
  id: string;
  support_email: string;
  support_phone?: string;
  support_hours?: string;
  response_time_target?: number;
  is_active: boolean;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  template_type: 'welcome' | 'seasonal' | 'promotional' | 'system';
  subject?: string;
  content: string;
  variables?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}