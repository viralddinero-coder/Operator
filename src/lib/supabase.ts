import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmuqvdduyjcamtsuybgx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptdXF2ZGR1eWpjYW10c3V5Ymd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5Mzc3OTIsImV4cCI6MjA3ODUxMzc5Mn0.BQxUgI5-vOPg2ZeHQDw0L76xx0IgN_pTazcXdhjlw9E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'user' | 'operator' | 'admin';
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: 'user' | 'operator' | 'admin';
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'user' | 'operator' | 'admin';
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          site_id: string;
          name: string;
          age: number;
          gender: 'male' | 'female' | 'other';
          location: string;
          bio: string | null;
          interests: string[] | null;
          online_status: 'online' | 'offline' | 'away';
          last_seen: string | null;
          is_profile_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          site_id: string;
          name: string;
          age: number;
          gender: 'male' | 'female' | 'other';
          location: string;
          bio?: string | null;
          interests?: string[] | null;
          online_status?: 'online' | 'offline' | 'away';
          last_seen?: string | null;
          is_profile_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          site_id?: string;
          name?: string;
          age?: number;
          gender?: 'male' | 'female' | 'other';
          location?: string;
          bio?: string | null;
          interests?: string[] | null;
          online_status?: 'online' | 'offline' | 'away';
          last_seen?: string | null;
          is_profile_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          message_type: 'text' | 'image' | 'emoji';
          is_read: boolean;
          coins_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'emoji';
          is_read?: boolean;
          coins_cost?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          recipient_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'emoji';
          is_read?: boolean;
          coins_cost?: number;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          site_id: string;
          last_message_at: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          site_id: string;
          last_message_at?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          site_id?: string;
          last_message_at?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      coin_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: 'purchase' | 'spend' | 'refund' | 'bonus';
          amount: number;
          coins_balance_after: number;
          related_message_id: string | null;
          payment_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: 'purchase' | 'spend' | 'refund' | 'bonus';
          amount: number;
          coins_balance_after: number;
          related_message_id?: string | null;
          payment_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_type?: 'purchase' | 'spend' | 'refund' | 'bonus';
          amount?: number;
          coins_balance_after?: number;
          related_message_id?: string | null;
          payment_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      sites: {
        Row: {
          id: string;
          name: string;
          domain: string;
          theme: string;
          primary_color: string;
          secondary_color: string;
          background_image_url: string | null;
          logo_url: string | null;
          description: string | null;
          is_active: boolean;
          settings: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain: string;
          theme?: string;
          primary_color?: string;
          secondary_color?: string;
          background_image_url?: string | null;
          logo_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          settings?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string;
          theme?: string;
          primary_color?: string;
          secondary_color?: string;
          background_image_url?: string | null;
          logo_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          settings?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}