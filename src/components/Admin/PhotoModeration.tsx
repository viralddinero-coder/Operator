import React, { useState, useEffect } from 'react';
import { Check, X, Eye, EyeOff, User, Calendar } from 'lucide-react';
import { photoService } from '../../services/api';
import { Photo } from '../../types';

interface PhotoModerationProps {
  currentUserId: string;
}

export const PhotoModeration: React.FC<PhotoModerationProps> = ({ currentUserId }) => {
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    loadPendingPhotos();
  }, []);

  const loadPendingPhotos = async () => {
    try {
      setIsLoading(true);
      const { photos, error } = await photoService.getPendingPhotos();
      
      if (error) throw error;
      
      setPendingPhotos(photos || []);
    } catch (err) {
      setError('Kunde inte hämta väntande bilder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (photoId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await photoService.moderatePhoto(photoId, status, currentUserId);
      if (error) throw error;

      // Ta bort från listan
      setPendingPhotos(prev => prev.filter(photo => photo.id !== photoId));
      setSelectedPhoto(null);
    } catch (err) {
      setError('Kunde inte uppdatera modereringsstatus');
    }
  };

  const openFullImage = (photo: any) => {
    setSelectedPhoto(photo);
    setShowFullImage(true);
  };

  const closeFullImage = () => {
    setSelectedPhoto(null);
    setShowFullImage(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Bildmoderering</h2>
        <div className="text-sm text-gray-600">
          {pendingPhotos.length} väntande bilder
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {pendingPhotos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
          <h3 className="text-lg font-medium">Inga väntande bilder</h3>
          <p className="text-sm">Alla bilder är granskade!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingPhotos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative group">
                <img
                  src={photo.url}
                  alt="Granskningsbild"
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openFullImage(photo)}
                />
                <button
                  onClick={() => openFullImage(photo)}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{photo.profiles?.name || 'Okänt namn'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(photo.uploaded_at).toLocaleDateString('sv-SE')}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Email: {photo.users?.email || 'Okänd email'}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleModerate(photo.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Godkänn
                  </button>
                  <button
                    onClick={() => handleModerate(photo.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Avvisa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full image modal */}
      {showFullImage && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeFullImage}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={selectedPhoto.url}
              alt="Full storlek"
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{selectedPhoto.profiles?.name || 'Användare'}</h3>
                  <p className="text-sm opacity-75">{selectedPhoto.users?.email}</p>
                </div>
                <div className="text-sm opacity-75">
                  Uppladdad: {new Date(selectedPhoto.uploaded_at).toLocaleDateString('sv-SE')}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleModerate(selectedPhoto.id, 'approved')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Godkänn
                </button>
                <button
                  onClick={() => handleModerate(selectedPhoto.id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Avvisa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};