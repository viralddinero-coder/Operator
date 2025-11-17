import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { coinPackageService, siteService } from '../../services/api'

const AdminCoinPackagesPage: React.FC = () => {
  const [sites, setSites] = useState<any[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [packages, setPackages] = useState<any[]>([])
  const [rate, setRate] = useState<number>(1.5)
  const [form, setForm] = useState({ name: '', coins: 0, price_eur: 0, sort_order: 0 })

  const loadSites = async () => {
    const { sites } = await siteService.getAllSites()
    setSites(sites)
    if (sites.length > 0 && !selectedSite) setSelectedSite(sites[0].id)
  }

  const loadPackages = async () => {
    if (!selectedSite) return
    const { packages } = await coinPackageService.getCoinPackagesForSite(selectedSite, false)
    setPackages(packages)
    const { data: siteRow } = await supabase.from('sites').select('settings').eq('id', selectedSite).single()
    setRate(siteRow?.settings?.coin_rate_eur ?? 1.5)
  }

  useEffect(() => { loadSites() }, [])
  useEffect(() => { loadPackages() }, [selectedSite])

  const saveRate = async () => {
    const { error } = await supabase.from('sites').update({ settings: { coin_rate_eur: rate } }).eq('id', selectedSite)
    if (!error) alert('Baspris per mynt uppdaterat')
  }

  const createPackage = async () => {
    if (!selectedSite || !form.name || !form.coins || !form.price_eur) return
    const { package: pkg } = await coinPackageService.createCoinPackage({
      name: form.name,
      coin_amount: form.coins,
      price_eur: form.price_eur,
      currency: 'EUR',
      site_id: selectedSite,
      is_active: true,
      sort_order: form.sort_order,
    })
    setForm({ name: '', coins: 0, price_eur: 0, sort_order: 0 })
    loadPackages()
  }

  const updatePackage = async (id: string, updates: any) => {
    await coinPackageService.updateCoinPackage(id, updates)
    loadPackages()
  }

  const deletePackage = async (id: string) => {
    await supabase.from('coin_packages').delete().eq('id', id)
    loadPackages()
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Myntpaket per site</h2>
      <div className="bg-white rounded-lg border p-4 mb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)} className="border rounded px-3 py-2">
            {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.domain})</option>)}
          </select>
          <div>
            <label className="text-sm text-gray-600">Baspris per mynt (EUR)</label>
            <input type="number" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="flex items-end">
            <button onClick={saveRate} className="px-3 py-2 bg-black text-white rounded">Spara baspris</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-4">
        <h3 className="font-semibold mb-3">Skapa paket</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Namn" className="border rounded px-3 py-2" />
          <input type="number" value={form.coins} onChange={(e) => setForm({ ...form, coins: parseInt(e.target.value || '0') })} placeholder="Mynt" className="border rounded px-3 py-2" />
          <input type="number" value={form.price_eur} onChange={(e) => setForm({ ...form, price_eur: parseFloat(e.target.value || '0') })} placeholder="Pris (EUR)" className="border rounded px-3 py-2" />
          <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || '0') })} placeholder="Sortering" className="border rounded px-3 py-2" />
        </div>
        <div className="mt-3">
          <button onClick={createPackage} className="px-3 py-2 bg-pink-600 text-white rounded">Skapa</button>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-3">Namn</th>
              <th className="p-3">Mynt</th>
              <th className="p-3">Pris (EUR)</th>
              <th className="p-3">Aktiv</th>
              <th className="p-3">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.coin_amount}</td>
                <td className="p-3">{p.price_eur}</td>
                <td className="p-3">{p.is_active ? 'Ja' : 'Nej'}</td>
                <td className="p-3 space-x-2">
                  <button onClick={() => updatePackage(p.id, { is_active: !p.is_active })} className="px-3 py-1 border rounded">{p.is_active ? 'Inaktivera' : 'Aktivera'}</button>
                  <button onClick={() => deletePackage(p.id)} className="px-3 py-1 border rounded">Ta bort</button>
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr><td className="p-3" colSpan={5}>Inga paket</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminCoinPackagesPage

