import React, { useState, useEffect } from 'react';
import { promotionalService } from '../../services/api';
import { PromotionalCampaign, PromotionalCode } from '../../types';

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>([]);
  const [codes, setCodes] = useState<PromotionalCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<PromotionalCampaign | null>(null);
  
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true
  });
  
  const [newCode, setNewCode] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount' | 'bonus_coins',
    discount_value: 0,
    max_uses: 1,
    expires_at: ''
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const { campaigns: data, error } = await promotionalService.getActiveCampaigns();
      if (!error) {
        setCampaigns(data || []);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCodes = async (campaignId: string) => {
    try {
      const { codes: data, error } = await promotionalService.getPromotionalCodes(campaignId);
      if (!error) {
        setCodes(data || []);
      }
    } catch (error) {
      console.error('Error loading codes:', error);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.start_date || !newCampaign.end_date) {
      alert('Vänligen fyll i alla obligatoriska fält');
      return;
    }

    try {
      const { campaign, error } = await promotionalService.createCampaign(
        newCampaign.name,
        newCampaign.description,
        new Date(newCampaign.start_date).toISOString(),
        new Date(newCampaign.end_date).toISOString()
      );

      if (error) {
        alert('Fel vid skapande av kampanj: ' + error.message);
      } else {
        alert('Kampanj skapad framgångsrikt!');
        setShowCreateModal(false);
        setNewCampaign({
          name: '',
          description: '',
          start_date: '',
          end_date: '',
          is_active: true
        });
        loadCampaigns();
      }
    } catch (error) {
      alert('Fel vid skapande av kampanj');
    }
  };

  const handleCreateCode = async () => {
    if (!selectedCampaign || !newCode.code || !newCode.expires_at) {
      alert('Vänligen fyll i alla obligatoriska fält');
      return;
    }

    try {
      const { code, error } = await promotionalService.createPromotionalCode(
        selectedCampaign.id,
        newCode.code,
        newCode.discount_type,
        newCode.discount_value,
        newCode.max_uses,
        new Date(newCode.expires_at).toISOString()
      );

      if (error) {
        alert('Fel vid skapande av kod: ' + error.message);
      } else {
        alert('Kampanjkod skapad framgångsrikt!');
        setShowCodeModal(false);
        setNewCode({
          code: '',
          discount_type: 'percentage',
          discount_value: 0,
          max_uses: 1,
          expires_at: ''
        });
        loadCodes(selectedCampaign.id);
      }
    } catch (error) {
      alert('Fel vid skapande av kod');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code });
  };

  const toggleCampaignStatus = async (campaign: PromotionalCampaign) => {
    try {
      const { error } = await promotionalService.updateCampaign(campaign.id, {
        is_active: !campaign.is_active
      });

      if (error) {
        alert('Fel vid uppdatering av kampanjstatus: ' + error.message);
      } else {
        loadCampaigns();
      }
    } catch (error) {
      alert('Fel vid uppdatering av kampanjstatus');
    }
  };

  const openCodeModal = (campaign: PromotionalCampaign) => {
    setSelectedCampaign(campaign);
    loadCodes(campaign.id);
    setShowCodeModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage': return 'Procent';
      case 'fixed_amount': return 'Fast belopp';
      case 'bonus_coins': return 'Bonusmynt';
      default: return type;
    }
  };

  if (loading) {
    return <div className="p-6">Laddar kampanjer...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Kampanjhantering</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
        >
          Skapa ny kampanj
        </button>
      </div>

      <div className="grid gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{campaign.name}</h3>
                <p className="text-gray-600 mt-1">{campaign.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  campaign.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {campaign.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
                <button
                  onClick={() => toggleCampaignStatus(campaign)}
                  className={`px-3 py-1 rounded text-sm ${
                    campaign.is_active 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } transition-colors`}
                >
                  {campaign.is_active ? 'Avaktivera' : 'Aktivera'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-500">Startdatum:</span>
                <p className="font-medium">{formatDate(campaign.start_date)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Slutdatum:</span>
                <p className="font-medium">{formatDate(campaign.end_date)}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => openCodeModal(campaign)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Hantera koder
              </button>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Inga kampanjer hittades</p>
            <p className="text-gray-400 mt-2">Skapa din första kampanj för att komma igång</p>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Skapa ny kampanj</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Namn *</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="T.ex. Julkampanj 2024"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivning</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows={3}
                  placeholder="Beskriv kampanjen..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum *</label>
                <input
                  type="datetime-local"
                  value={newCampaign.start_date}
                  onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slutdatum *</label>
                <input
                  type="datetime-local"
                  value={newCampaign.end_date}
                  onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newCampaign.is_active}
                  onChange={(e) => setNewCampaign({ ...newCampaign, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Aktiv kampanj
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateCampaign}
                className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition-colors"
              >
                Skapa kampanj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Management Modal */}
      {showCodeModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Kampanjkoder för {selectedCampaign.name}</h3>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <button
                onClick={() => {
                  setNewCode({
                    code: '',
                    discount_type: 'percentage',
                    discount_value: 0,
                    max_uses: 1,
                    expires_at: ''
                  });
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Skapa ny kod
              </button>
            </div>

            {newCode.code === '' && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-3">Skapa ny kampanjkod</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kod *</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={newCode.code}
                        onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                        className="flex-1 border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="T.ex. JUL2024"
                      />
                      <button
                        onClick={generateRandomCode}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-r hover:bg-gray-300 transition-colors"
                        title="Generera slumpmässig kod"
                      >
                        🎲
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rabatttyp</label>
                    <select
                      value={newCode.discount_type}
                      onChange={(e) => setNewCode({ ...newCode, discount_type: e.target.value as any })}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="percentage">Procent (%)</option>
                      <option value="fixed_amount">Fast belopp (kr)</option>
                      <option value="bonus_coins">Bonusmynt</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Värde</label>
                    <input
                      type="number"
                      value={newCode.discount_value}
                      onChange={(e) => setNewCode({ ...newCode, discount_value: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max antal användningar</label>
                    <input
                      type="number"
                      value={newCode.max_uses}
                      onChange={(e) => setNewCode({ ...newCode, max_uses: parseInt(e.target.value) || 1 })}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      min="1"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Utgångsdatum *</label>
                    <input
                      type="datetime-local"
                      value={newCode.expires_at}
                      onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setNewCode({ ...newCode, code: 'CANCEL' })}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleCreateCode}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Skapa kod
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {codes.map((code) => (
                <div key={code.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{code.code}</div>
                    <div className="text-sm text-gray-600">
                      {getDiscountTypeLabel(code.discount_type)}: {code.discount_value}
                      {code.discount_type === 'percentage' ? '%' : code.discount_type === 'fixed_amount' ? ' kr' : ' mynt'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Använd: {code.used_count}/{code.max_uses} | Utgår: {formatDate(code.expires_at)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      code.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {code.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </div>
              ))}
              
              {codes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Inga kampanjkoder hittades för denna kampanj
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}