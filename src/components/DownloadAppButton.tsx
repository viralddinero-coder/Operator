import React, { useEffect, useState } from 'react'

const DownloadAppButton: React.FC = () => {
  const [promptEvent, setPromptEvent] = useState<any>(null)
  const [storeUrl, setStoreUrl] = useState<string>('')
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setPromptEvent(e) }
    window.addEventListener('beforeinstallprompt', handler)
    ;(async ()=>{
      try {
        const { supabase } = await import('../lib/supabase')
        const { data } = await supabase.from('system_settings').select('value').eq('key','app_download_url').maybeSingle()
        if (data?.value) setStoreUrl(data.value)
      } catch {}
    })()
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const onClick = async () => {
    if (promptEvent) { promptEvent.prompt(); const choice = await promptEvent.userChoice; if (choice.outcome !== 'accepted' && storeUrl) window.location.href = storeUrl }
    else if (storeUrl) window.location.href = storeUrl
  }

  return <button onClick={onClick} className="px-4 py-2 bg-pink-600 text-white rounded">Download App</button>
}

export default DownloadAppButton

