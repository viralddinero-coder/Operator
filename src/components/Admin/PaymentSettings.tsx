import React, { useState } from 'react';
import { CreditCard, Settings, Save, ToggleLeft, ToggleRight, Key, Globe } from 'lucide-react';

interface PaymentProvider {
  id: string;
  name: string;
  type: 'paygate' | 'stripe' | 'paypal';
  enabled: boolean;
  config: Record<string, any>;
}

export const PaymentSettings: React.FC = () => {
  const [providers, setProviders] = useState<PaymentProvider[]>([
    {
      id: 'paygate-1',
      name: 'Paygate (Primär)',
      type: 'paygate',
      enabled: true,
      config: {
        merchantId: '12345',
        apiKey: 'test-api-key-123',
        environment: 'test',
        callbackUrl: 'https://mynteri.com/api/payments/callback',
        successUrl: 'https://mynteri.com/payment/success',
        cancelUrl: 'https://mynteri.com/payment/cancel'
      }
    },
    {
      id: 'stripe-1',
      name: 'Stripe (Reserv)',
      type: 'stripe',
      enabled: false,
      config: {
        publishableKey: '',
        secretKey: '',
        webhookSecret: ''
      }
    }
  ]);

  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');

  const handleToggleProvider = (providerId: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? { ...provider, enabled: !provider.enabled }
        : provider
    ));
  };

  const handleConfigChange = (providerId: string, key: string, value: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? { 
            ...provider, 
            config: { ...provider.config, [key]: value }
          }
        : provider
    ));
  };

  const handleSave = async (providerId: string) => {
    // Här skulle du spara till backend
    setSaveMessage('Inställningar sparade!');
    setEditingProvider(null);
    
    // Rensa meddelande efter 3 sekunder
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'paygate':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'stripe':
        return <CreditCard className="w-5 h-5 text-purple-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Betalningsinställningar</h2>
        {saveMessage && (
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
            {saveMessage}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Betalningsleverantörer</h3>
        <p className="text-gray-600 mb-6">
          Konfigurera dina betalningsleverantörer. Paygate är förkonfigurerad som primär leverantör.
        </p>

        <div className="space-y-6">
          {providers.map((provider) => (
            <div key={provider.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getProviderIcon(provider.type)}
                  <div>
                    <h4 className="font-medium text-gray-900">{provider.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{provider.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${provider.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {provider.enabled ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <button
                    onClick={() => handleToggleProvider(provider.id)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    style={{
                      backgroundColor: provider.enabled ? '#ec4899' : '#d1d5db'
                    }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        provider.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {provider.enabled && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  {provider.type === 'paygate' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Merchant ID
                          </label>
                          <input
                            type="text"
                            value={provider.config.merchantId}
                            onChange={(e) => handleConfigChange(provider.id, 'merchantId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            placeholder="Ditt Paygate Merchant ID"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Nyckel
                          </label>
                          <input
                            type="password"
                            value={provider.config.apiKey}
                            onChange={(e) => handleConfigChange(provider.id, 'apiKey', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            placeholder="Din Paygate API nyckel"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Miljö
                        </label>
                        <select
                          value={provider.config.environment}
                          onChange={(e) => handleConfigChange(provider.id, 'environment', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        >
                          <option value="test">Testmiljö</option>
                          <option value="production">Produktion</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Callback URL
                          </label>
                          <input
                            type="url"
                            value={provider.config.callbackUrl}
                            onChange={(e) => handleConfigChange(provider.id, 'callbackUrl', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            placeholder="https://din-sajt.com/api/payments/callback"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Success URL
                          </label>
                          <input
                            type="url"
                            value={provider.config.successUrl}
                            onChange={(e) => handleConfigChange(provider.id, 'successUrl', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            placeholder="https://din-sajt.com/payment/success"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cancel URL
                        </label>
                        <input
                          type="url"
                          value={provider.config.cancelUrl}
                          onChange={(e) => handleConfigChange(provider.id, 'cancelUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="https://din-sajt.com/payment/cancel"
                        />
                      </div>
                    </>
                  )}

                  {provider.type === 'stripe' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Publishable Key
                          </label>
                          <input
                            type="text"
                            value={provider.config.publishableKey}
                            onChange={(e) => handleConfigChange(provider.id, 'publishableKey', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            placeholder="pk_test_..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Secret Key
                          </label>
                          <input
                            type="password"
                            value={provider.config.secretKey}
                            onChange={(e) => handleConfigChange(provider.id, 'secretKey', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            placeholder="sk_test_..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Webhook Secret
                        </label>
                        <input
                          type="password"
                          value={provider.config.webhookSecret}
                          onChange={(e) => handleConfigChange(provider.id, 'webhookSecret', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="whsec_..."
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave(provider.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Spara inställningar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Coin Packages Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Myntpaket</h3>
        <p className="text-gray-600 mb-4">
          Konfigurera tillgängliga myntpaket för användare. Dessa kan ändras i realtid.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Litet paket</h4>
            <p className="text-2xl font-bold text-pink-600">100 mynt</p>
            <p className="text-gray-600">99 kr</p>
            <button className="mt-2 text-sm text-pink-600 hover:text-pink-700">Redigera</button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Mellanpaket</h4>
            <p className="text-2xl font-bold text-pink-600">500 mynt</p>
            <p className="text-gray-600">399 kr</p>
            <button className="mt-2 text-sm text-pink-600 hover:text-pink-700">Redigera</button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Stort paket</h4>
            <p className="text-2xl font-bold text-pink-600">1000 mynt</p>
            <p className="text-gray-600">699 kr</p>
            <button className="mt-2 text-sm text-pink-600 hover:text-pink-700">Redigera</button>
          </div>
        </div>

        <div className="mt-4">
          <button className="px-4 py-2 border border-pink-600 text-pink-600 rounded-lg hover:bg-pink-50 transition-colors">
            Lägg till nytt paket
          </button>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Senaste transaktioner</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Köp av 500 mynt</p>
              <p className="text-sm text-gray-600">Paygate • användare@example.com</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">+399 kr</p>
              <p className="text-sm text-gray-600">2 timmar sedan</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Köp av 100 mynt</p>
              <p className="text-sm text-gray-600">Paygate • test@example.com</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">+99 kr</p>
              <p className="text-sm text-gray-600">5 timmar sedan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};