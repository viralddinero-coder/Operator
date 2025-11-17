import { createClient } from 'https://esm.sh/@supabase/supabase-js'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  const body = await req.json()
  const { userId, password } = body || {}
  if (!userId || !password || password.length < 6) {
    return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400 })
  }
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { error } = await admin.auth.admin.updateUserById(userId, { password })
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

addEventListener('fetch', (event) => {
  event.respondWith(handler(event.request))
})
