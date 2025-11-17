import React, { useEffect, useState } from 'react';
import { Search, SortAsc, SortDesc, PlusCircle } from 'lucide-react';
import { profileService, siteService, operatorService, photoService } from '../../services/api';
import { useUIStore } from '../../store';
import { useStrings } from '../../hooks/useStrings';
import { supabase } from '../../lib/supabase';

const OperatorProfilesPage: React.FC = () => {
  const { currentOperatorProfileId, setCurrentOperatorProfileId } = useUIStore();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'messages' | 'name'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [creating, setCreating] = useState(false);
  const [newProf, setNewProf] = useState({ name: '', age: 25, location: '', bio: '', status: 'offline', site_id: '' });
  const [newFiles, setNewFiles] = useState<FileList | null>(null)
  const [ui, setUi] = useState<any>({ theme: 'light', chat_background_enabled: false, chat_background_url: '' })
  const s = useStrings('operator','en')

  useEffect(() => {
    const load = async () => {
      const { sites } = await siteService.getAllSites();
      setSites(sites);
      const { profiles } = await profileService.getProfiles({ online_only: false });
      setProfiles((profiles || []).filter((p: any) => p.is_operator_profile));
    };
    load();
  }, []);

  useEffect(() => {
    const loadUi = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', `operator_ui:${currentOperatorProfileId || ''}`).maybeSingle()
      if (data?.value) setUi({ ...ui, ...data.value })
    }
    loadUi()
  }, [currentOperatorProfileId])

  const filtered = profiles
    .filter((p) => (!query || (p.name || '').toLowerCase().includes(query.toLowerCase())))
    .sort((a, b) => {
      if (sort === 'name') {
        return sortDir === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '');
      }
      const ma = a.sent_messages || 0;
      const mb = b.sent_messages || 0;
      return sortDir === 'asc' ? ma - mb : mb - ma;
    });

  const create = async () => {
    setCreating(true);
    const { profile } = await operatorService.createOperatorProfile({
      name: newProf.name,
      age: newProf.age,
      gender: 'female',
      location: newProf.location,
      bio: newProf.bio,
      status: newProf.status as any,
      assigned_operator_id: (await supabase.auth.getUser()).data.user?.id || null,
      site_id: newProf.site_id
    });
    if (profile && newFiles && newFiles.length > 0) {
      for (let i = 0; i < newFiles.length; i++) {
        const f = newFiles.item(i)!;
        await photoService.uploadPhoto(f, profile.user_id, profile.id);
      }
      // Set first as primary
      const { photos } = await photoService.getPhotosByProfile(profile.id)
      const first = (photos || [])[0]
      if (first) await photoService.setPrimaryPhoto(first.id, profile.user_id)
    }
    setCreating(false);
  };

  return (
    <div className={`${ui.theme==='dark'?'dark':''} min-h-screen ${ui.chat_background_enabled ? 'bg-cover bg-center' : ''}`} style={ui.chat_background_enabled ? { backgroundImage: `linear-gradient(rgba(255,255,255,.8), rgba(255,255,255,.8)), url(${ui.chat_background_url})`} : {}}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-600" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search profile" className="border rounded px-3 py-2" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSort('messages')} className="px-3 py-2 border rounded text-sm">Sort by sent messages</button>
            <button onClick={() => setSort('name')} className="px-3 py-2 border rounded text-sm">Sort by name</button>
            <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="px-3 py-2 border rounded text-sm">
              {sortDir === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </button>
            <button onClick={() => setCreating(true)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Create new profile
            </button>
          </div>
        </div>

        {creating && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={newProf.name} onChange={(e) => setNewProf({ ...newProf, name: e.target.value })} placeholder="Name" className="border rounded px-3 py-2" />
              <input type="number" value={newProf.age} onChange={(e) => setNewProf({ ...newProf, age: parseInt(e.target.value || '0') })} placeholder="Age" className="border rounded px-3 py-2" />
              <input value={newProf.location} onChange={(e) => setNewProf({ ...newProf, location: e.target.value })} placeholder="Location" className="border rounded px-3 py-2" />
              <select value={newProf.status} onChange={(e) => setNewProf({ ...newProf, status: e.target.value })} className="border rounded px-3 py-2">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="switching">Switching</option>
              </select>
              <select value={newProf.site_id} onChange={(e) => setNewProf({ ...newProf, site_id: e.target.value })} className="border rounded px-3 py-2">
                <option value="">Choose dating site</option>
                {sites.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <textarea value={newProf.bio} onChange={(e) => setNewProf({ ...newProf, bio: e.target.value })} placeholder="About" className="border rounded px-3 py-2 md:col-span-2" />
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Upload profile photos</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setNewFiles(e.target.files)} className="border rounded px-3 py-2 w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setCreating(false)} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={create} className="px-3 py-2 bg-blue-600 text-white rounded">Create</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className={`border rounded-lg p-4 ${currentOperatorProfileId === p.id ? 'ring-2 ring-blue-600' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.age} • {p.location}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${p.status === 'online' ? 'bg-green-500' : p.status === 'switching' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
              </div>
              <div className="mt-3 text-sm text-gray-700 line-clamp-3">{p.bio}</div>
              <div className="mt-3 flex justify-between">
                <button onClick={() => setCurrentOperatorProfileId(p.id)} className="px-3 py-2 bg-gray-100 rounded text-sm">Set as Player</button>
                <button onClick={async () => { await operatorService.pushProfileToPool(p.id); }} className="px-3 py-2 bg-purple-600 text-white rounded text-sm">Push</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-gray-600">No profiles</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorProfilesPage;
