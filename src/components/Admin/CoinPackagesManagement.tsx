import React, { useState, useEffect } from 'react';
import { Coins, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { coinPackageService } from '../../services/api';
import { CoinPackage } from '../../types';

export default function CoinPackagesManagement() {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CoinPackage | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    coins: 0,
    price: 0,
    description: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { packages: data, error } = await coinPackageService.getCoinPackages(false);
      if (!error) {
        setPackages(data || []);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || formData.coins <= 0 || formData.price <= 0) {
      alert('Vänligen fyll i namn, antal mynt och pris');
      return;
    }

    try {
      if (editingPackage) {
        const { error } = await coinPackageService.updateCoinPackage(editingPackage.id, formData);
        if (error) {
          alert('Fel vid uppdatering av paket: ' + error.message);
          return;
        }
      } else {
        const { error } = await coinPackageService.createCoinPackage(formData);
        if (error) {
          alert('Fel vid skapande av paket: ' + error.message);
          return;
        }
      }

      alert('Paket sparat framgångsrikt!');
      setShowModal(false);
      resetForm();
      loadPackages();
    } catch (error) {
      alert('Fel vid sparande av paket');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta paket?')) {
      return;
    }

    try {
      const { error } = await coinPackageService.deleteCoinPackage(id);
      if (error) {
        alert('Fel vid borttagning av paket: ' + error.message);
      } else {
        loadPackages();
      }
    } catch (error) {
      alert('Fel vid borttagning av paket');
    }
  };

  const handleEdit = (pkg: CoinPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      coins: pkg.coins,
      price: pkg.price,
      description: pkg.description || '',
      is_active: pkg.is_active,
      sort_order: pkg.sort_order || 0
    });
    setShowModal(true);
  };

  const togglePackageStatus = async (pkg: CoinPackage) => {
    try {
      const { error } = await coinPackageService.updateCoinPackage(pkg.id, {
        is_active: !pkg.is_active
      });
      if (error) {
        alert('Fel vid uppdatering av paketstatus: ' + error.message);
      } else {
        loadPackages();
      }
    } catch (error) {
      alert('Fel vid uppdatering av paketstatus');
    }
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      coins: 0,
      price: 0,
      description: '',
      is_active: true,
      sort_order: 0
    });
  };

  const movePackage = async (pkg: CoinPackage, direction: 'up' | 'down') => {
    const currentIndex = packages.findIndex(p => p.id === pkg.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= packages.length) {
      return;
    }

    const newSortOrder = packages[newIndex].sort_order;
    const targetSortOrder = pkg.sort_order;

    try {
      // Update both packages
      await Promise.all([
        coinPackageService.updateCoinPackage(pkg.id, { sort_order: newSortOrder }),
        coinPackageService.updateCoinPackage(packages[newIndex].id, { sort_order: targetSortOrder })
      ]);
      loadPackages();
    } catch (error) {
      alert('Fel vid flyttning av paket');
    }
  };

  if (loading) {
    return <div className="p-6">Laddar paket...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Coins className="w-8 h-8 text-pink-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Myntpaket</h2>
            <p className="text-gray-600">Hantera myntpaket för användare</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Skapa nytt paket
        </button>
      </div>

      <div className="grid gap-6">
        {packages.map((pkg, index) => (
          <div key={pkg.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="flex flex-col mr-4">
                  <button
                    onClick={() => movePackage(pkg, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => movePackage(pkg, 'down')}
                    disabled={index === packages.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 mr-3">{pkg.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {pkg.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="font-medium text-pink-600">{pkg.coins} mynt</span>
                    <span className="text-gray-500">•</span>
                    <span className="font-medium text-gray-800">{pkg.price} kr</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">Sortering: {pkg.sort_order}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => togglePackageStatus(pkg)}
                  className={`px-3 py-1 rounded text-sm ${
                    pkg.is_active 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } transition-colors`}
                >
                  {pkg.is_active ? 'Avaktivera' : 'Aktivera'}
                </button>
                <button
                  onClick={() => handleEdit(pkg)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Redigera"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Ta bort"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {packages.length === 0 && (
          <div className="text-center py-12">
            <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Inga paket hittades</p>
            <p className="text-gray-400 mt-2">Skapa ditt första paket för att komma igång</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingPackage ? 'Redigera paket' : 'Skapa nytt paket'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Namn *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="T.ex. Startpaket"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Antal mynt *
                </label>
                <input
                  type="number"
                  value={formData.coins}
                  onChange={(e) => setFormData({ ...formData, coins: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pris (kr) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beskrivning
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows={3}
                  placeholder="Beskrivning av paketet..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sorteringsordning
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  min="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Aktivt paket
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Spara paket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}