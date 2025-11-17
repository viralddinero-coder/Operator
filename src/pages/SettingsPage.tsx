import React from 'react';
import { User, Bell, Shield, CreditCard, Palette } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Inställningar</h1>
          
          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-pink-500" />
                Profilinställningar
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Namn</label>
                  <input
                    type="text"
                    defaultValue="Bajskorv"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ålder</label>
                  <input
                    type="number"
                    defaultValue="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plats</label>
                  <input
                    type="text"
                    defaultValue="Stockholm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kön</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none">
                    <option>Kvinna</option>
                    <option>Man</option>
                    <option>Annat</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-pink-500" />
                Notifikationer
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-pink-500 focus:ring-pink-500" />
                  <span className="ml-2 text-sm text-gray-700">Nya meddelanden</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-pink-500 focus:ring-pink-500" />
                  <span className="ml-2 text-sm text-gray-700">Nya matchningar</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-pink-500 focus:ring-pink-500" />
                  <span className="ml-2 text-sm text-gray-700">Marknadsföring</span>
                </label>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-pink-500" />
                Sekretess
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-pink-500 focus:ring-pink-500" />
                  <span className="ml-2 text-sm text-gray-700">Visa online-status</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-pink-500 focus:ring-pink-500" />
                  <span className="ml-2 text-sm text-gray-700">Tillåt sökning</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-pink-500 focus:ring-pink-500" />
                  <span className="ml-2 text-sm text-gray-700">Privat läge</span>
                </label>
              </div>
            </div>

            {/* Theme Settings */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2 text-pink-500" />
                Utseende
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none">
                  <option>Ljust</option>
                  <option>Mörkt</option>
                  <option>Auto</option>
                </select>
              </div>
            </div>

            {/* Payment Settings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-pink-500" />
                Betalning
              </h2>
              
              <button className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                Hantera betalningsmetoder
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button className="bg-pink-500 hover:bg-pink-600 text-white py-2 px-6 rounded-lg font-medium transition-colors">
              Spara ändringar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;