import React, { useEffect, useState } from 'react';
import { Search, Filter, MapPin, Heart, Flag } from 'lucide-react';
import { Profile } from '../types';
import { profileService, operatorService } from '../services/api';
import { useAuthStore } from '../store';
import { ReportUser } from '../components/ReportUser';

const SearchPage: React.FC = () => {
  const { user } = useAuthStore();
  const [results, setResults] = useState<Profile[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportUser, setReportUser] = useState<{id: string, name: string} | null>(null);
  useEffect(() => {
    const load = async () => {
      if (user?.role === 'user') {
        const { profiles } = await operatorService.getFemaleProfilesOnlineForTarget();
        setResults(profiles);
      } else {
        const { profiles } = await profileService.getProfiles({ online_only: true });
        setResults(profiles);
      }
    };
    load();
  }, [user]);

  const handleReportClick = (profile: Profile) => {
    setReportUser({ id: profile.user_id, name: profile.name });
    setShowReportModal(true);
  };

  const handleReportSuccess = () => {
    // Refresh the results or show a success message
    console.log('Användare rapporterad framgångsrikt');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hitta din match</h1>
            <p className="text-gray-700">Registrera dig och börja chatta direkt</p>
          </div>
          <div className="flex gap-2">
            <a href="/register" className="px-4 py-2 bg-pink-600 text-white rounded-lg">Registrera</a>
            <a href="/login" className="px-4 py-2 border border-pink-600 text-pink-600 rounded-lg">Logga in</a>
          </div>
        </div>
        {/* Search Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Sök profiler</h1>
            <button className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Sök efter namn, intressen eller plats..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ålder (min)</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option>18</option>
                <option>25</option>
                <option>30</option>
                <option>35</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ålder (max)</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option>25</option>
                <option>30</option>
                <option>40</option>
                <option>50</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kön</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option>Alla</option>
                <option>Kvinna</option>
                <option>Man</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plats</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option>Alla städer</option>
                <option>Stockholm</option>
                <option>Göteborg</option>
                <option>Malmö</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((profile) => (
            <div key={profile.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Profile Image */}
              <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <div className="w-20 h-20 bg-pink-200 rounded-full flex items-center justify-center">
                  <Heart className="h-10 w-10 text-pink-500" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile.name}, {profile.age}
                  </h3>
                  {profile.online_status === 'online' && (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </div>

                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{profile.location}</span>
                </div>

                <p className="text-gray-700 text-sm mb-3 line-clamp-2">{profile.bio}</p>

                    {profile.interests && profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {profile.interests.slice(0, 3).map((interest, index) => (
                      <span
                        key={index}
                        className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    Visa Profil
                  </button>
                  <button 
                    onClick={() => handleReportClick(profile)}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Rapportera användare"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Report User Modal */}
        {showReportModal && reportUser && (
          <ReportUser
            reportedUserId={reportUser.id}
            reportedUserName={reportUser.name}
            onClose={() => {
              setShowReportModal(false);
              setReportUser(null);
            }}
            onSuccess={handleReportSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default SearchPage;
