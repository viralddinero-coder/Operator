## Del 1: Stäng av e‑postbekräftelser (DEV)
1. Öppna webbläsaren och gå till Supabase (din projektpanel).
2. Klicka på `Authentication` i menyn.
3. Klicka på `Settings` uppe till höger.
4. Klicka på fliken `Email`.
5. Hitta valet `Confirm signup` och stäng av det (brytaren ska vara av). 
6. Klicka `Save`/`Spara`.

Resultat: Nu kan du skapa/logga in konton i utveckling utan att e‑post skickas eller blockeras.

## Del 2: Skapa en serverhjärna (Edge Function) som gör konton åt dig
Tanken: Klienten (adminpanelen) ber “servern” skapa kontot. Servern använder hemlig nyckel och har tillåtelse.

1. Installera Supabase CLI (om du inte har):
   - På Windows: öppna kommandotolk och skriv `npm i -g supabase`.
2. Logga in i CLI:
   - Skriv `supabase login` och klistra in din access token från Supabase konto.
3. Initiera functions (om inte redan):
   - Skriv `supabase init` i din projektmapp.
4. Skapa en ny funktion:
   - Skriv `supabase functions new createUser`.
5. Lägg hemliga nycklar (bara servern ser dem):
   - Hämta din `SUPABASE_URL` och `SUPABASE_SERVICE_ROLE_KEY` från Project Settings → API.
   - Skriv:
     - `supabase secrets set SUPABASE_URL=<din-url>`
     - `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`

## Del 3: Fyll i funktionen (enkel version)
1. Öppna filen för funktionen (den ligger i `supabase/functions/createUser/index.ts`).
2. Klistra in ungefär detta (superenkelt flöde):
```
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Use POST', { status: 405 })
  const body = await req.json()
  const { username, password, role } = body
  if (!username || !password || !['admin','operator'].includes(role)) {
    return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400 })
  }
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(url, key)
  const email = `${username}@affilyx.local`
  const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (createErr) return new Response(JSON.stringify({ error: createErr.message }), { status: 400 })
  const userId = (created as any)?.user?.id || (created as any)?.id
  const { error: insertErr } = await admin.from('users').insert({ id: userId, email, username, role, is_active: true, is_verified: false })
  if (insertErr) return new Response(JSON.stringify({ error: insertErr.message }), { status: 400 })
  if (role === 'admin') {
    await admin.from('system_settings').upsert({ key: `admin_permissions:${userId}`, value: { modules: ['dashboard','sajter','profiler','operatörer','användare','transaktioner','moderering','inställningar','mass message','myntpaket'] }, updated_at: new Date().toISOString() })
  }
  return new Response(JSON.stringify({ id: userId, email }), { status: 200 })
})
```
3. Spara filen.
4. Kör lokalt för test: `supabase functions serve createUser` (ger en lokal URL i terminalen).
5. Deploy till molnet: `supabase functions deploy createUser`.

## Del 4: Låt adminpanelen ringa till serverhjärnan
1. I adminpanelen, när du trycker “Skapa admin” eller “Lägg till operatör”, skicka ett POST‑anrop till funktionen:
```
fetch('https://<din-project-ref>.functions.supabase.co/createUser', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password, role })
})
```
2. Visa svaret i UI: om `{ id, email }` kommer tillbaka → uppdatera listan och visa “konto skapat”. Om `{ error }` → visa feltext.

## Del 5: Dating‑registrering (så det funkar nu och i framtiden)
- Utveckling (snabbt):
  - Använd `Del 1` (stäng av email confirmations). Registrering funkar direkt.
- Produktion (på riktigt):
  - Slå på email confirmations igen.
  - Lägg till mailprovider (SMTP eller Resend) under `Authentication → Settings → Email`.
  - Behåll serverfunktionen för admin/operatörskonton.

## Del 6: Testa steg för steg
1. Skapa Master Admin via adminpanelen anropet (eller direkt via funktionen med body `{ "username":"DustinAdmin", "password":"Hejhej123", "role":"admin" }`).
2. Logga in på `.../admin/login` med `DustinAdmin` (eller `DustinAdmin@affilyx.local`) och `Hejhej123`.
3. Skapa en operatör via knappen i admin och logga in på `.../operator/login`.
4. Registrera användare på dating (dev utan e‑postbekräftelse; prod med bekräftelse).

## Viktigt att komma ihåg
- Hemlig nyckel (Service Role) ska bara ligga i Edge Function/servern — aldrig i den vanliga webbkoden.
- Om du ser “User not allowed” betyder det att klienten försöker göra en admin‑sak. Flytta det till funktionen.
- Om du ser “email rate limit exceeded” i dev, är e‑postbekräftelser på — stäng av i dev.

## Klart?
Säg till när du vill att jag ska:
- Skapa function‑filen och koppla admin‑UI anropen.
- Ställa in secrets och deploya.
- Verifiera att inloggningar fungerar och att datingregistreringen flyter i din miljö.