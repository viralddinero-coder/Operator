import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminTransactionsPage: React.FC = () => {
  const [txs, setTxs] = useState<any[]>([]);
  const [period, setPeriod] = useState<'today' | 'all'>('today');

  const load = async () => {
    let query = supabase.from('coin_transactions').select('*').order('created_at', { ascending: false }).limit(500);
    if (period === 'today') {
      query = query.gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
    }
    const { data } = await query;
    setTxs(data || []);
  };

  useEffect(() => { load(); }, [period]);

  const totalDeposits = useMemo(() => txs.filter((t) => t.transaction_type === 'purchase' && (t.amount || 0) > 0).reduce((s, t) => s + (t.amount || 0), 0), [txs]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Transaktioner</h2>
      <div className="bg-white rounded-lg border p-4 mb-4 flex items-center gap-3">
        <label>Period:</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="border rounded px-3 py-2">
          <option value="today">Idag</option>
          <option value="all">Alla</option>
        </select>
        <div className="ml-auto text-sm">Totala deposits: <span className="font-semibold">{totalDeposits}</span> coins</div>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-3">Användare</th>
              <th className="p-3">Typ</th>
              <th className="p-3">Belopp</th>
              <th className="p-3">Saldo efter</th>
              <th className="p-3">Skapad</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3">{t.user_id}</td>
                <td className="p-3">{t.transaction_type}</td>
                <td className="p-3">{t.amount}</td>
                <td className="p-3">{t.coins_balance_after}</td>
                <td className="p-3">{new Date(t.created_at).toLocaleString('sv-SE')}</td>
              </tr>
            ))}
            {txs.length === 0 && (
              <tr><td className="p-3" colSpan={5}>Inga transaktioner</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTransactionsPage;
