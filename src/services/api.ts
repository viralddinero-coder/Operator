import { supabase } from '../lib/supabase';
import { User, Profile, Message, Conversation, CoinTransaction, Photo } from '../types';

// Authentication Service
export const authService = {
  async signUp(email: string, password: string, userData: Partial<Profile>) {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user created');

      // Create user record in our users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          role: 'user',
          is_verified: false,
          is_active: true,
        });

      if (userError) throw userError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          site_id: userData.site_id || 'default-site-id',
          name: userData.name || '',
          age: userData.age || 18,
          gender: userData.gender || 'other',
          location: userData.location || '',
          bio: userData.bio || null,
          interests: userData.interests || [],
          online_status: 'offline',
          is_profile_complete: false,
        });

      if (profileError) throw profileError;

      return { user: authData.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      return { user: null, session: null, error };
    }
  },

  async signInWithIdentifier(identifier: string, password: string, role?: 'user'|'operator'|'admin') {
    try {
      let email = identifier
      if (!identifier.includes('@')) {
        const { email: mapped } = await userService.getEmailByUsername(identifier, role)
        email = mapped || ''
      }
      return await this.signIn(email, password)
    } catch (error) {
      return { user: null, session: null, error }
    }
  },

  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!authUser) return { user: null, error: null };

      // Get user data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (profileError) throw profileError;

      // Combine user and profile data
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: profileData.name,
        role: userData.role,
        is_verified: userData.is_verified,
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  async getUserProfile(userId: string) {
    try {
      // Get user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Combine user and profile data
      const user = {
        id: userData.id,
        email: userData.email,
        name: profileData.name,
        role: userData.role,
        is_verified: userData.is_verified,
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };

      return { user, profile: profileData, error: null };
    } catch (error) {
      return { user: null, profile: null, error };
    }
  },

  async updateUserProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};

// Profile Service
export const profileService = {
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      return { profile: null, error };
    }
  },

  async getProfiles(filters?: any) {
    try {
      let query = supabase
        .from('profiles')
        .select(`*, users!inner(email, is_active)`)
        .eq('users.is_active', true);

      if (filters?.age_min) {
        query = query.gte('age', filters.age_min);
      }
      if (filters?.age_max) {
        query = query.lte('age', filters.age_max);
      }
      if (filters?.gender) {
        query = query.in('gender', filters.gender);
      }
      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters?.online_only) {
        query = query.eq('online_status', 'online');
      }

      const { data, error } = await query;
      if (error) throw error;

      return { profiles: data || [], error: null };
    } catch (error) {
      return { profiles: [], error };
    }
  },

  async updateOnlineStatus(userId: string, status: 'online' | 'offline' | 'away') {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          online_status: status, 
          last_seen: status === 'online' ? null : new Date().toISOString() 
        })
        .eq('user_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
}

// Content Moderation Service
export const moderationService = {
  async createUserReport(reportedUserId: string, reason: string, description?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason,
          description,
          status: 'pending'
        })
        .select(`
          *,
          reporter:reporter_id(name, email),
          reported_user:reported_user_id(name, email)
        `)
        .single();

      if (error) throw error;
      return { report: data, error: null };
    } catch (error) {
      return { report: null, error };
    }
  },

  async getUserReports(status?: 'pending' | 'resolved' | 'dismissed') {
    try {
      let query = supabase
        .from('user_reports')
        .select(`
          *,
          reporter:reporter_id(name, email),
          reported_user:reported_user_id(name, email)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { reports: data || [], error: null };
    } catch (error) {
      return { reports: [], error };
    }
  },

  async updateReportStatus(reportId: string, status: 'resolved' | 'dismissed') {
    try {
      const { data, error } = await supabase
        .from('user_reports')
        .update({ status })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return { report: data, error: null };
    } catch (error) {
      return { report: null, error };
    }
  },

  async blockUser(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_blocked: true, 
          blocked_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async flagMessage(messageId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_flagged: true })
        .eq('id', messageId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async getFlaggedMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(name, email)
        `)
        .eq('is_flagged', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { messages: data || [], error: null };
    } catch (error) {
      return { messages: [], error };
    }
  },

  async unflagMessage(messageId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_flagged: false })
        .eq('id', messageId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
}

// Operator Service
export const operatorService = {
  async createOperatorProfile(input: {
    name: string;
    age: number;
    gender: 'female';
    location: string;
    bio?: string;
    status: 'online' | 'offline' | 'switching';
    assigned_operator_id?: string | null;
    site_id: string;
  }) {
    try {
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .insert({
          email: `${Date.now()}+operator_profile@example.com`,
          role: 'operator',
          is_verified: true,
          is_active: true,
        })
        .select()
        .single();

      if (userErr) throw userErr;

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userRow.id,
          site_id: input.site_id,
          name: input.name,
          age: input.age,
          gender: input.gender,
          location: input.location,
          bio: input.bio,
          online_status: input.status === 'online' ? 'online' : 'offline',
          is_profile_complete: true,
          is_operator_profile: true,
          assigned_operator_id: input.assigned_operator_id || null,
          status: input.status
        })
        .select()
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      return { profile: null, error };
    }
  },

  async getOperatorProfiles(operatorId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_operator_profile', true)
        .eq('assigned_operator_id', operatorId);
      if (error) throw error;
      return { profiles: data || [], error: null };
    } catch (error) {
      return { profiles: [], error };
    }
  },

  async pushProfileToPool(profileId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_operator_id: null, status: 'switching' })
        .eq('id', profileId);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async setProfileStatus(profileId: string, status: 'online' | 'offline' | 'switching') {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', profileId);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async getTargetsOnlineForOperator() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, users!inner(role, is_active)')
        .eq('users.role', 'user')
        .eq('users.is_active', true)
        .eq('online_status', 'online');

      if (error) throw error;
      return { profiles: data || [], error: null };
    } catch (error) {
      return { profiles: [], error };
    }
  },

  async getFemaleProfilesOnlineForTarget() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gender', 'female')
        .eq('status', 'online');

      if (error) throw error;
      return { profiles: data || [], error: null };
    } catch (error) {
      return { profiles: [], error };
    }
  }
  ,
  async getPlayerNote(operatorId: string, profileId: string) {
    try {
      const { data, error } = await supabase
        .from('operator_profile_notes')
        .select('*')
        .eq('operator_id', operatorId)
        .eq('profile_id', profileId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return { note: data || null, error: null };
    } catch (error) {
      return { note: null, error };
    }
  },

  async setPlayerNote(operatorId: string, profileId: string, noteText: string) {
    try {
      const existing = await supabase
        .from('operator_profile_notes')
        .select('id')
        .eq('operator_id', operatorId)
        .eq('profile_id', profileId)
        .limit(1)
        .maybeSingle();

      if (existing.data?.id) {
        const { data, error } = await supabase
          .from('operator_profile_notes')
          .update({ note_text: noteText })
          .eq('id', existing.data.id)
          .select()
          .single();
        if (error) throw error;
        return { note: data, error: null };
      }

      const { data, error } = await supabase
        .from('operator_profile_notes')
        .insert({ operator_id: operatorId, profile_id: profileId, note_text: noteText })
        .select()
        .single();
      if (error) throw error;
      return { note: data, error: null };
    } catch (error) {
      return { note: null, error };
    }
  }
  ,
  async getOperatorProfilesForAdmin() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_operator_profile', true)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return { profiles: data || [], error: null }
    } catch (error) {
      return { profiles: [], error }
    }
  }
};

// Chat Service
export const chatService = {
  async getConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *, 
          messages!inner(*),
          profiles!conversations_user1_id_fkey(*),
          profiles!conversations_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return { conversations: data || [], error: null };
    } catch (error) {
      return { conversations: [], error };
    }
  },

  async getOperatorConversations(operatorId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *, 
          messages!inner(*),
          operator_locks!inner(*)
        `)
        .eq('operator_locks.operator_id', operatorId)
        .eq('operator_locks.is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      // Get user profiles for each conversation
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conversation) => {
          const { data: user1Profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', conversation.user1_id)
            .single();
          
          const { data: user2Profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', conversation.user2_id)
            .single();

          return {
            ...conversation,
            profiles: [user1Profile, user2Profile]
          };
        })
      );

      return { conversations: enrichedConversations, error: null };
    } catch (error) {
      return { conversations: [], error };
    }
  },

  async lockConversationForOperator(conversationId: string, operatorId: string) {
    try {
      const { data, error } = await supabase
        .from('operator_locks')
        .insert({
          conversation_id: conversationId,
          operator_id: operatorId,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { lock: data, error: null };
    } catch (error) {
      return { lock: null, error };
    }
  },

  async unlockConversation(conversationId: string, operatorId: string) {
    try {
      const { error } = await supabase
        .from('operator_locks')
        .update({ is_active: false })
        .eq('conversation_id', conversationId)
        .eq('operator_id', operatorId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async getAvailableConversationsForOperator(siteId: string, operatorId: string) {
    try {
      // Hämta konversationer som inte är låsta av andra operatörer
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *, 
          messages!inner(*),
          profiles!conversations_user1_id_fkey(*),
          profiles!conversations_user2_id_fkey(*)
        `)
        .eq('site_id', siteId)
        .not('id', 'in', 
          supabase.from('operator_locks')
            .select('conversation_id')
            .eq('is_active', true)
            .neq('operator_id', operatorId)
        )
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return { conversations: data || [], error: null };
    } catch (error) {
      return { conversations: [], error };
    }
  },

  async getMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { messages: data || [], error: null };
    } catch (error) {
      return { messages: [], error };
    }
  },

  async sendMessage(message: Partial<Message>) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return { message: data, error: null };
    } catch (error) {
      return { message: null, error };
    }
  },

  async createConversation(user1Id: string, user2Id: string, siteId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
          site_id: siteId,
        })
        .select()
        .single();

      if (error) throw error;
      return { conversation: data, error: null };
    } catch (error) {
      return { conversation: null, error };
    }
  }
  ,
  async getOperatorNotes(operatorId: string, conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('operator_notes')
        .select('*')
        .eq('operator_id', operatorId)
        .eq('conversation_id', conversationId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return { note: data || null, error: null };
    } catch (error) {
      return { note: null, error };
    }
  },

  async upsertOperatorNote(operatorId: string, conversationId: string, noteText: string) {
    try {
      const existing = await supabase
        .from('operator_notes')
        .select('id')
        .eq('operator_id', operatorId)
        .eq('conversation_id', conversationId)
        .limit(1)
        .maybeSingle();

      if (existing.data?.id) {
        const { data, error } = await supabase
          .from('operator_notes')
          .update({ note_text: noteText })
          .eq('id', existing.data.id)
          .select()
          .single();
        if (error) throw error;
        return { note: data, error: null };
      }

      const { data, error } = await supabase
        .from('operator_notes')
        .insert({ operator_id: operatorId, conversation_id: conversationId, note_text: noteText })
        .select()
        .single();
      if (error) throw error;
      return { note: data, error: null };
    } catch (error) {
      return { note: null, error };
    }
  }
};

// Coin Service
export const userService = {
  async getUsers(searchTerm?: string, limit: number = 50, offset: number = 0) {
    try {
      let query = supabase
        .from('users')
        .select(`*, profiles!inner(name)`)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (searchTerm) {
        query = query.ilike('profiles.name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get user statistics for each user
      const usersWithStats = await Promise.all(
        (data || []).map(async (user: any) => {
          const stats = await this.getUserStats(user.id);
          return {
            ...user,
            username: user.profiles?.name || 'Unknown',
            coin_balance: stats.balance,
            total_burned_coins: stats.totalBurned,
            total_spent_usd: stats.totalSpentUSD
          };
        })
      );

      return { users: usersWithStats, error: null };
    } catch (error) {
      return { users: [], error };
    }
  },

  async getUserStats(userId: string) {
    try {
      // Get current balance
      const balanceResult = await coinService.getCoinBalance(userId);
      
      // Get total burned coins (spent)
      const { data: burnedData, error: burnedError } = await supabase
        .from('coin_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('transaction_type', 'spend');

      if (burnedError) throw burnedError;

      const totalBurned = (burnedData || []).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      // Get total purchased coins to calculate total spent in USD
      const { data: purchasedData, error: purchasedError } = await supabase
        .from('coin_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('transaction_type', 'purchase');

      if (purchasedError) throw purchasedError;

      const totalPurchased = (purchasedData || []).reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate total spent in USD (assuming 1 coin = $0.10 for example)
      const totalSpentUSD = totalPurchased * 0.1;

      return { 
        balance: balanceResult.balance, 
        totalBurned, 
        totalSpentUSD,
        error: null 
      };
    } catch (error) {
      return { balance: 0, totalBurned: 0, totalSpentUSD: 0, error };
    }
  },

  async searchUsersByUsername(username: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, users!inner(email, role, is_verified, is_active, created_at)`)
        .ilike('name', `%${username}%`)
        .eq('users.role', 'user')
        .order('users.created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get user statistics for each user
      const usersWithStats = await Promise.all(
        (data || []).map(async (profile: any) => {
          const stats = await this.getUserStats(profile.user_id);
          return {
            id: profile.user_id,
            email: profile.users?.email || '',
            username: profile.name,
            role: profile.users?.role || 'user',
            is_verified: profile.users?.is_verified || false,
            is_active: profile.users?.is_active || true,
            created_at: profile.users?.created_at,
            coin_balance: stats.balance,
            total_burned_coins: stats.totalBurned,
            total_spent_usd: stats.totalSpentUSD
          };
        })
      );

      return { users: usersWithStats, error: null };
    } catch (error) {
      return { users: [], error };
    }
  },

  async updateUserPassword(userId: string, newPassword: string) {
    try {
      // Only admin can update user passwords
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('Not authenticated');
      
      // Check if current user is admin
      const { data: adminData } = await supabase
        .from('users')
        .select('role')
        .eq('id', adminUser.id)
        .single();
      
      if (adminData?.role !== 'admin') {
        throw new Error('Only administrators can update user passwords');
      }

      // Update password using admin API
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async updateUserEmailVerification(userId: string, isVerified: boolean) {
    try {
      // Only admin can update email verification status
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('Not authenticated');
      
      // Check if current user is admin
      const { data: adminData } = await supabase
        .from('users')
        .select('role')
        .eq('id', adminUser.id)
        .single();
      
      if (adminData?.role !== 'admin') {
        throw new Error('Only administrators can update email verification status');
      }

      // Update user verification status
      const { error } = await supabase
        .from('users')
        .update({ is_verified: isVerified })
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async getEmailByUsername(username: string, role?: 'user'|'operator'|'admin') {
    try {
      let query = supabase.from('users').select('id,email,role,username').eq('username', username).limit(1)
      if (role) query = query.eq('role', role)
      const { data, error } = await query
      if (error) throw error
      const row = (data || [])[0]
      return { email: row?.email || '', user: row || null, error: null }
    } catch (error) {
      return { email: '', user: null, error }
    }
  }
};

export const coinService = {
  async getCoinBalance(userId: string) {
    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('coins_balance_after')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { balance: data?.coins_balance_after || 0, error: null };
    } catch (error) {
      return { balance: 0, error };
    }
  },

  async spendCoins(userId: string, amount: number, description: string, relatedMessageId?: string) {
    try {
      const currentBalance = await this.getCoinBalance(userId);
      if (currentBalance.balance < amount) {
        throw new Error('Insufficient coins');
      }

      const { data, error } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'spend',
          amount: -amount,
          coins_balance_after: currentBalance.balance - amount,
          description,
          related_message_id: relatedMessageId,
        })
        .select()
        .single();

      if (error) throw error;
      return { transaction: data, error: null };
    } catch (error) {
      return { transaction: null, error };
    }
  },

  async addCoins(userId: string, amount: number, description: string, paymentId?: string) {
    try {
      const currentBalance = await this.getCoinBalance(userId);
      
      const { data, error } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'purchase',
          amount,
          coins_balance_after: currentBalance.balance + amount,
          description,
          payment_id: paymentId,
        })
        .select()
        .single();

      if (error) throw error;
      return { transaction: data, error: null };
    } catch (error) {
      return { transaction: null, error };
    }
  }
};

// Site Service
export const siteService = {
  async getSiteByDomain(domain: string) {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('domain', domain)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { site: data, error: null };
    } catch (error) {
      return { site: null, error };
    }
  },

  async getAllSites() {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { sites: data || [], error: null };
    } catch (error) {
      return { sites: [], error };
    }
  }
};

// Photo Service
export const photoService = {
  async uploadPhoto(file: File, userId: string, profileId: string) {
    try {
      const { sanitizeImage } = await import('../utils/imageSanitizer')
      const cleanBlob = await sanitizeImage(file)
      // Upload to Supabase Storage
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, cleanBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      // Create photo record
      const { data: photoData, error: photoError } = await supabase
        .from('photos')
        .insert({
          user_id: userId,
          profile_id: profileId,
          url: publicUrl,
          is_primary: false,
          is_approved: false,
          moderation_status: 'pending',
        })
        .select()
        .single();

      if (photoError) throw photoError;

      return { photo: photoData, error: null };
    } catch (error) {
      return { photo: null, error };
    }
  },

  async getPhotosByUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return { photos: data || [], error: null };
    } catch (error) {
      return { photos: [], error };
    }
  },

  async getPhotosByProfile(profileId: string) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('profile_id', profileId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return { photos: data || [], error: null };
    } catch (error) {
      return { photos: [], error };
    }
  },

  async setPhotoBlur(photoId: string, isBlurred: boolean, blurLevel?: number) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update({ is_blurred: isBlurred, blur_level: blurLevel ?? 6 })
        .eq('id', photoId)
        .select()
        .single();
      if (error) throw error;
      return { photo: data, error: null };
    } catch (error) {
      return { photo: null, error };
    }
  },

  async moderatePhoto(photoId: string, status: 'approved' | 'rejected', moderatorId: string) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update({
          moderation_status: status,
          is_approved: status === 'approved',
          moderated_by: moderatorId,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', photoId)
        .select()
        .single();

      if (error) throw error;
      return { photo: data, error: null };
    } catch (error) {
      return { photo: null, error };
    }
  },

  async getPendingPhotos() {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select(`*, profiles!inner(name), users!inner(email)`)
        .eq('moderation_status', 'pending')
        .order('uploaded_at', { ascending: true });

      if (error) throw error;
      return { photos: data || [], error: null };
    } catch (error) {
      return { photos: [], error };
    }
  },

  async deletePhoto(photoId: string) {
    try {
      // Get photo info first
      const { data: photo, error: photoError } = await supabase
        .from('photos')
        .select('url')
        .eq('id', photoId)
        .single();

      if (photoError) throw photoError;

      // Delete from storage
      const fileName = photo.url.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('photos')
          .remove([fileName]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async setPrimaryPhoto(photoId: string, userId: string) {
    try {
      // Remove primary from all other photos
      await supabase
        .from('photos')
        .update({ is_primary: false })
        .eq('user_id', userId);

      // Set new primary photo
      const { data, error } = await supabase
        .from('photos')
        .update({ is_primary: true })
        .eq('id', photoId)
        .select()
        .single();

      if (error) throw error;
      return { photo: data, error: null };
    } catch (error) {
      return { photo: null, error };
    }
  }
};

export const mediaService = {
  async uploadMessageImage(file: File, senderId: string, conversationId: string) {
    try {
      const { sanitizeImage } = await import('../utils/imageSanitizer')
      const cleanBlob = await sanitizeImage(file)
      const fileName = `message_media/${senderId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, cleanBlob)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName)
      const { message, error } = await chatService.sendMessage({
        conversation_id: conversationId,
        sender_id: senderId,
        content: publicUrl,
        message_type: 'image',
        is_read: false,
        coins_cost: 0
      })
      if (error) throw error
      return { url: publicUrl, message, error: null }
    } catch (error) {
      return { url: '', message: null, error }
    }
  }
}

export const likeService = {
  async like(userId: string, targetUserId: string) {
    try {
      const { error } = await supabase.from('likes').insert({ user_id: userId, target_user_id: targetUserId })
      if (error && error.code !== '23505') throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  },
  async unlike(userId: string, targetUserId: string) {
    try {
      const { error } = await supabase.from('likes').delete().eq('user_id', userId).eq('target_user_id', targetUserId)
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  },
  async isLiked(userId: string, targetUserId: string) {
    try {
      const { data, error } = await supabase.from('likes').select('id').eq('user_id', userId).eq('target_user_id', targetUserId)
      if (error) throw error
      return { liked: (data || []).length > 0, error: null }
    } catch (error) {
      return { liked: false, error }
    }
  }
}

// Promotional System Service
export const promotionalService = {
  async getActiveCampaigns() {
    try {
      const { data, error } = await supabase
        .from('promotional_campaigns')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      return { campaigns: data || [], error: null };
    } catch (error) {
      return { campaigns: [], error };
    }
  },

  async getPromotionalCodes(campaignId?: string) {
    try {
      let query = supabase
        .from('promotional_codes')
        .select(`*, campaigns:promotional_campaigns(name)`)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return { codes: data || [], error: null };
    } catch (error) {
      return { codes: [], error };
    }
  },

  async validatePromotionalCode(code: string, userId?: string) {
    try {
      const { data: codeData, error: codeError } = await supabase
        .from('promotional_codes')
        .select(`*, campaigns:promotional_campaigns(name, is_active)`)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (codeError || !codeData) {
        throw new Error('Ogiltig eller utgången kod');
      }

      // Check if campaign is active
      if (!codeData.campaigns?.is_active) {
        throw new Error('Kampanjen är inte aktiv');
      }

      // Check if user has already used this code
      if (userId) {
        const { data: usageData } = await supabase
          .from('user_code_usage')
          .select('id')
          .eq('user_id', userId)
          .eq('code_id', codeData.id)
          .single();

        if (usageData) {
          throw new Error('Du har redan använt denna kod');
        }
      }

      // Check usage limits
      if (codeData.used_count >= codeData.max_uses) {
        throw new Error('Koden har nått max antal användningar');
      }

      return { code: codeData, error: null };
    } catch (error) {
      return { code: null, error };
    }
  },

  async usePromotionalCode(code: string, userId: string) {
    try {
      // Validate code first
      const { code: codeData, error: validationError } = await this.validatePromotionalCode(code, userId);
      if (validationError || !codeData) {
        throw validationError || new Error('Kunde inte validera koden');
      }

      // Start transaction-like process
      const { error: usageError } = await supabase
        .from('user_code_usage')
        .insert({
          user_id: userId,
          code_id: codeData.id
        });

      if (usageError) throw usageError;

      // Update usage count
      const { error: updateError } = await supabase
        .from('promotional_codes')
        .update({ used_count: codeData.used_count + 1 })
        .eq('id', codeData.id);

      if (updateError) throw updateError;

      // Apply the discount/bonus based on type
      let rewardDescription = '';
      let bonusCoins = 0;

      switch (codeData.discount_type) {
        case 'bonus_coins':
          bonusCoins = codeData.discount_value;
          rewardDescription = `${bonusCoins} bonus coins`;
          break;
        case 'percentage':
          rewardDescription = `${codeData.discount_value}% rabatt`;
          break;
        case 'fixed_amount':
          rewardDescription = `$${codeData.discount_value} rabatt`;
          break;
      }

      // Add bonus coins if applicable
      if (bonusCoins > 0) {
        const { error: coinError } = await coinService.addCoins(
          userId,
          bonusCoins,
          `Promotional code: ${code}`,
          `promo_${codeData.id}`
        );
        if (coinError) throw coinError;
      }

      return { 
        success: true, 
        rewardDescription,
        bonusCoins,
        error: null 
      };
    } catch (error) {
      return { success: false, rewardDescription: '', bonusCoins: 0, error };
    }
  },

  async createCampaign(name: string, description: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('promotional_campaigns')
        .insert({
          name,
          description,
          start_date: startDate,
          end_date: endDate,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return { campaign: data, error: null };
    } catch (error) {
      return { campaign: null, error };
    }
  },

  async createPromotionalCode(
    campaignId: string,
    code: string,
    discountType: 'percentage' | 'fixed_amount' | 'bonus_coins',
    discountValue: number,
    maxUses: number = 1,
    expiresAt: string
  ) {
    try {
      const { data, error } = await supabase
        .from('promotional_codes')
        .insert({
          campaign_id: campaignId,
          code: code.toUpperCase(),
          discount_type: discountType,
          discount_value: discountValue,
          max_uses: maxUses,
          expires_at: expiresAt,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return { code: data, error: null };
    } catch (error) {
      return { code: null, error };
    }
  },

  async updateCampaign(campaignId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('promotional_campaigns')
        .update(updates)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;
      return { campaign: data, error: null };
    } catch (error) {
      return { campaign: null, error };
    }
  }
};

// Support Configuration Service
export const supportService = {
  async getSupportConfiguration() {
    try {
      const { data, error } = await supabase
        .from('support_configuration')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { config: data || null, error: null };
    } catch (error) {
      return { config: null, error };
    }
  },

  async updateSupportConfiguration(config: any) {
    try {
      const { data, error } = await supabase
        .from('support_configuration')
        .upsert({
          ...config,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { config: data, error: null };
    } catch (error) {
      return { config: null, error };
    }
  },

  async testSMTPConnection(config: any) {
    try {
      if (!config?.host || !config?.port || !config?.from_email) {
        return { success: false, error: new Error('Ogiltig konfiguration') };
      }
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }
};

export const mailService = {
  async getMailConfigByDomain(domain: string) {
    try {
      const { site } = await siteService.getSiteByDomain(domain)
      if (!site) return { settings: null, smtp: null, error: null }
      const { data: ms } = await supabase.from('system_settings').select('value').eq('key', `site:${site.id}:mail_settings`).maybeSingle()
      const { data: sc } = await supabase.from('system_settings').select('value').eq('key', `site:${site.id}:smtp_config`).maybeSingle()
      return { settings: ms?.value || null, smtp: sc?.value || null, error: null }
    } catch (error) {
      return { settings: null, smtp: null, error }
    }
  },
  async send(templateKey: string, to: string, data: any, siteId?: string) {
    try {
      // Placeholder; in riktig drift anropa Edge Function för att skicka
      const { error } = await supabase.from('mail_logs').insert({ site_id: siteId || null, to_email: to, template_key: templateKey, payload: data, status: 'simulated' })
      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error }
    }
  }
}

// Message Templates Service
export const templateService = {
  async getMessageTemplates(type?: string) {
    try {
      let query = supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true);

      if (type) {
        query = query.eq('template_type', type);
      }

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      return { templates: data || [], error: null };
    } catch (error) {
      return { templates: [], error };
    }
  },

  async createMessageTemplate(template: any) {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return { template: data, error: null };
    } catch (error) {
      return { template: null, error };
    }
  },

  async updateMessageTemplate(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { template: data, error: null };
    } catch (error) {
      return { template: null, error };
    }
  },

  async deleteMessageTemplate(id: string) {
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
};

const getFunctionsBase = () => {
  try {
    const url = (supabase as any).url || (import.meta as any).env.VITE_SUPABASE_URL || ''
    const host = new URL(url).host
    const projectRef = host.split('.')[0]
    return `https://${projectRef}.functions.supabase.co`
  } catch {
    return (import.meta as any).env.VITE_FUNCTIONS_BASE || ''
  }
}

export const accountService = {
  async createUserServer(username: string, password: string, role: 'admin'|'operator'|'user') {
    try {
      const base = getFunctionsBase()
      const resp = await fetch(`${base}/createUser`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, role }) })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed')
      return { userId: data.id as string, email: data.email as string, error: null }
    } catch (error) {
      return { userId: '', email: '', error }
    }
  },
  async updatePasswordServer(userId: string, password: string) {
    try {
      const base = getFunctionsBase()
      const resp = await fetch(`${base}/updatePassword`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, password }) })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed')
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error }
    }
  }
}

// Coin Packages Service
export const coinPackageService = {
  async getCoinPackages(activeOnly: boolean = true) {
    try {
      let query = supabase
        .from('coin_packages')
        .select('*');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query
        .order('sort_order', { ascending: true })
        .order('coin_amount', { ascending: true });

      if (error) throw error;
      return { packages: data || [], error: null };
    } catch (error) {
      return { packages: [], error };
    }
  },

  async getCoinPackagesForSite(siteId: string, activeOnly: boolean = true) {
    try {
      let query = supabase
        .from('coin_packages')
        .select('*')
        .eq('site_id', siteId);
      if (activeOnly) query = query.eq('is_active', true);
      const { data, error } = await query
        .order('sort_order', { ascending: true })
        .order('coin_amount', { ascending: true });
      if (error) throw error;
      return { packages: data || [], error: null };
    } catch (error) {
      return { packages: [], error };
    }
  },

  async createCoinPackage(pkg: any) {
    try {
      const { data, error } = await supabase
        .from('coin_packages')
        .insert(pkg)
        .select()
        .single();

      if (error) throw error;
      return { package: data, error: null };
    } catch (error) {
      return { package: null, error };
    }
  },

  async updateCoinPackage(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('coin_packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { package: data, error: null };
    } catch (error) {
      return { package: null, error };
    }
  },

  async deleteCoinPackage(id: string) {
    try {
      const { error } = await supabase
        .from('coin_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
};

export default {
  authService,
  profileService,
  chatService,
  coinService,
  siteService,
  photoService,
  moderationService,
  operatorService,
  userService,
  promotionalService,
  supportService,
  templateService,
  coinPackageService,
};
export const albumService = {
  async createAlbum(profileId: string, name: string) {
    try {
      const { data, error } = await supabase
        .from('profile_albums')
        .insert({ profile_id: profileId, name })
        .select()
        .single()
      if (error) throw error
      return { album: data, error: null }
    } catch (error) {
      return { album: null, error }
    }
  },
  async addPhotosToAlbum(albumId: string, photoIds: string[]) {
    try {
      const rows = photoIds.map(pid => ({ album_id: albumId, photo_id: pid }))
      const { error } = await supabase.from('album_photos').insert(rows)
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  },
  async getAlbumsByProfile(profileId: string) {
    try {
      const { data, error } = await supabase.from('profile_albums').select('*').eq('profile_id', profileId)
      if (error) throw error
      return { albums: data || [], error: null }
    } catch (error) {
      return { albums: [], error }
    }
  }
}
export const massMessageService = {
  async start(siteId: string, profileId: string, text: string, ratePerMin: number) {
    try {
      const { data: job, error } = await supabase
        .from('mass_messages')
        .insert({ site_id: siteId, profile_id: profileId, message_text: text, rate_per_min: ratePerMin, status: 'running', started_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      const { data: targets } = await supabase
        .from('profiles')
        .select('id,user_id')
        .eq('site_id', siteId)
        .eq('is_operator_profile', false)
      const intervalMs = Math.max(1000, Math.floor(60000 / Math.max(1, ratePerMin)))
      let count = 0
      for (const t of (targets || [])) {
        // create or reuse conversation
        const { data: existing } = await supabase
          .from('conversations')
          .select('id,user1_id,user2_id')
          .or(`and(user1_id.eq.${t.user_id},user2_id.eq.${profileId}),and(user1_id.eq.${profileId},user2_id.eq.${t.user_id})`)
          .limit(1)
        let convId = existing?.[0]?.id
        if (!convId) {
          const { data: conv } = await supabase
            .from('conversations')
            .insert({ user1_id: profileId, user2_id: t.user_id, site_id: siteId, is_active: true })
            .select()
            .single()
          convId = conv?.id
        }
        if (!convId) continue
        await new Promise(r => setTimeout(r, intervalMs))
        const { error: sendErr } = await supabase
          .from('messages')
          .insert({ conversation_id: convId, sender_id: profileId, recipient_id: t.user_id, content: text, message_type: 'text', is_read: false, coins_cost: 0 })
        if (!sendErr) count++
        await supabase.from('mass_messages').update({ sent_count: count }).eq('id', job.id)
      }
      await supabase.from('mass_messages').update({ status: 'completed', completed_at: new Date().toISOString(), total_targets: (targets || []).length }).eq('id', job.id)
      return { job, error: null }
    } catch (error) {
      return { job: null, error }
    }
  }
}
