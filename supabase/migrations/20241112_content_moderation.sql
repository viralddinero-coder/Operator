-- Create user_reports table for content moderation
CREATE TABLE user_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can't report the same user multiple times
  UNIQUE(reporter_id, reported_user_id)
);

-- Create index for faster queries
CREATE INDEX idx_user_reports_reporter_id ON user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported_user_id ON user_reports(reported_user_id);
CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_created_at ON user_reports(created_at);

-- Add is_flagged column to messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'messages' AND column_name = 'is_flagged') THEN
    ALTER TABLE messages ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add is_blocked column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'is_blocked') THEN
    ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN blocked_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_user_reports_updated_at
  BEFORE UPDATE ON user_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reports
-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON user_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admins can update all reports
CREATE POLICY "Admins can update all reports" ON user_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Users can create reports
CREATE POLICY "Users can create reports" ON user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON user_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Grant permissions
GRANT ALL ON user_reports TO authenticated;
GRANT SELECT ON user_reports TO anon;

-- Grant permissions for messages table updates (for flagging)
GRANT UPDATE ON messages TO authenticated;

-- Grant permissions for users table updates (for blocking)
GRANT UPDATE ON users TO authenticated;