import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Coins, DollarSign, Calendar, Filter, Key, CheckCircle, XCircle } from 'lucide-react';
import { userService } from '../../services/api';

interface UserWithStats {
  id: string;
  email: string;
  username: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  coin_balance: number;
  total_burned_coins: number;
  total_spent_usd: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 20;
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * usersPerPage;
      const result = searchTerm 
        ? await userService.searchUsersByUsername(searchTerm)
        : await userService.getUsers('', usersPerPage, offset);
      
      if (result.error) {
        console.error('Error loading users:', result.error);
      } else {
        setUsers(result.users);
        // Estimate total pages based on results
        setTotalPages(Math.ceil(result.users.length / usersPerPage) || 1);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePasswordChange = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Lösenordet måste vara minst 6 tecken långt');
      return;
    }

    try {
      const result = await userService.updateUserPassword(userId, newPassword);
      if (result.error) {
        alert('Fel vid uppdatering av lösenord: ' + result.error.message);
      } else {
        alert('Lösenordet har uppdaterats framgångsrikt');
        setShowPasswordModal(false);
        setNewPassword('');
        setSelectedUser(null);
      }
    } catch (error: any) {
      alert('Fel vid uppdatering av lösenord: ' + error.message);
    }
  };

  const handleEmailVerification = async (userId: string, isVerified: boolean) => {
    try {
      const result = await userService.updateUserEmailVerification(userId, isVerified);
      if (result.error) {
        alert('Fel vid uppdatering av email-verifiering: ' + result.error.message);
      } else {
        alert('Email-verifieringsstatus har uppdaterats');
        setShowVerificationModal(false);
        setSelectedUser(null);
        loadUsers(); // Refresh user list
      }
    } catch (error: any) {
      alert('Fel vid uppdatering av email-verifiering: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Användarhantering</h2>
          <p className="text-gray-600">Hantera användare och se deras statistik</p>
        </div>
        <div className="text-sm text-gray-500">
          Totalt: {users.length} användare
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Sök på användarnamn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Sök</span>
          </button>
        </div>
      </form>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Användare
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrerad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coins Saldo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brända Coins
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Totalt Spenderat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Laddar användare...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Inga användare hittades
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-pink-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{formatDate(user.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Coins className="h-4 w-4 text-yellow-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {user.coin_balance.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Coins className="h-4 w-4 text-orange-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {user.total_burned_coins.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(user.total_spent_usd)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.is_verified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verifierad
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Ej verifierad
                          </span>
                        )}
                        {!user.is_active && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Blockerad
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          title="Ändra lösenord"
                        >
                          <Key className="h-4 w-4" />
                          <span>Lösenord</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            handleEmailVerification(user.id, !user.is_verified);
                          }}
                          className={`flex items-center space-x-1 ${
                            user.is_verified 
                              ? 'text-orange-600 hover:text-orange-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={user.is_verified ? 'Avaktivera email' : 'Aktivera email'}
                        >
                          {user.is_verified ? (
                            <>
                              <XCircle className="h-4 w-4" />
                              <span>Avaktivera</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              <span>Aktivera</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Visar {((currentPage - 1) * usersPerPage) + 1} till {Math.min(currentPage * usersPerPage, users.length)} av {users.length} användare
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Föregående
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nästa
            </button>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ändra lösenord för {selectedUser.username}</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nytt lösenord</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Minst 6 tecken"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => handlePasswordChange(selectedUser.id)}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                >
                  Uppdatera lösenord
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;