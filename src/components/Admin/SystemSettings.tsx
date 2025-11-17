import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Trash2, Key } from 'lucide-react';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<{ key: string; value: any }[]>([]);
  const [message, setMessage] = useState('');
  const [operators, setOperators] = useState<any[]>([]);
  const [showAddOperator, setShowAddOperator] = useState(false);
  const [newOperator, setNewOperator] = useState({ email: '', password: '', name: '' });
  const [adminId, setAdminId] = useState('');
  const [adminModules, setAdminModules] = useState<string[]>([]);
  const [mailEnabled, setMailEnabled] = useState(true);
  const [mailSettings, setMailSettings] = useState({
    activateMail: true,
    forgotPassword: true,
    buyReceipt: true,
    offlineNotify: true,
    offlineThresholdMin: 30
  });
  const [registrationBgUrl, setRegistrationBgUrl] = useState('')
  const [stringsOperator, setStringsOperator] = useState<string>('')
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [announcementText, setAnnouncementText] = useState('')
  const [announcementStyle, setAnnouncementStyle] = useState<'info'|'success'|'warning'|'danger'>('info')
  const [sites, setSites] = useState<any[]>([])
  const [mailSiteId, setMailSiteId] = useState<string>('')
  const [smtp, setSmtp] = useState({ host: '', port: 587, secure: false, username: '', password: '', from_name: '', from_email: '' })
  const [regSiteId, setRegSiteId] = useState<string>('')
  const [annSiteId, setAnnSiteId] = useState<string>('')
  const [adminBrandTitle, setAdminBrandTitle] = useState('Affilyx Marketing Admin')
  const [adminBrandQuote, setAdminBrandQuote] = useState('Own the day. Own the outcome.')
  const [adminLogoUrl, setAdminLogoUrl] = useState('')
  const [operatorBrandQuote, setOperatorBrandQuote] = useState('WE MAKE IT TODAY AS WELL')
  const [operatorLogoUrl, setOperatorLogoUrl] = useState('')

  useEffect(() => {
  const load = async () => {
    const { data } = await supabase.from('system_settings').select('*');
    setSettings((data || []).map((d: any) => ({ key: d.key, value: d.value })));
    loadOperators();
    const { data: siteRows } = await supabase.from('sites').select('id,name,domain').order('created_at',{ascending:false})
    setSites(siteRows || [])
    const mail = (data || []).find((d: any) => d.key === 'mail_settings');
    if (mail?.value) {
      setMailEnabled(mail.value.enabled ?? true);
      setMailSettings({
        activateMail: mail.value.activateMail ?? true,
        forgotPassword: mail.value.forgotPassword ?? true,
        buyReceipt: mail.value.buyReceipt ?? true,
        offlineNotify: mail.value.offlineNotify ?? true,
        offlineThresholdMin: mail.value.offlineThresholdMin ?? 30
      });
    }
    const str = (data || []).find((d: any) => d.key === 'strings_operator');
    if (str?.value) setStringsOperator(JSON.stringify(str.value, null, 2))
    const regBg = (data || []).find((d: any) => d.key === 'registration_bg_url');
    if (regBg?.value) setRegistrationBgUrl(regBg.value)
    const ann = (data || []).find((d: any) => d.key === 'announcement_banner');
    if (ann?.value) {
      setAnnouncementEnabled(!!ann.value.enabled)
      setAnnouncementText(ann.value.text || '')
      setAnnouncementStyle(ann.value.style || 'info')
    }
    const abt = (data || []).find((d: any) => d.key === 'admin_brand_title')
    const abq = (data || []).find((d: any) => d.key === 'admin_brand_quote')
    const al = (data || []).find((d: any) => d.key === 'admin_logo_url')
    const obq = (data || []).find((d: any) => d.key === 'operator_brand_quote')
    const ol = (data || []).find((d: any) => d.key === 'operator_logo_url')
    if (abt?.value) setAdminBrandTitle(abt.value)
    if (abq?.value) setAdminBrandQuote(abq.value)
    if (al?.value) setAdminLogoUrl(al.value)
    if (obq?.value) setOperatorBrandQuote(obq.value)
    if (ol?.value) setOperatorLogoUrl(ol.value)
    
  };
    load();
  }, []);

  const loadOperators = async () => {
    const { data } = await supabase
      .from('users')
      .select('*, profiles!inner(name)')
      .eq('role', 'operator')
      .order('created_at', { ascending: false });
    setOperators(data || []);
  };

  const addOperator = async () => {
    if (!newOperator.email || !newOperator.password || !newOperator.name) {
      setMessage('Fyll i alla fält');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newOperator.email,
        password: newOperator.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Kunde inte skapa användare');

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: newOperator.email,
          role: 'operator',
          is_verified: true,
          is_active: true,
        });

      if (userError) throw userError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          site_id: 'default-site-id',
          name: newOperator.name,
          age: 25,
          gender: 'other',
          location: '',
          bio: null,
          interests: [],
          online_status: 'offline',
          is_profile_complete: false,
        });

      if (profileError) throw profileError;

      setMessage('Operatör tillagd');
      setNewOperator({ email: '', password: '', name: '' });
      setShowAddOperator(false);
      loadOperators();
      setTimeout(() => setMessage(''), 2000);
    } catch (error: any) {
      setMessage('Fel: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const deleteOperator = async (operatorId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna operatör?')) return;

    try {
      // Delete from users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', operatorId);

      if (error) throw error;

      setMessage('Operatör borttagen');
      loadOperators();
      setTimeout(() => setMessage(''), 2000);
    } catch (error: any) {
      setMessage('Fel: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const update = async (key: string, value: any) => {
    await supabase.from('system_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    setMessage('Inställningar sparade');
    setTimeout(() => setMessage(''), 2000);
  };

  const get = (key: string) => settings.find((s) => s.key === key)?.value ?? '';

  return (
    <div className="space-y-6">
      {/* System Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Systeminställningar</h2>
        {message && <div className="mb-3 text-sm text-green-700">{message}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minsta ålder</label>
            <input type="number" defaultValue={get('min_age')} onBlur={(e) => update('min_age', parseInt(e.target.value || '18'))} className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Standard site</label>
            <input type="text" defaultValue={get('default_site')} onBlur={(e) => update('default_site', e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate standard kommission (%)</label>
            <input type="number" defaultValue={get('affiliate_commission') || 10} onBlur={(e) => update('affiliate_commission', parseFloat(e.target.value || '10'))} className="border rounded px-3 py-2 w-full" />
          </div>
        </div>
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Admin-behörigheter</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin user ID</label>
              <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tillåtna moduler</label>
              <div className="flex flex-wrap gap-2">
                {['dashboard','sajter','profiler','operatörer','användare','transaktioner','moderering','inställningar'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setAdminModules((prev) => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                    className={`px-3 py-1 rounded border ${adminModules.includes(m) ? 'bg-purple-600 text-white' : 'bg-white'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={async () => {
                if (!adminId) { setMessage('Fyll i Admin user ID'); setTimeout(() => setMessage(''), 2000); return }
                await supabase.from('system_settings').upsert({ key: `admin_permissions:${adminId}`, value: { modules: adminModules }, updated_at: new Date().toISOString() })
                setMessage('Behörigheter uppdaterade')
                setTimeout(() => setMessage(''), 2000)
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
            >
              Spara behörigheter
            </button>
          </div>
        </div>
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Mail & Notiser</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sajt</label>
                <select value={mailSiteId} onChange={async (e)=>{ const id=e.target.value; setMailSiteId(id); if (!id) return; const { data: ms } = await supabase.from('system_settings').select('value').eq('key', `site:${id}:mail_settings`).maybeSingle(); if (ms?.value) setMailSettings({ ...mailSettings, ...ms.value }); const { data: sc } = await supabase.from('system_settings').select('value').eq('key', `site:${id}:smtp_config`).maybeSingle(); if (sc?.value) setSmtp({ ...smtp, ...sc.value }) }} className="border rounded px-3 py-2 w-full">
                  <option value="">Välj sajt</option>
                  {sites.map((s:any)=> (<option key={s.id} value={s.id}>{s.name} ({s.domain})</option>))}
                </select>
              </div>
            </div>
            <label className="flex items-center justify-between">
              <span>Aktivera mail</span>
              <input type="checkbox" checked={mailEnabled} onChange={(e) => setMailEnabled(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between">
              <span>Registreringsmail</span>
              <input type="checkbox" checked={mailSettings.activateMail} onChange={(e) => setMailSettings({ ...mailSettings, activateMail: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between">
              <span>Glömt lösenord</span>
              <input type="checkbox" checked={mailSettings.forgotPassword} onChange={(e) => setMailSettings({ ...mailSettings, forgotPassword: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between">
              <span>Köpkvitto</span>
              <input type="checkbox" checked={mailSettings.buyReceipt} onChange={(e) => setMailSettings({ ...mailSettings, buyReceipt: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between">
              <span>Offline‑notis vid nytt meddelande</span>
              <input type="checkbox" checked={mailSettings.offlineNotify} onChange={(e) => setMailSettings({ ...mailSettings, offlineNotify: e.target.checked })} />
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offline‑tröskel (minuter)</label>
              <input type="number" value={mailSettings.offlineThresholdMin} onChange={(e) => setMailSettings({ ...mailSettings, offlineThresholdMin: parseInt(e.target.value || '30') })} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <button
                onClick={async () => {
                  const key = mailSiteId ? `site:${mailSiteId}:mail_settings` : 'mail_settings'
                  await supabase.from('system_settings').upsert({ key, value: { enabled: mailEnabled, ...mailSettings }, updated_at: new Date().toISOString() })
                  setMessage('Mailinställningar sparade')
                  setTimeout(() => setMessage(''), 2000)
                }}
                className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg"
              >
                Spara mailinställningar
              </button>
            </div>
            <div className="mt-4 border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">SMTP‑konfiguration (per sajt)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={smtp.host} onChange={(e)=>setSmtp({ ...smtp, host: e.target.value })} placeholder="Host" className="border rounded px-3 py-2" />
                <input type="number" value={smtp.port} onChange={(e)=>setSmtp({ ...smtp, port: parseInt(e.target.value||'587') })} placeholder="Port" className="border rounded px-3 py-2" />
                <label className="flex items-center gap-2"><input type="checkbox" checked={smtp.secure} onChange={(e)=>setSmtp({ ...smtp, secure: e.target.checked })} /> <span>Secure (TLS)</span></label>
                <input value={smtp.username} onChange={(e)=>setSmtp({ ...smtp, username: e.target.value })} placeholder="Username/API key" className="border rounded px-3 py-2" />
                <input type="password" value={smtp.password} onChange={(e)=>setSmtp({ ...smtp, password: e.target.value })} placeholder="Password/Secret" className="border rounded px-3 py-2" />
                <input value={smtp.from_name} onChange={(e)=>setSmtp({ ...smtp, from_name: e.target.value })} placeholder="From name" className="border rounded px-3 py-2" />
                <input value={smtp.from_email} onChange={(e)=>setSmtp({ ...smtp, from_email: e.target.value })} placeholder="From email" className="border rounded px-3 py-2" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={async ()=>{ const key = mailSiteId ? `site:${mailSiteId}:smtp_config` : 'smtp_config'; await supabase.from('system_settings').upsert({ key, value: smtp, updated_at: new Date().toISOString() }); setMessage('SMTP sparad'); setTimeout(()=>setMessage(''),2000) }} className="px-3 py-2 bg-black text-white rounded">Spara SMTP</button>
                <button onClick={async ()=>{ const { success } = await (await import('../../services/api')).supportService.testSMTPConnection(smtp); setMessage(success ? 'Test OK' : 'Test misslyckades'); setTimeout(()=>setMessage(''),2000) }} className="px-3 py-2 border rounded">Testa anslutning</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Värden sparas per vald sajt. Lösenord visas inte i klartext vid omladdning.</p>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Branding (Admin & Operatör)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin titel</label>
              <input value={adminBrandTitle} onChange={(e)=>setAdminBrandTitle(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin citat</label>
              <input value={adminBrandQuote} onChange={(e)=>setAdminBrandQuote(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin logo URL</label>
              <input type="url" value={adminLogoUrl} onChange={(e)=>setAdminLogoUrl(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operator citat</label>
              <input value={operatorBrandQuote} onChange={(e)=>setOperatorBrandQuote(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operator logo URL</label>
              <input type="url" value={operatorLogoUrl} onChange={(e)=>setOperatorLogoUrl(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
          </div>
          <div className="mt-3">
            <button onClick={async ()=>{
              await supabase.from('system_settings').upsert({ key: 'admin_brand_title', value: adminBrandTitle, updated_at: new Date().toISOString() })
              await supabase.from('system_settings').upsert({ key: 'admin_brand_quote', value: adminBrandQuote, updated_at: new Date().toISOString() })
              await supabase.from('system_settings').upsert({ key: 'admin_logo_url', value: adminLogoUrl, updated_at: new Date().toISOString() })
              await supabase.from('system_settings').upsert({ key: 'operator_brand_quote', value: operatorBrandQuote, updated_at: new Date().toISOString() })
              await supabase.from('system_settings').upsert({ key: 'operator_logo_url', value: operatorLogoUrl, updated_at: new Date().toISOString() })
              setMessage('Branding sparad')
              setTimeout(()=>setMessage(''),2000)
            }} className="bg-black text-white px-4 py-2 rounded">Spara branding</button>
          </div>
        </div>
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Språk & Strängar (Operator)</h3>
          <p className="text-sm text-gray-600 mb-2">Redigera kopieringssträngar via JSON. Tomt = standard engelska.</p>
          <textarea value={stringsOperator} onChange={(e) => setStringsOperator(e.target.value)} className="w-full h-48 border rounded px-3 py-2 font-mono text-sm" />
          <div className="mt-3">
            <button
              onClick={async () => {
                let val: any = null
                try { val = stringsOperator ? JSON.parse(stringsOperator) : null } catch {}
                await supabase.from('system_settings').upsert({ key: 'strings_operator', value: val, updated_at: new Date().toISOString() })
                setMessage('Strängar uppdaterade')
                setTimeout(() => setMessage(''), 2000)
              }}
              className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg"
            >
              Spara strängar
            </button>
          </div>
        </div>
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Registration Background</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <select value={regSiteId} onChange={async (e)=>{ const id=e.target.value; setRegSiteId(id); if (!id) return; const { data } = await supabase.from('system_settings').select('value').eq('key', `site:${id}:registration_bg_url`).maybeSingle(); setRegistrationBgUrl(data?.value || '') }} className="border rounded px-3 py-2">
              <option value="">Välj sajt</option>
              {sites.map((s:any)=> (<option key={s.id} value={s.id}>{s.name} ({s.domain})</option>))}
            </select>
            <div className="md:col-span-2"></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="url" value={registrationBgUrl} onChange={(e) => setRegistrationBgUrl(e.target.value)} placeholder="https://..." className="border rounded px-3 py-2 w-full" />
            <button onClick={async ()=>{ const key = regSiteId ? `site:${regSiteId}:registration_bg_url` : 'registration_bg_url'; await supabase.from('system_settings').upsert({ key, value: registrationBgUrl, updated_at: new Date().toISOString() }); setMessage('Bakgrund uppdaterad'); setTimeout(()=>setMessage(''),2000) }} className="bg-black text-white px-4 py-2 rounded">Spara</button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Används på registreringssidan som en bakgrundsbild.</p>
        </div>
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Announcement Banner</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <select value={annSiteId} onChange={async (e)=>{ const id=e.target.value; setAnnSiteId(id); if (!id) return; const { data } = await supabase.from('system_settings').select('value').eq('key', `site:${id}:announcement_banner`).maybeSingle(); const val = data?.value || {}; setAnnouncementEnabled(!!val.enabled); setAnnouncementText(val.text || ''); setAnnouncementStyle(val.style || 'info') }} className="border rounded px-3 py-2">
              <option value="">Välj sajt</option>
              {sites.map((s:any)=> (<option key={s.id} value={s.id}>{s.name} ({s.domain})</option>))}
            </select>
            <div className="md:col-span-2"></div>
          </div>
          <label className="flex items-center justify-between mb-2">
            <span>Aktiverad</span>
            <input type="checkbox" checked={announcementEnabled} onChange={(e)=>setAnnouncementEnabled(e.target.checked)} />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={announcementText} onChange={(e)=>setAnnouncementText(e.target.value)} placeholder="Banner‑text" className="border rounded px-3 py-2 md:col-span-2" />
            <select value={announcementStyle} onChange={(e)=>setAnnouncementStyle(e.target.value as any)} className="border rounded px-3 py-2">
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>
          </div>
          <div className="mt-3">
            <button onClick={async ()=>{ const key = annSiteId ? `site:${annSiteId}:announcement_banner` : 'announcement_banner'; await supabase.from('system_settings').upsert({ key, value: { enabled: announcementEnabled, text: announcementText, style: announcementStyle }, updated_at: new Date().toISOString() }); setMessage('Banner uppdaterad'); setTimeout(()=>setMessage(''),2000) }} className="bg-black text-white px-4 py-2 rounded">Spara banner</button>
          </div>
        </div>
      </div>

      {/* Operator Management removed; use Operatörer sidan */}
    </div>
  );
};

export default SystemSettings;
