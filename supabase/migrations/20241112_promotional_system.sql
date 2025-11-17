-- Create promotional campaigns and codes tables
CREATE TABLE promotional_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promotional codes table
CREATE TABLE promotional_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'bonus_coins')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_for_user_ids UUID[] DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user code usage tracking
CREATE TABLE user_code_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES promotional_codes(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, code_id)
);

-- Create support configuration table
CREATE TABLE support_configuration (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  support_email VARCHAR(255) NOT NULL DEFAULT 'support@example.com',
  support_phone VARCHAR(20),
  support_hours TEXT DEFAULT 'Mån-Fre 9-17',
  auto_reply_enabled BOOLEAN DEFAULT true,
  auto_reply_template TEXT DEFAULT 'Tack för ditt meddelande. Vi återkommer inom 24 timmar.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message templates table
CREATE TABLE message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('seasonal', 'promotional', 'support', 'welcome', 'inactive_user')),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coin packages table for admin management
CREATE TABLE coin_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  coin_amount INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  bonus_coins INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default coin packages
INSERT INTO coin_packages (name, coin_amount, price_usd, bonus_coins, sort_order) VALUES
('Starter Pack', 100, 9.99, 10, 1),
('Basic Pack', 250, 19.99, 25, 2),
('Premium Pack', 500, 39.99, 75, 3),
('Mega Pack', 1000, 74.99, 200, 4),
('Ultra Pack', 2500, 149.99, 750, 5);

-- Insert default message templates
INSERT INTO message_templates (name, template_type, subject, content, variables) VALUES
('Christmas Greeting', 'seasonal', '🎄 God Jul från vårt team!', 'Hej {name}! 🎄

Vi önskar dig en riktigt God Jul och ett Gott Nytt År!
Som en liten gåva har vi lagt till {bonus_coins} bonus coins till ditt konto.

Varma hälsningar,
Teamet', '{"name": "user_name", "bonus_coins": "50"}'),

('Easter Special', 'seasonal', '🐣 Påskspecial - Bonus Coins!', 'Glad Påsk {name}! 🐣

Vi vill önska dig en glad påsk med en speciell bonus!
Använd koden {code} för att få {bonus_coins} extra coins.

Koden gäller till {expires_at}.

Glad Påsk!
Teamet', '{"name": "user_name", "code": "EASTER2024", "bonus_coins": "75", "expires_at": "2024-04-30"}'),

('Welcome New User', 'welcome', 'Välkommen till vår dejtingplattform!', 'Hej {name} och välkommen!

Tack för att du registrerat dig. Här är några tips för att komma igång:
1. Komplettera din profil
2. Ladda upp en profilbild
3. Börja chatta med andra medlemmar

Du har {free_coins} gratis coins att börja med!

Lycka till!
Teamet', '{"name": "user_name", "free_coins": "25"}'),

('Inactive User Reactivation', 'inactive_user', 'Vi saknar dig! Kom tillbaka och få bonus coins', 'Hej {name}! 💕

Vi har saknat dig här på plattformen!
För att välkomna dig tillbaka har vi lagt till {bonus_coins} bonus coins till ditt konto.

Logga in idag och börja chatta igen!

Vänliga hälsningar,
Teamet', '{"name": "user_name", "bonus_coins": "30"}');

-- Create indexes for better performance
CREATE INDEX idx_promotional_codes_code ON promotional_codes(code);
CREATE INDEX idx_promotional_codes_campaign_id ON promotional_codes(campaign_id);
CREATE INDEX idx_promotional_codes_expires_at ON promotional_codes(expires_at);
CREATE INDEX idx_user_code_usage_user_id ON user_code_usage(user_id);
CREATE INDEX idx_user_code_usage_code_id ON user_code_usage(code_id);
CREATE INDEX idx_message_templates_type ON message_templates(template_type);
CREATE INDEX idx_coin_packages_active ON coin_packages(is_active);

-- Enable RLS
ALTER TABLE promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage campaigns" ON promotional_campaigns
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage codes" ON promotional_codes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view active codes" ON promotional_codes
  FOR SELECT USING (is_active = true AND expires_at > NOW());

CREATE POLICY "Users can use codes" ON user_code_usage
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage support config" ON support_configuration
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage templates" ON message_templates
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage coin packages" ON coin_packages
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT ALL ON promotional_campaigns TO authenticated;
GRANT ALL ON promotional_codes TO authenticated;
GRANT ALL ON user_code_usage TO authenticated;
GRANT ALL ON support_configuration TO authenticated;
GRANT ALL ON message_templates TO authenticated;
GRANT ALL ON coin_packages TO authenticated;

GRANT SELECT ON promotional_campaigns TO anon;
GRANT SELECT ON promotional_codes TO anon;
GRANT SELECT ON message_templates TO anon;
GRANT SELECT ON coin_packages TO anon;