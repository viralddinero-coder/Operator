import { createClient } from 'https://esm.sh/@supabase/supabase-js'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  const body = await req.json()
  const { username, password, role } = body || {}
  if (!username || !password || !['admin','operator','user'].includes(role)) {
    return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400 })
  }
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const email = `${username}@affilyx.local`
  const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (createErr) return new Response(JSON.stringify({ error: createErr.message }), { status: 400 })
  const userId = (created as any)?.user?.id || (created as any)?.id
  const { error: insertErr } = await admin.from('users').insert({ id: userId, email, username, role, is_active: true, is_verified: true })
  if (insertErr) return new Response(JSON.stringify({ error: insertErr.message }), { status: 400 })
  if (role === 'admin') {
    await admin.from('system_settings').upsert({ key: `admin_permissions:${userId}`, value: { modules: ['dashboard','sajter','profiler','operatörer','användare','transaktioner','moderering','inställningar','mass message','myntpaket'] }, updated_at: new Date().toISOString() })
  }
  return new Response(JSON.stringify({ id: userId, email }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

addEventListener('fetch', (event) => {
  event.respondWith(handler(event.request))
})
