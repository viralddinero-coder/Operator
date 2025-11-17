## Målsättning
- Stabil produktion med separata e‑postidentiteter per datingsajt.
- Säker kontohantering (admin/operatör/användare) via server/Edge Functions.
- Multi‑tenant konfiguration (branding, mail, templates, bakgrunder) per sajt.

## Arkitektur i produktion
- Backend: Supabase (DB + Auth + Edge Functions) + valfri Node/WS för chat‑presence.
- Frontend: deploy (Vercel/Netlify) med miljövariabler för Supabase (URL/Anon key).
- Serverfunktioner:
  - `createUser` & `updatePassword` (Service Role) – konton skapas/hanteras via adminpanelen.
  - `sendMail` – central mailfunktion som läser sajtens `smtp_config` och `mail_settings`.
  - `massMessage` – schemalagd utskickare med kontrollerad takt.
- Multi‑tenant: använd `sites` + `system_settings` nycklar:
  - `site:<siteId>:smtp_config` → { host, port, secure, username, password, from_name, from_email }
  - `site:<siteId>:mail_settings` → toggles (welcomes, reset, receipts, offline)
  - `site:<siteId>:mail_templates` → per sajt (erbjudanden/kvittomallar)
  - `site:<siteId>:branding` → färger, loggor, bakgrund.

## E‑post per sajt (krav)
- Provider: Resend eller SendGrid (rekommenderat) + domänverifiering per sajt.
- För varje datingsajt:
  1) Verifiera domän (SPF/DKIM/CNAME) i mail‑providern.
  2) Lägg `from_email` som matchar sajten (ex: `noreply@datingA.com`, `support@datingB.com`).
  3) Spara credentials i `site:<id>:smtp_config`.
- `sendMail` (Edge Function):
  - Tar `siteId`, `templateKey`, `to`, `data`.
  - Hämtar `smtp_config` och `mail_templates` för sajt.
  - Skickar med rätt `from_name`/`from_email`; loggar till `mail_logs`.

## Registrering & inloggning
- Klient (dating): `auth.signUp` och `auth.signInWithPassword`.
- Prod: slå på "Confirm email" och ha fungerande mailprovider (Resend/SendGrid) per domän.
- Dev: email confirmations av (som du gjort) + testmail via logg.

## Mass Message & Notiser
- Edge Function `massMessage` + Supabase Schedule (cron):
  - Hämtar nästa batch för sajt, skickar X/minut via `sendMail`/in‑app meddelanden.
  - Loggar progress i DB.

## Chat/Online
- WebSocket (Node `ws`) för presence/typing/read receipts.
- UI kopplar efter login; server kan validera tokens via Supabase JWT.

## Säkerhet/RLS
- RLS policy för `users`, `profiles`, `likes`, `albums` – self‑insert/select/update för användare.
- Adminrollen kan läsa/skriva allt via Edge Functions (Service Role).
- Secrets aldrig i klient; endast i Edge Functions/server.

## CI/CD & miljöer
- Frontend: PR‑previews + prod deployment; miljövariabler per miljö.
- Supabase: migrations för tabeller/policies; Edge Functions deploy.
- Per sajt: `system_settings` och `sites` styr allt; inga kodändringar krävs vid nya sajter.

## Checklista inför live
1) Verifiera domäner i mail‑provider (SPF/DKIM ok) för alla datingsajter.
2) Fyll `site:<id>:smtp_config` och `site:<id>:mail_templates` i `system_settings`.
3) Deploya Edge Functions (`createUser`, `updatePassword`, `sendMail`, `massMessage`) och sätt secrets.
4) Slå på "Confirm email" för produktion.
5) Kör DB‑migreringar + RLS policies.
6) Röktest: registrering, login, reset, kvitto, offline‑mail per sajt.

## Support & felsök
- Dashboard/`mail_logs` visar skickstatus; filtrera per sajt.
- Edge Functions returnerar tydliga fel (rate limit, invalid email, template missing).

## Tidslinje
- Dag 1: mail‑provider domäner + `sendMail`/secrets + adminkonton via `createUser`.
- Dag 2: templates per sajt + cron för `massMessage` + ws‑presence.
- Dag 3: full röktest per sajt + rollout.

Bekräfta så går jag vidare med `sendMail`‑funktionen och per‑sajt smtp/templates kopplingen, och gör UI‑delen i admin för att redigera allt per sajt.