import React, { useEffect, useState } from 'react'
import { siteService, massMessageService, operatorService } from '../../services/api'

const AdminMassMessagePage: React.FC = () => {
  const [sites, setSites] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [siteId, setSiteId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [text, setText] = useState('')
  const [rate, setRate] = useState(60)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ sent: 0, total: 0 })

  useEffect(() => { (async () => { const { sites } = await siteService.getAllSites(); setSites(sites) })() }, [])
  useEffect(() => { (async () => { const { profiles } = await operatorService.getOperatorProfilesForAdmin(); setProfiles(profiles || []) })() }, [])

  const start = async () => {
    if (!siteId || !profileId || !text) return
    setRunning(true)
    const { job } = await massMessageService.start(siteId, profileId, text, rate)
    // in real app use realtime; here poll mass_messages for progress
    const int = setInterval(async () => {
      const { data } = await (await import('../../lib/supabase')).supabase
        .from('mass_messages').select('sent_count,total_targets,status').eq('id', job!.id).single()
      if (data?.status === 'completed') { setProgress({ sent: data.sent_count || 0, total: data.total_targets || 0 }); clearInterval(int); setRunning(false) }
      else if (data) setProgress({ sent: data.sent_count || 0, total: data.total_targets || 0 })
    }, 2000)
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Mass Message</h2>
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Choose site</option>
            {sites.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={profileId} onChange={(e) => setProfileId(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Choose sending profile</option>
            {profiles.map((p:any) => <option key={p.id} value={p.user_id}>{p.name} • {p.age}</option>)}
          </select>
          <input type="number" value={rate} onChange={(e) => setRate(parseInt(e.target.value || '60'))} className="border rounded px-3 py-2" placeholder="Rate per minute" />
          <button onClick={start} disabled={running} className="px-3 py-2 bg-black text-white rounded">{running?'Running...':'Start'}</button>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your message here" className="border rounded px-3 py-2 w-full h-28" />
        <div className="text-sm text-gray-600">Progress: {progress.sent}/{progress.total}</div>
      </div>
    </div>
  )
}

export default AdminMassMessagePage

