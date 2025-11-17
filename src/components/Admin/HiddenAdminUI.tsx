import React, { useState } from 'react';
import { Settings, Eye, EyeOff, Palette, Image, Save } from 'lucide-react';
import { useUIStore } from '../../store';
import { siteConfig } from '../../config/site';

const HiddenAdminUI: React.FC = () => {
  const { showHiddenAdmin, setShowHiddenAdmin } = useUIStore();
  const [backgroundImage, setBackgroundImage] = useState<string>(siteConfig.backgroundImage || '');
  const [primaryColor, setPrimaryColor] = useState<string>(siteConfig.primaryColor);
  const [siteName, setSiteName] = useState<string>(siteConfig.name);

  // Hidden trigger: Triple click on logo to show admin panel
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    
    if (clickTimer) {
      clearTimeout(clickTimer);
    }
    
    const timer = setTimeout(() => {
      setClickCount(0);
    }, 1000);
    
    setClickTimer(timer);
    
    if (clickCount >= 2) { // Third click
      setShowHiddenAdmin(!showHiddenAdmin);
      setClickCount(0);
    }
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log('Saving admin settings:', {
      backgroundImage,
      primaryColor,
      siteName
    });
    alert('Inställningar sparade! (I verkligheten skulle detta sparas till databasen)');
  };

  if (!showHiddenAdmin) {
    return (
      <div 
        className="fixed top-4 left-4 opacity-0 hover:opacity-20 transition-opacity cursor-pointer z-50"
        onClick={handleLogoClick}
        title="Triple-click logo to show admin panel"
      >
        <div className="w-8 h-8 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Dold Admin Panel
          </h2>
          <button
            onClick={() => setShowHiddenAdmin(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <EyeOff className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Site Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sidnamn
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Ange sidnamn"
            />
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              Primär Färg
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="#DC143C"
              />
            </div>
          </div>

          {/* Background Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Image className="h-4 w-4 mr-2" />
              Bakgrundsbild URL
            </label>
            <input
              type="url"
              value={backgroundImage}
              onChange={(e) => setBackgroundImage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
            {backgroundImage && (
              <div className="mt-2">
                <img
                  src={backgroundImage}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Förhandsvisning
            </label>
            <div 
              className="w-full h-32 rounded-lg border border-gray-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            >
              <div className="w-full h-full bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <h3 
                  className="text-white text-xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {siteName}
                </h3>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Snabbåtgärder
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPrimaryColor('#DC143C');
                  setSiteName('MYNTERI');
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Återställ standard
              </button>
              <button
                onClick={() => {
                  setBackgroundImage('https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20dating%20background%20with%20blurred%20couple%20silhouette%20soft%20lighting%20pink%20and%20red%20tones&image_size=landscape_16_9');
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Generera ny bild
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={() => setShowHiddenAdmin(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Spara ändringar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HiddenAdminUI;