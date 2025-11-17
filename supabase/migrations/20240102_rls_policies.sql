-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_assignments ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow user to insert their own row on sign-up
CREATE POLICY "Users can create themselves" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Profiles table policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Operators can view all profiles on their sites" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM operator_assignments 
      WHERE operator_id = auth.uid() 
      AND site_id = profiles.site_id 
      AND is_active = true
    )
  );

-- Messages table policies
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = messages.conversation_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = messages.conversation_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Operators can view all messages on their sites" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM operator_assignments oa
      JOIN conversations c ON c.id = messages.conversation_id
      WHERE oa.operator_id = auth.uid() 
      AND oa.site_id = c.site_id 
      AND oa.is_active = true
    )
  );

-- Conversations table policies
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Operators can view conversations on their sites" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM operator_assignments 
      WHERE operator_id = auth.uid() 
      AND site_id = conversations.site_id 
      AND is_active = true
    )
  );

-- Coin transactions policies
CREATE POLICY "Users can view their own transactions" ON coin_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own transactions" ON coin_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Sites table policies
CREATE POLICY "Sites are viewable by everyone" ON sites
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sites" ON sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Photos table policies
CREATE POLICY "Photos are viewable by everyone" ON photos
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view their own photos" ON photos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own photos" ON photos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own photos" ON photos
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins and operators can moderate photos" ON photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'operator')
    )
  );

-- Reports table policies
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Admins and operators can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'operator')
    )
  );

-- Operator assignments policies
CREATE POLICY "Admins can manage operator assignments" ON operator_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Operators can view their own assignments" ON operator_assignments
  FOR SELECT USING (operator_id = auth.uid());

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON sites TO anon;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON photos TO anon;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
