## Mål och Omfattning
- Gå igenom hela projektet (React/Tailwind/Vite + Supabase) för att eliminera snurr/låsningar, roll- och RLS-problem och felplacerad logik.
- Säkerställa att admin/operatör/dating-flöden fungerar från inloggning till datahämtning och att multi‑tenant‑inställningar per sajt är konsekventa.

## Kritisk blockerare: Admin visar “Fel panel (role=user)”
- Verifiera session UID vs app‑data:
 1) I webbläsaren efter inloggning: kontrollera `session.user.id` (Network/Console) och jämför med raden i `public.users`.
 2) Säkerställ att det inte finns dubbletter för samma e‑post med annan `id`; om så är fallet: ta bort/flytta den felaktiga.
- Frontend rollkällor:
 1) Spåra var rollen läses: initialt från `public.users` (store), ev. fallback till `user` vid tomt svar eller 403.
 2) Granska `ProtectedRoute` — bekräfta att den baserar kontroll på korrekt store och inte defaultar till `user` vid RLS‑fel.
- RLS‑validering:
 1) Bekräfta policies för `users`/`system_settings` och att admin har SELECT/UPDATE.
 2) Kolla att klientanrop till `system_settings` inte får 401/403 direkt efter inloggning.
- Åtgärd vid mismatch:
 1) Om `session.user.id` ≠ raden appen läser: korrigera queries eller appens selektor.
 2) Om SELECT blockeras: justera RLS eller säkerställ `user_roles` har `admin` för aktuellt UID.

## Frontend‑granskning
- Router/Guarding:
 - Kartlägg rutter (admin/operator/dating). Granska `ProtectedRoute` för: korrekt redirect vid ej inloggad/fel roll; ta bort eviga vänteloopar.
- LoginPage:
 - Säkerställa try/catch/finally runt auth, tydlig feltext för `invalid_grant`, `email_not_confirmed` och RLS‑fel; max‑timeout med diagnos.
- Laddning/Spinner:
 - Visa spinner endast under aktiva anrop; fallback till fel/diagnos om svar dröjer.
- CSP och bakgrund:
 - Dev‑CSP meta (tillåt HMR/Functions); undvik externa bilder som triggar ORB; använd lokal/solid dev‑bakgrund.
- Komponenter/hooks:
 - Sök efter “Invalid hook call” risker (hooks utanför komponenter, dubbla imports efter export); verifiera tidigare fix.
- i18n/strings:
 - Kontrollera att overrides läses säkert från `system_settings` och att UI inte brakar på 403.
- Chat/Operator:
 - Närvaro/scroll; filuppladdning via `mediaService`; bildsanitering; lås/knappar; höjder/overflow.

## Backend‑granskning (Supabase)
- Schema:
 - Bekräfta tabeller: `users`, `user_roles`, `profiles (is_operator_profile)`, `system_settings`, `likes`, `profile_albums`, `album_photos`, `mass_messages`.
- RLS‑policies:
 - Lista och läsbarhet: `users` (self + admin_all), `profiles` (self + admin_all), `system_settings` (admin‑only), övriga (likes/albums/mass_messages) enligt funktionella behov.
- Index/Constraints:
 - Index på `user_roles.user_id`; PK/UK på `users.id`, `system_settings.key`; FK på `profiles.user_id`.
- Edge Functions:
 - `createUser`, `updatePassword` (Service Role) — bekräfta secrets och endpoints; `sendMail` (per‑sajt smtp); schemalagd `massMessage`.
- Multi‑tenant:
 - Per‑sajt nycklar i `system_settings`: `site:<id>:branding/templates/strings/smtp_config/mail_settings`; `sites` tabell; domän‑detektion.

## Säkerhet
- Hemligheter endast i server/Functions; aldrig i klient.
- RLS‑täthet på känsliga tabeller; admin via Service Role.
- Bildsanitering; CSP i prod utan `unsafe-eval/inline`.
- Rate‑limit i Functions (send/massMessage); audit loggar (`mail_logs`).

## Observability och Test
- `/health` för Supabase‑status: env nycklar, enklaste SELECT mot `system_settings`, rollindikator.
- RLS‑test (du har skriptet klart): kör mot `system_settings`; utöka vid behov till andra tabeller.
- Manuell flödestest: admin → dashboard; operatör → chat; dating → registrering/profil; multi‑site → per‑domän.

## Genomförande (faser)
- Fas 1: Diagnos admin‑mismatch (UID/roll/RLS) + frontend felhantering (spinner/redirect/feltext).
- Fas 2: Konsolidera RLS/policies och index; validera alla tabeller; stabilisera Functions.
- Fas 3: Multi‑tenant UI (Templates/Customize), per‑sajt mail (`sendMail`), schemaläggning (`massMessage`).
- Fas 4: Hård test + dokumenterad checklista inför live.

## Leverabler
- Rapport med hittade problem + åtgärder.
- Uppdaterade guard/felexponeringar i UI (ingen evig snurr).
- Verifierade RLS och rollflöden; RLS‑tests logg.
- Admin “New Site Wizard” och per‑sajt mailfunktion körbar.

När du bekräftar kör jag Fas 1 direkt (utan att stressa), följer upp med verifiering och därefter nästa faser tills allt är grönt.