import React, { useState, useEffect } from 'react';
import { Mail, Save, Settings } from 'lucide-react';
import { supportService } from '../../services/api';

export default function SupportSettings() {
  const [config, setConfig] = useState({
    support_email: '',
    support_name: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_secure: true,
    auto_reply_enabled: false,
    auto_reply_subject: '',
    auto_reply_message: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { config: data, error } = await supportService.getSupportConfiguration();
      if (!error && data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading support config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.support_email || !config.support_name) {
      alert('Vänligen fyll i support e-post och namn');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supportService.updateSupportConfiguration(config);
      if (error) {
        alert('Fel vid sparande av inställningar: ' + error.message);
      } else {
        alert('Inställningar sparade framgångsrikt!');
      }
    } catch (error) {
      alert('Fel vid sparande av inställningar');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.smtp_host || !config.smtp_username) {
      alert('Vänligen fyll i SMTP-inställningar för att testa anslutning');
      return;
    }

    try {
      const { success, error } = await supportService.testSMTPConnection(config);
      if (error) {
        alert('SMTP-test misslyckades: ' + error.message);
      } else {
        alert('SMTP-anslutningen fungerar!');
      }
    } catch (error) {
      alert('Fel vid test av SMTP-anslutning');
    }
  };

  if (loading) {
    return <div className="p-6">Laddar inställningar...</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Mail className="w-8 h-8 text-pink-600 mr-3" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Support E-post Inställningar</h2>
          <p className="text-gray-600">Konfigurera support e-post och SMTP-inställningar</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Grundläggande Inställningar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support E-post *
            </label>
            <input
              type="email"
              value={config.support_email}
              onChange={(e) => setConfig({ ...config, support_email: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="support@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">E-postadress som kunder kan kontakta för support</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Namn *
            </label>
            <input
              type="text"
              value={config.support_name}
              onChange={(e) => setConfig({ ...config, support_name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Support Team"
            />
            <p className="text-xs text-gray-500 mt-1">Namn som visas som avsändare</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">SMTP-inställningar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP-värd
            </label>
            <input
              type="text"
              value={config.smtp_host}
              onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="smtp.gmail.com"
            />
            <p className="text-xs text-gray-500 mt-1">Din SMTP-server adress</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP-port
            </label>
            <input
              type="number"
              value={config.smtp_port}
              onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) || 587 })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="587"
            />
            <p className="text-xs text-gray-500 mt-1">Vanligtvis 587 (TLS) eller 465 (SSL)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP-användarnamn
            </label>
            <input
              type="text"
              value={config.smtp_username}
              onChange={(e) => setConfig({ ...config, smtp_username: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="din-email@gmail.com"
            />
            <p className="text-xs text-gray-500 mt-1">Ditt SMTP-inloggningsnamn</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP-lösenord
            </label>
            <input
              type="password"
              value={config.smtp_password}
              onChange={(e) => setConfig({ ...config, smtp_password: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">Ditt SMTP-lösenord</p>
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="smtp_secure"
            checked={config.smtp_secure}
            onChange={(e) => setConfig({ ...config, smtp_secure: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="smtp_secure" className="text-sm font-medium text-gray-700">
            Använd säker anslutning (TLS/SSL)
          </label>
        </div>
        
        <button
          onClick={testConnection}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Testa SMTP-anslutning
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Automatiskt svar</h3>
        
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="auto_reply_enabled"
            checked={config.auto_reply_enabled}
            onChange={(e) => setConfig({ ...config, auto_reply_enabled: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="auto_reply_enabled" className="text-sm font-medium text-gray-700">
            Aktivera automatiskt svar
          </label>
        </div>
        
        {config.auto_reply_enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ämne för autosvar
              </label>
              <input
                type="text"
                value={config.auto_reply_subject}
                onChange={(e) => setConfig({ ...config, auto_reply_subject: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Tack för ditt meddelande"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meddelande för autosvar
              </label>
              <textarea
                value={config.auto_reply_message}
                onChange={(e) => setConfig({ ...config, auto_reply_message: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows={4}
                placeholder="Tack för ditt meddelande. Vi kommer att svara dig så snart som möjligt."
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={loadConfig}
          className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Återställ
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700 disabled:opacity-50 transition-colors flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Sparar...' : 'Spara inställningar'}
        </button>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">SMTP-konfiguration för populära e-postleverantörer</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Gmail:</strong> smtp.gmail.com, Port: 587, Använd app-lösenord</p>
              <p><strong>Outlook:</strong> smtp-mail.outlook.com, Port: 587</p>
              <p><strong>Yahoo:</strong> smtp.mail.yahoo.com, Port: 587</p>
              <p><strong>SendGrid:</strong> smtp.sendgrid.net, Port: 587</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}