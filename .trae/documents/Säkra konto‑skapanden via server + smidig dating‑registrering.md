## Översikt
- Skapa (admin/operator) via en liten serverfunktion som använder Supabase Service Role. Klienten (admin‑panelen) anropar servern.
- Dating‑registrering fortsätter via Supabase klient utan e‑postkrav i dev, alternativt med e‑post/OTP i prod.

## Alternativ för server
1) Supabase Edge Function (rekommenderas)
- Placering: `supabase/functions/createUser` (Deno). 
- Endpoint: `POST /createUser` med body: `{ username, password, role }`.
- Logic: 
  - Validera body.
  - Generera intern e‑post: `${username}@affilyx.local`.
  - `auth.admin.createUser({ email, password, email_confirm:true })` (Service Role).
  - Insert i `users` med `role` och `username`.
  - Vid `role==='admin'`, skriv `system_settings['admin_permissions:<id>']` med fulla moduler.
  - Returnera `{ id, email }`.
- Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` inlagda i serverns miljö (inte i klienten).
- Klient: adminpanelens “Skapa admin/operatör” anropar denna endpoint med fetch.

2) Alternativ: Minimal Express/Vercel/Netlify function
- Samma logik som ovan. Deployas där du vill. Hemlig nyckel i serverns env.

## Klientändring (admin)
- “Skapa admin” och “Lägg till operatör” skickar `username/password/role` till servern.
- Visa resultat och uppdatera listor. 
- Ta bort direktanrop av `auth.admin` från browser.

## Dating‑registrering
- Dev: stäng av “Email confirmations” i Supabase Auth Settings så att `auth.signUp` fungerar direkt.
- Prod: 
  - aktivera e‑postbekräftelse och koppla mailprovider
  - eller välj OTP (t.ex. sms) som primär verifiering.
- Köpfunktion/coins kan vara aktiv även utan verifiering, om er policy tillåter.

## Säkerhet
- Service Role nyckeln endast på serversidan. Ingen exponering i klient.
- Input‑validering (min 6 tecken, whitelist roller: admin/operator).
- Rate‑limit och auditlogg.

## Felhantering
- Returnera tydliga fel: `user_exists`, `weak_password`, `invalid_role`.
- Klienten visar notis och inget bryts.

## Milsteg
1) Skapa och deploya Edge Function `/createUser` med Service Role.
2) Uppdatera admin‑UI att anropa serverfunktionen.
3) Stäng av email confirmations i dev; verifiera datingregistrering.
4) (Prod) koppla mailprovider och slå på confirmations.

## Tidslinje
- Dag 1: Edge Function + klientanrop (admin/operator). 
- Dag 1–2: Konfig för dating‑registrering och test.

Bekräfta så implementerar jag serverfunktionen och kopplar UI till den, samt ställer klienten för smidig dating‑registrering i dev och produktionsbest practice.