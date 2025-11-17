import React, { useState } from 'react';
import { Heart, X, MessageCircle, MapPin } from 'lucide-react';
import { Profile } from '../types';

// Mock data for demonstration
const mockProfiles: Profile[] = [
  {
    id: '1',
    user_id: 'user1',
    site_id: 'site1',
    name: 'Amina95',
    age: 30,
    gender: 'female',
    location: 'Stockholm',
    bio: 'Hej! Jag älskar att resa och upptäcka nya platser. Letar efter någon att dela äventyr med.',
    interests: ['musik', 'resor', 'matlagning'],
    online_status: 'online',
    is_profile_complete: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    user_id: 'user2',
    site_id: 'site1',
    name: 'Sofia88',
    age: 28,
    gender: 'female',
    location: 'Göteborg',
    bio: 'Positiv och glad tjej som gillar att träna och vara ute i naturen.',
    interests: ['träning', 'natur', 'film'],
    online_status: 'online',
    is_profile_complete: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    user_id: 'user3',
    site_id: 'site1',
    name: 'Emma92',
    age: 32,
    gender: 'female',
    location: 'Malmö',
    bio: 'Konstnärlig själ som älskar kultur, musik och god mat.',
    interests: ['konst', 'musik', 'mat'],
    online_status: 'offline',
    is_profile_complete: true,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  }
];

const HomePage: React.FC = () => {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);

  const currentProfile = mockProfiles[currentProfileIndex];

  const handleLike = async () => {
    try {
      const { likeService } = await import('../services/api')
      await likeService.like('current-user-id', currentProfile.user_id) // replace with real user id via auth
      setLikedProfiles(prev => [...prev, currentProfile.id]);
    } finally {
      nextProfile();
    }
  };

  const handleDislike = () => {
    nextProfile();
  };

  const nextProfile = () => {
    setCurrentProfileIndex(prev => 
      prev < mockProfiles.length - 1 ? prev + 1 : 0
    );
  };

  const prevProfile = () => {
    setCurrentProfileIndex(prev => 
      prev > 0 ? prev - 1 : mockProfiles.length - 1
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200">
      {/* Filters Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
              MIN SMAK
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Age Filter */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ålder</label>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>18</span>
                <span>25</span>
              </div>
              <input
                type="range"
                min="18"
                max="80"
                defaultValue="25"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Location Filter */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Plats</label>
              <div className="text-sm text-gray-600 mb-2">Sverige, Stockholm Län</div>
              <select className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                <option>Alla städer</option>
                <option>Stockholm</option>
                <option>Göteborg</option>
                <option>Malmö</option>
              </select>
            </div>

            {/* Online Status Filter */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-700">Endast online</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white/95 rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="relative">
            {/* Profile Image */}
            <div className="h-96 bg-gradient-to-br from-pink-100 to-purple-100/60 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-pink-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Heart className="h-16 w-16 text-pink-500" />
                </div>
                <p className="text-gray-600">Profilbild</p>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevProfile}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextProfile}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Action Buttons */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <button
                onClick={handleDislike}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all"
              >
                <X className="h-6 w-6" />
              </button>
              <button
                onClick={handleLike}
                className="bg-pink-500 hover:bg-pink-600 text-white rounded-full p-4 shadow-lg transition-all"
              >
                <Heart className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {currentProfile.name}, {currentProfile.age}
                </h3>
                {currentProfile.online_status === 'online' && (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                )}
              </div>
              <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>Skicka Meddelande</span>
              </button>
            </div>
            
            <div className="flex items-center text-gray-600 mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{currentProfile.location}</span>
            </div>

            {currentProfile.bio && (
              <p className="text-gray-700 mb-3">{currentProfile.bio}</p>
            )}

            {currentProfile.interests && currentProfile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-pink-500 text-sm">Mynteri.com</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
