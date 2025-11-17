import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { userService } from '../../services/api';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [password, setPassword] = useState('');

  const load = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(200);
    setUsers(data || []);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from('users').update({ is_active: !is_active }).eq('id', id);
    load();
  };

  const updateRole = async (id: string, role: 'user' | 'operator' | 'admin') => {
    await supabase.from('users').update({ role }).eq('id', id);
    load();
  };

  const filtered = users.filter((u) => !query || (u.email || '').toLowerCase().includes(query.toLowerCase()));

  const createAdmin = async () => {
    if (!newUsername || !newPassword) { alert('Fyll i användarnamn och lösenord'); return }
    const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    const email = isValidEmail(newEmail) ? newEmail : `${newUsername}.${Date.now()}@affilyx.local`
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email, password: newPassword, email_confirm: true })
      if (authError) throw authError
      const createdUserId = (authData as any)?.user?.id || (authData as any)?.id
      if (!createdUserId) throw new Error('Misslyckades att skapa auth‑konto')
      const { error } = await supabase.from('users').insert({ id: createdUserId, email, username: newUsername, role: 'admin', is_active: true, is_verified: isValidEmail(newEmail) })
      if (error) throw error
      setNewUsername(''); setNewPassword(''); setNewEmail('')
      load()
      alert('Adminkonto skapat')
    } catch (err: any) {
      alert('Kunde inte skapa admin: ' + (err?.message || 'Okänt fel'))
    }
  }

  const createMasterAdmin = async () => {
    try {
      const existing = await supabase.from('users').select('id').eq('username','DustinAdmin').maybeSingle();
      if (existing.data?.id) { alert('Master admin finns redan'); return }
      const email = `DustinAdmin@affilyx.local`;
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email, password: 'Hejhej123', email_confirm: true });
      if (authError) throw authError;
      const createdUserId = (authData as any)?.user?.id || (authData as any)?.id;
      const { error } = await supabase.from('users').insert({ id: createdUserId, email, username: 'DustinAdmin', role: 'admin', is_active: true, is_verified: false });
      if (error) throw error;
      await supabase.from('system_settings').upsert({ key: `admin_permissions:${createdUserId}`, value: { modules: ['dashboard','sajter','profiler','operatörer','användare','transaktioner','moderering','inställningar','mass message','myntpaket'] }, updated_at: new Date().toISOString() });
      load();
      alert('Master admin skapad');
    } catch (err: any) {
      alert('Kunde inte skapa master admin: ' + (err?.message || 'Okänt fel'))
    }
  }

  const handlePasswordChange = async () => {
    if (!selectedUser || !password || password.length < 6) { alert('Ange minst 6 tecken'); return }
    const result = await userService.updateUserPassword(selectedUser.id, password);
    if (result.error) alert('Fel: ' + (result.error as any)?.message || 'Okänt fel');
    else { alert('Lösenord uppdaterat'); setShowPasswordModal(false); setSelectedUser(null); setPassword('') }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Användare</h2>
      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sök e‑post" className="border rounded px-3 py-2 w-full md:col-span-3" />
          <button onClick={createMasterAdmin} className="px-3 py-2 bg-black text-white rounded">Skapa Master Admin</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Användarnamn (admin)" className="border rounded px-3 py-2" />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Lösenord" className="border rounded px-3 py-2" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="E‑post (valfritt)" className="border rounded px-3 py-2" />
          <button onClick={createAdmin} className="px-3 py-2 bg-purple-600 text-white rounded">Skapa admin</button>
        </div>
        <p className="text-xs text-gray-500 mt-2">E‑post kan kopplas senare. Internt konto skapas med {`@affilyx.local`} om e‑post lämnas tom.</p>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-3">E‑post</th>
              <th className="p-3">Användarnamn</th>
              <th className="p-3">Roll</th>
              <th className="p-3">Verifierad</th>
              <th className="p-3">Aktiv</th>
              <th className="p-3">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3">
                  <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value as any)} className="border rounded px-2 py-1">
                    <option value="user">user</option>
                    <option value="operator">operator</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="p-3">{u.is_verified ? 'Ja' : 'Nej'}</td>
                <td className="p-3">{u.is_active ? 'Aktiv' : 'Inaktiv'}</td>
                <td className="p-3">
                  <button onClick={() => toggleActive(u.id, u.is_active)} className="px-3 py-1 border rounded mr-2">{u.is_active ? 'Inaktivera' : 'Aktivera'}</button>
                  <button onClick={() => { setSelectedUser(u); setShowPasswordModal(true) }} className="px-3 py-1 bg-blue-600 text-white rounded">Byt lösenord</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className="p-3" colSpan={5}>Inga användare</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Byt lösenord för {selectedUser?.email || selectedUser?.username}</h3>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Nytt lösenord" className="border rounded px-3 py-2 w-full mb-3" />
            <div className="flex gap-2 justify-end">
              <button onClick={()=>{ setShowPasswordModal(false); setSelectedUser(null); setPassword('') }} className="px-3 py-2 border rounded">Avbryt</button>
              <button onClick={handlePasswordChange} className="px-3 py-2 bg-blue-600 text-white rounded">Uppdatera</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
