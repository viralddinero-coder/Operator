import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { userService, accountService } from '../../services/api';

const AdminOperatorsPage: React.FC = () => {
  const [operators, setOperators] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'operator')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOperators(data || []);
    } catch (err: any) {
      alert('Kunde inte hämta operatörer: ' + (err?.message || 'Okänt fel'));
      setOperators([]);
    }
  };

  useEffect(() => { load(); }, []);

  const createOperator = async () => {
    if (!username || !password) { alert('Fyll i användarnamn och lösenord'); return }
    try {
      const { userId, email, error } = await accountService.createUserServer(username, password, 'operator')
      if (error) throw error
      setUsername(''); setPassword('')
      await load();
      alert(`Operatör tillagd: ${email}`)
    } catch (err: any) {
      alert('Kunde inte skapa operatör: ' + (err?.message || 'Okänt fel'))
    }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
      load();
    } catch (err: any) {
      alert('Kunde inte uppdatera status: ' + (err?.message || 'Okänt fel'));
    }
  };

  const handlePasswordChange = async () => {
    if (!selectedOperator || !newPassword || newPassword.length < 6) {
      alert('Lösenordet måste vara minst 6 tecken långt');
      return;
    }
    
    const result = await accountService.updatePasswordServer(selectedOperator.id, newPassword);
    if (result.error) {
      alert('Fel vid uppdatering av lösenord: ' + result.error.message);
    } else {
      alert('Lösenordet har uppdaterats framgångsrikt');
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedOperator(null);
    }
  };

  const handleEmailActivation = async () => {
    if (!selectedOperator) return;
    
    const result = await userService.updateUserEmailVerification(selectedOperator.id, true);
    if (result.error) {
      alert('Fel vid aktivering av e-post: ' + result.error.message);
    } else {
      alert('E-postadressen har aktiverats');
      setShowEmailModal(false);
      setSelectedOperator(null);
      load();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Operatörer</h2>
      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Användarnamn" className="border rounded px-3 py-2" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Lösenord" className="border rounded px-3 py-2" />
          <button onClick={createOperator} className="px-3 py-2 bg-green-600 text-white rounded">Lägg till operatör</button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Operatörskonto hanteras endast via adminpanelen.</p>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-3">E‑post</th>
              <th className="p-3">Verifierad</th>
              <th className="p-3">Aktiv</th>
              <th className="p-3">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3">{o.email}</td>
                <td className="p-3">{o.is_verified ? 'Ja' : 'Nej'}</td>
                <td className="p-3">{o.is_active ? 'Aktiv' : 'Inaktiv'}</td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <button onClick={() => toggleActive(o.id, o.is_active)} className="px-3 py-1 border rounded text-sm">{o.is_active ? 'Inaktivera' : 'Aktivera'}</button>
                    <button onClick={() => { setSelectedOperator(o); setShowPasswordModal(true); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Byt lösenord</button>
                    {!o.is_verified && (
                      <button onClick={() => { setSelectedOperator(o); setShowEmailModal(true); }} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Aktivera e-post</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {operators.length === 0 && (
              <tr><td className="p-3" colSpan={4}>Inga operatörer</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Byt lösenord för {selectedOperator?.email}</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nytt lösenord (minst 6 tecken)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-3">
              <button
                onClick={handlePasswordChange}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Uppdatera lösenord
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setSelectedOperator(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Activation Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Aktivera e-postadress</h3>
            <p className="text-gray-600 mb-4">
              Är du säker på att du vill aktivera e-postadressen för {selectedOperator?.email}?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleEmailActivation}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Aktivera e-post
              </button>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setSelectedOperator(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOperatorsPage;
