import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const HealthPage: React.FC = () => {
  const [envOk, setEnvOk] = useState<boolean>(false)
  const [apiOk, setApiOk] = useState<boolean>(false)
  const [roleInfo, setRoleInfo] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    try {
      const urlOk = !!(supabase as any).url
      const keyOk = !!(supabase as any).key
      setEnvOk(urlOk && keyOk)
    } catch (e) {
      setEnvOk(false)
    }
    ;(async () => {
      try {
        const { data: setts, error: e1 } = await supabase.from('system_settings').select('key').limit(1)
        if (e1) throw e1
        setApiOk(true)
      } catch (e: any) {
        setApiOk(false)
        setError(e?.message || String(e))
      }
      try {
        const { data: user } = await supabase.auth.getUser()
        const uid = user?.user?.id
        if (uid) {
          const { data: rows } = await supabase.from('users').select('role,username').eq('id', uid).limit(1)
          const r = rows && rows[0]
          setRoleInfo(r ? `${r.role} (${r.username || ''})` : 'unknown')
        } else {
          setRoleInfo('no session')
        }
      } catch (e) {
        setRoleInfo('error')
      }
    })()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white border rounded-lg p-6 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4">Health</h1>
        <div className="space-y-2 text-sm">
          <div>Env: {envOk ? 'OK' : 'Missing'}</div>
          <div>Supabase: {apiOk ? 'OK' : 'Error'}</div>
          {error && <div className="text-red-600">{error}</div>}
          <div>Session role: {roleInfo || '—'}</div>
        </div>
      </div>
    </div>
  )
}

export default HealthPage
