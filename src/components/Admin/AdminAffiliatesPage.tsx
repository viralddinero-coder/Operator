import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminAffiliatesPage: React.FC = () => {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [code, setCode] = useState('');

  const load = async () => {
    const { data } = await supabase.from('affiliates').select('*').order('created_at', { ascending: false });
    setAffiliates(data || []);
  };

  useEffect(() => { load(); }, []);

  const createLink = async () => {
    if (!selected || !code) return;
    await supabase.from('affiliate_links').insert({ affiliate_id: selected.id, code, is_active: true });
    setCode('');
  };

  const [links, setLinks] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);

  const loadDetails = async (aff: any) => {
    setSelected(aff);
    const { data: ln } = await supabase.from('affiliate_links').select('*').eq('affiliate_id', aff.id);
    setLinks(ln || []);
    const linkIds = (ln || []).map((l: any) => l.id);
    if (linkIds.length) {
      const { data: rf } = await supabase.from('affiliate_referrals').select('*').in('affiliate_link_id', linkIds);
      setReferrals(rf || []);
      const userIds = (rf || []).map((r: any) => r.user_id);
      if (userIds.length) {
        const { data: tx } = await supabase.from('coin_transactions').select('amount, user_id, transaction_type').in('user_id', userIds).eq('transaction_type', 'purchase');
        setTotal((tx || []).reduce((s: number, t: any) => s + (t.amount || 0), 0));
      } else setTotal(0);
    } else {
      setReferrals([]); setTotal(0);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Affiliates</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {affiliates.map((a) => (
            <button key={a.id} onClick={() => loadDetails(a)} className={`w-full text-left p-2 rounded ${selected?.id===a.id?'bg-pink-50':''}`}>{a.code || a.id}</button>
          ))}
          {affiliates.length===0 && <div className="text-sm text-gray-600">Inga affiliates</div>}
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Länkar</h3>
        {selected ? (
          <>
            <div className="flex gap-2 mb-3">
              <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Ny kod" className="border rounded px-3 py-2" />
              <button onClick={createLink} className="px-3 py-2 bg-blue-600 text-white rounded">Skapa länk</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {links.map((l)=> (
                <div key={l.id} className="border rounded p-2">{l.code}</div>
              ))}
              {links.length===0 && <div className="text-sm text-gray-600">Inga länkar</div>}
            </div>
          </>
        ) : <div className="text-sm text-gray-600">Välj en affiliate</div>}
      </div>
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Referrals och omsättning</h3>
        {selected ? (
          <>
            <div className="text-sm mb-2">Totalt handlat: <span className="font-semibold">{total}</span> coins</div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {referrals.map((r)=> (
                <div key={r.id} className="border rounded p-2">
                  <div className="font-semibold">{r.profile_name || r.user_id}</div>
                  <div className="text-xs text-gray-600">{r.user_id}</div>
                </div>
              ))}
              {referrals.length===0 && <div className="text-sm text-gray-600">Inga referrals</div>}
            </div>
          </>
        ) : <div className="text-sm text-gray-600">Välj en affiliate</div>}
      </div>
    </div>
  );
};

export default AdminAffiliatesPage;
