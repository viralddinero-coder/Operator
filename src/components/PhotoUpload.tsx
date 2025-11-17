import React, { useState, useRef } from 'react';
import { Camera, X, Check, Clock } from 'lucide-react';
import { photoService } from '../services/api';
import { Photo } from '../types';

interface PhotoUploadProps {
  userId: string;
  profileId: string;
  onPhotosUpdate: (photos: Photo[]) => void;
  currentPhotos?: Photo[];
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  userId,
  profileId,
  onPhotosUpdate,
  currentPhotos = []
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Show preview of the first selected image
    const first = files[0];
    if (first) {
      const url = URL.createObjectURL(first);
      setPreviewUrl(url);
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = Array.from(files).map(file => 
        photoService.uploadPhoto(file, userId, profileId)
      );

      const results = await Promise.all(uploadPromises);
      const newPhotos = results
        .filter(result => result.photo !== null)
        .map(result => result.photo!);

      if (results.some(result => result.error)) {
        setUploadError('Vissa bilder kunde inte laddas upp');
      }

      // Uppdatera föräldrakomponenten med nya foton
      const updatedPhotos = [...currentPhotos, ...newPhotos];
      onPhotosUpdate(updatedPhotos);

    } catch (error) {
      setUploadError('Fel vid uppladdning av bilder');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await photoService.deletePhoto(photoId);
      if (error) throw error;

      const updatedPhotos = currentPhotos.filter(photo => photo.id !== photoId);
      onPhotosUpdate(updatedPhotos);
    } catch (error) {
      setUploadError('Kunde inte ta bort bilden');
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      const { error } = await photoService.setPrimaryPhoto(photoId, userId);
      if (error) throw error;

      // Uppdatera lokala foton
      const updatedPhotos = currentPhotos.map(photo => ({
        ...photo,
        is_primary: photo.id === photoId
      }));
      onPhotosUpdate(updatedPhotos);
    } catch (error) {
      setUploadError('Kunde inte sätta som primär bild');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Godkänd';
      case 'pending':
        return 'Väntar på granskning';
      case 'rejected':
        return 'Avvisad';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Mina bilder</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Camera className="w-4 h-4" />
          Ladda upp bild
        </button>
      </div>

      {previewUrl && (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <img src={previewUrl} alt="Förhandsvisning" className="w-full h-64 object-cover" />
          <div className="px-3 py-2 text-xs text-gray-500">Förhandsvisning (inte uppladdad ännu)</div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {uploadError}
        </div>
      )}

      {isUploading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          Laddar upp bilder...
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {currentPhotos.map((photo) => (
          <div key={photo.id} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={photo.url}
                alt="Profilbild"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Status indicator */}
            <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
              {getStatusIcon(photo.moderation_status)}
            </div>

            {/* Primary photo indicator */}
            {photo.is_primary && (
              <div className="absolute top-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full">
                Primär
              </div>
            )}

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              {!photo.is_primary && photo.moderation_status === 'approved' && (
                <button
                  onClick={() => handleSetPrimary(photo.id)}
                  className="px-3 py-1 bg-white text-gray-900 rounded text-sm hover:bg-gray-100"
                >
                  Sätt som primär
                </button>
              )}
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Ta bort
              </button>
            </div>

            {/* Status text */}
            <div className="mt-2 text-xs text-gray-600 text-center">
              {getStatusText(photo.moderation_status)}
            </div>
          </div>
        ))}
      </div>

      {currentPhotos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Inga bilder ännu</p>
          <p className="text-sm">Ladda upp dina första bilder för att komma igång</p>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p><strong>Regler för bilder:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Endast lämpliga bilder är tillåtna</li>
          <li>Alla bilder granskas innan de visas för andra användare</li>
          <li>Du kan ladda upp upp till 10 bilder</li>
          <li>Välj en primär bild som representerar dig bäst</li>
        </ul>
      </div>
    </div>
  );
};
