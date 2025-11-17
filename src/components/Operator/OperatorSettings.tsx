import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store'

const OperatorSettings: React.FC = () => {
  const { user } = useAuthStore()
  const [settings, setSettings] = useState<any>({ notifications: true, sound: true, default_status: 'online' })
  const key = user ? `operator_settings:${user.id}` : ''
  const [ui, setUi] = useState<any>({ theme: 'light', chat_background_enabled: false, chat_background_url: '' })
  const uiKey = user ? `operator_ui:${user.id}` : ''

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const { data } = await supabase.from('system_settings').select('value').eq('key', key).maybeSingle()
      if (data?.value) setSettings({ ...settings, ...data.value })
      const { data: uiData } = await supabase.from('system_settings').select('value').eq('key', uiKey).maybeSingle()
      if (uiData?.value) setUi({ ...ui, ...uiData.value })
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const save = async () => {
    if (!user) return
    await supabase.from('system_settings').upsert({ key, value: settings, updated_at: new Date().toISOString() })
    alert('Inställningar sparade')
  }
  const saveUi = async () => {
    if (!user) return
    await supabase.from('system_settings').upsert({ key: uiKey, value: ui, updated_at: new Date().toISOString() })
    alert('UI-inställningar sparade')
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Inställningar</h2>
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <label className="flex items-center justify-between">
          <span>Notiser</span>
          <input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between">
          <span>Ljud vid meddelanden</span>
          <input type="checkbox" checked={settings.sound} onChange={(e) => setSettings({ ...settings, sound: e.target.checked })} />
        </label>
        <div>
          <label className="block text-sm mb-1">Standardstatus</label>
          <select value={settings.default_status} onChange={(e) => setSettings({ ...settings, default_status: e.target.value })} className="border rounded px-3 py-2">
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="switching">Switching</option>
          </select>
        </div>
        <button onClick={save} className="px-3 py-2 bg-black text-white rounded">Spara</button>
      </div>

      <div className="bg-white rounded-lg border p-4 space-y-4 mt-4">
        <h3 className="text-lg font-semibold">UI</h3>
        <div>
          <label className="block text-sm mb-1">Theme</label>
          <select value={ui.theme} onChange={(e) => setUi({ ...ui, theme: e.target.value })} className="border rounded px-3 py-2">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <label className="flex items-center justify-between">
          <span>Background enabled (chat)</span>
          <input type="checkbox" checked={ui.chat_background_enabled} onChange={(e) => setUi({ ...ui, chat_background_enabled: e.target.checked })} />
        </label>
        <div>
          <label className="block text-sm mb-1">Background URL</label>
          <input type="url" value={ui.chat_background_url} onChange={(e) => setUi({ ...ui, chat_background_url: e.target.value })} className="border rounded px-3 py-2 w-full" />
        </div>
        <button onClick={saveUi} className="px-3 py-2 bg-black text-white rounded">Save UI</button>
      </div>
    </div>
  )
}

export default OperatorSettings
