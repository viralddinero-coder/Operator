import React, { useState, useEffect } from 'react';
import { MapPin, Heart, Weight, Ruler, Eye, Scissors, Smile, Camera } from 'lucide-react';
import { Profile, Photo } from '../types';
import { PhotoUpload } from '../components/PhotoUpload';
import { photoService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

// Mock profile data
const mockProfile: Profile = {
  id: '1',
  user_id: 'user1',
  site_id: 'site1',
  name: 'Amina95',
  age: 30,
  gender: 'female',
  location: 'Stockholm',
  bio: 'Hej! Jag är en positiv och glad tjej som älskar att upptäcka nya platser och träffa intressanta människor. På fritiden gillar jag att träna, laga god mat och spendera tid med vänner. Letar efter någon att dela livets äventyr med!',
  interests: ['träning', 'matlagning', 'resor', 'musik', 'film'],
  online_status: 'online',
  is_profile_complete: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

// Mock suggested profiles
const suggestedProfiles = [
  { id: '2', name: 'Sofia', age: 28, location: 'Göteborg', online_status: 'online' as const },
  { id: '3', name: 'Emma', age: 32, location: 'Malmö', online_status: 'offline' as const },
  { id: '4', name: 'Lisa', age: 26, location: 'Uppsala', online_status: 'online' as const },
  { id: '5', name: 'Anna', age: 29, location: 'Stockholm', online_status: 'online' as const }
];

const ProfilePage: React.FC = () => {
  const { user, profile } = useAuth();
  const [userPhotos, setUserPhotos] = useState<Photo[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'photos'>('profile');

  useEffect(() => {
    if (user && profile) {
      loadUserPhotos();
    }
  }, [user, profile]);

  const loadUserPhotos = async () => {
    if (!user) return;
    
    try {
      setIsLoadingPhotos(true);
      const { photos, error } = await photoService.getPhotosByUser(user.id);
      if (error) throw error;
      setUserPhotos(photos || []);
    } catch (error) {
      console.error('Kunde inte ladda användarens foton:', error);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handlePhotosUpdate = (updatedPhotos: Photo[]) => {
    setUserPhotos(updatedPhotos);
  };

  // Använd mockdata om ingen användare är inloggad
  const displayProfile = profile || mockProfile;
  const displayPhotos = userPhotos.length > 0 ? userPhotos : [];

  return (
    <div className="min-h-screen bg-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'photos'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Mina Bilder ({displayPhotos.length})
            </button>
          </nav>
        </div>

        {activeTab === 'profile' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Section */}
            <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start space-x-6">
                {/* Profile Picture */}
                <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {displayPhotos.find(photo => photo.is_primary && photo.moderation_status === 'approved') ? (
                    <img 
                      src={displayPhotos.find(photo => photo.is_primary)?.url} 
                      alt="Profilbild" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Heart className="h-16 w-16 text-pink-500" />
                  )}
                </div>
                
                {/* Basic Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {mockProfile.name}, {mockProfile.age}
                    </h1>
                    {mockProfile.online_status === 'online' && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{mockProfile.location}</span>
                  </div>

                  <p className="text-gray-700 mb-4">{mockProfile.bio}</p>

                  {/* Interests */}
                  <div className="flex flex-wrap gap-2">
                    {mockProfile.interests?.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                Det visuella
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Weight className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Vikt</p>
                    <p className="font-medium">60 kg</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Ruler className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Längd</p>
                    <p className="font-medium">163 cm</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Eye className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Ögonfärg</p>
                    <p className="font-medium">brun</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Scissors className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Hårfärg</p>
                    <p className="font-medium">brun</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifestyle */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                Min Livsstil i Korthet
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Motionerar ibland</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Sällskapar ofta</span>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                Jag & Det jag Gillar
                <Smile className="h-5 w-5 text-pink-500 ml-2" />
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Desto nyfiken av: Matlagning, musik</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Inte jag: nykter, vegetarian</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <button className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 px-4 rounded-lg font-medium transition-colors mb-3">
                Skicka Meddelande
              </button>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors">
                Lägg till i Favoriter
              </button>
            </div>

            {/* Suggested Profiles */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                Du kanske gillar
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {suggestedProfiles.map((profile) => (
                  <div key={profile.id} className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Heart className="h-8 w-8 text-pink-500" />
                    </div>
                    <p className="font-medium text-sm">{profile.name}, {profile.age}</p>
                    <div className="flex items-center justify-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{profile.location}</span>
                    </div>
                    {profile.online_status === 'online' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {user && profile ? (
            <PhotoUpload
              userId={user.id}
              profileId={profile.id}
              currentPhotos={displayPhotos}
              onPhotosUpdate={handlePhotosUpdate}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Logga in för att hantera dina bilder</p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default ProfilePage;