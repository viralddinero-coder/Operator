## Mål
- Lägg till mailinställningar per domän/sajt (SMTP/APIs, avsändare, mallar, regler).
- Gör admin‑UI där man väljer sajt och sparar mailinställningar separat.
- Koppla registrering, glömt lösenord, kvitto och offline‑notiser till sajtens egna inställningar.
- Etablera ett uppdateringsflöde efter deploy (CI/CD + feature toggles) som gör det enkelt för dig att rulla ut nya funktioner.

## Nuvarande läge
- SystemSettings har globala toggles för mail (aktivera, kvitto, offline m.m.).
- Ingen per‑sajt mailkonfiguration (SMTP/avsändare).
- Skicka‑mail‑delen är inte kopplad till en riktig provider ännu (testfunktion simulerar ok).

## Databas & Konfiguration
- system_settings nycklar per sajt:
  - `site:<siteId>:mail_settings` (enable/disable per typ, offlineThresholdMin).
  - `site:<siteId>:smtp_config` (host, port, secure, username, password/API, from_name, from_email).
  - (valfritt) `site:<siteId>:mail_templates` eller kolumn `site_id` på `message_templates` för att filtrera mallar per sajt.
- Loggtabell: `mail_logs` (site_id, to, template, status, error) för felsökning.
- RLS: admin‑policy på `system_settings` entries som börjar med `site:<id>:` (endast admin kan läsa/skriva); maska `password` i UI.

## Admin‑UI
- SystemSettings → "Mail & Notiser":
  - Dropdown: välj sajt; laddar och sparar till `site:<id>:mail_settings`.
  - SMTP‑sektion: formulär för `smtp_config` per sajt + "Testa anslutning".
  - Mallar: filtrera `message_templates` per sajt och skapa/uppdatera mallar (registrering, glömt, kvitto, offline‑ping).
- "Sajter" behåller skapas/radera; mailinställningar redigeras i SystemSettings per sajt.

## Tjänster & Leverans
- Ny `mailService`:
  - `getMailConfigByDomain(domain)` → hittar site, hämtar `smtp_config` och `mail_settings`.
  - `send(templateKey, to, data, siteId)` → anropar server‑funktion.
- Supabase Edge Function `sendMail`:
  - Tar emot siteId, template, to, data; läser säkert `smtp_config`/provider API; skickar via Resend/SendGrid/SMTP.
  - Loggar till `mail_logs`.
- Integrationspunkter:
  - RegisterPage: skicka välkomstmail när `site:<id>:mail_settings.activateMail` är true.
  - Login/Forgot: skicka reset‑mail.
  - PurchaseCoins: kvitto.
  - Offline‑notiser: cron/edge function process som skickar enligt threshold.

## Säkerhet
- Admin‑only RLS för `site:<id>:smtp_config`.
- Visa aldrig lösenord i klartext; endast uppdatera fältet med "••••" om oförändrat.
- Sanera input; rate‑limit i edge function.

## Deploy & Uppdateringsflöde
- GitHub + CI/CD (Vercel/Netlify för frontend, Supabase för backend):
  - "Staging" miljö: feature test innan produktion.
  - Migrations: lägg SQL under `supabase/migrations/*` och kör automatiskt i CI.
  - Feature toggles: lägg allt som går i `system_settings` (per sajt) för att kunna slå av/på utan redeploy.
  - Preview deployments: varje PR ger en länk; du godkänner innan merge.
  - Release checklista: migrations, env‑vars, smoke‑tests, rollback‑plan.

## Validering
- Testknapp "Skicka test" i SystemSettings per sajt.
- E2E: registrering/forgot/purchase i staging med sajt‑specifik mail.
- Admin "mail_logs" vy med filter per sajt/period/status.

## Faser
1. Datamodell & RLS (system_settings nycklar, mail_logs, ev. templates per sajt).
2. Admin‑UI per sajt (dropdown, SMTP‑form, toggles, testknapp).
3. mailService + Edge Function `sendMail` (Resend/SendGrid/SMTP).
4. Integrera i registrering/forgot/kvitto/offline.
5. CI/CD setup + dokumenterad releaseprocess.

## Tidslinje
- 1–2 dagar för basfunktion (UI + per‑sajt lagring + edge function + integration i registrering/forgot/kvitto).
- +1 dag för offline‑notiser och loggvyer.

## Risker & Mitigering
- Provider‑begränsningar: använd API (Resend/SendGrid) istället för ren SMTP om möjligt.
- Sekretess: lägg känsliga värden bakom admin‑RLS; överväg KMS/edge‑secrets om kravet ökar.
- Leverans: ha staging och rollback‑plan.

Bekräfta gärna att vi kör detta upplägg, så implementerar jag det direkt.