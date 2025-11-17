import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const DevBootstrapAdmin: React.FC = () => {
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)

  const create = async () => {
    try {
      setCreating(true)
      setStatus('Skapar...')
      const email = `DustinAdmin.${Date.now()}@affilyx.local`
      const password = 'Hejhej123'
      // create via admin API to avoid email rate limits
      const { data: created, error: adminErr } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
      if (adminErr) throw adminErr
      const userId = (created as any)?.user?.id || (created as any)?.id
      if (!userId) throw new Error('Ingen user id')
      const { error: insertErr } = await supabase.from('users').insert({ id: userId, email, username: 'DustinAdmin', role: 'admin', is_active: true, is_verified: true })
      if (insertErr) throw insertErr
      await supabase.from('system_settings').upsert({ key: `admin_permissions:${userId}`, value: { modules: ['dashboard','sajter','profiler','operatörer','användare','transaktioner','moderering','inställningar','mass message','myntpaket'] }, updated_at: new Date().toISOString() })
      setStatus('Master Admin skapad. Testa att logga in.')
    } catch (err: any) {
      setStatus('Fel: ' + (err?.message || 'Okänt fel'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white border rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-xl font-semibold mb-4">Bootstrap Master Admin</h1>
        <p className="text-sm text-gray-600 mb-4">Skapar kontot DustinAdmin med lösenord Hejhej123</p>
        <button onClick={create} disabled={creating} className="px-4 py-2 bg-black text-white rounded">{creating?'Skapar...':'Skapa'}</button>
        {status && (<div className="mt-4 text-sm">{status}</div>)}
      </div>
    </div>
  )
}

export default DevBootstrapAdmin
