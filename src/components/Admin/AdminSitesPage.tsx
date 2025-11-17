import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminSitesPage: React.FC = () => {
  const [sites, setSites] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSites(data || []);
    } catch (err: any) {
      alert('Kunde inte hämta sajter: ' + (err?.message || 'Okänt fel'));
      setSites([]);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('sites')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
      load();
    } catch (err: any) {
      alert('Kunde inte uppdatera status: ' + (err?.message || 'Okänt fel'));
    }
  };

  const createSite = async () => {
    if (!name || !domain) {
      alert('Fyll i både namn och domän');
      return;
    }
    try {
      const { error } = await supabase
        .from('sites')
        .insert({ name, domain, is_active: true });
      if (error) throw error;
      setName('');
      setDomain('');
      load();
      alert('Sajt skapad');
    } catch (err: any) {
      alert('Kunde inte skapa sajt: ' + (err?.message || 'Okänt fel'));
    }
  };

  const deleteSite = async (id: string) => {
    if (!confirm('Ta bort sajt?')) return;
    try {
      const { error } = await supabase.from('sites').delete().eq('id', id);
      if (error) throw error;
      load();
    } catch (err: any) {
      alert('Kunde inte ta bort sajt: ' + (err?.message || 'Okänt fel'))
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Sajter</h2>
      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Namn" className="border rounded px-3 py-2" />
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domän" className="border rounded px-3 py-2" />
          <button onClick={createSite} className="px-3 py-2 bg-blue-600 text-white rounded">Skapa</button>
        </div>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-3">Namn</th>
              <th className="p-3">Domän</th>
              <th className="p-3">Status</th>
              <th className="p-3">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.name}</td>
                <td className="p-3">{s.domain}</td>
                <td className="p-3">{s.is_active ? 'Aktiv' : 'Inaktiv'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(s.id, s.is_active)} className="px-3 py-1 border rounded">{s.is_active ? 'Inaktivera' : 'Aktivera'}</button>
                    <button onClick={() => deleteSite(s.id)} className="px-3 py-1 border rounded text-red-600">Ta bort</button>
                  </div>
                </td>
              </tr>
            ))}
            {sites.length === 0 && (
              <tr><td className="p-3" colSpan={4}>Inga sajter</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSitesPage;
