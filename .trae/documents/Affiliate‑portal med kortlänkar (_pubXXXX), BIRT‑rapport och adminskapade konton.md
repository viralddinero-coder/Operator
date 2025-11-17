## Mål
- Skapa en separat affiliate‑portal (egen inloggning, ej admin/operatör) där varje affiliate ser endast sina egna siffror.
- Införa kortlänkar av typen `/pubXXXX` som är diskreta och enkla att dela, samt stöd för `?ref=KOD`.
- Ge SUPER ADMIN verktyg i adminpanelen för att:
  - Skapa affiliate‑konto (användarnamn = kortlänkskod, starkt lösenord genereras)
  - Skapa/hantera obegränsade aktiva/inaktiva länkkoder per affiliate
  - Se BIRT‑liknande (excel‑ark) rapport med månadsvis omsättning för varje affiliate
- All omsättning spåras i pengar, inte i coins.

## Länkar (exempel)
- Kortlänk (dev): `http://localhost:5173/pubfd9` ⇒ fångar koden `pubfd9`, sparar i cookie/localStorage och skickar vidare till startsida/registrering
- Parametrisk: `http://localhost:5173/register?ref=pubfd9`
- Affiliate‑portal:
  - Login: `http://localhost:5173/affiliate/login`
  - Dashboard: `http://localhost:5173/affiliate/dashboard`
- Admin Affiliate: `http://localhost:5173/admin/affiliates` (endast SUPER ADMIN)

## Datamodell
- `users` med ny roll: `affiliate` (för egen portalinloggning)
- `affiliates` kopplar `users(id)` till affiliate‑profil (kommissionssats, metadata)
- `affiliate_links` (obegränsat antal per affiliate): `code`, `site_id`, `is_active`
- `affiliate_referrals` (kundrelation): `affiliate_link_id`, `user_id`, `profile_name`
- `payments` (monetära köp): `user_id`, `amount_money` (decimal), `currency`, `provider`, `status`, `created_at`
- `affiliate_transactions` (agg för utbetalning): `affiliate_id`, `user_id`, `payment_id`, `amount_money`, `commission`
- RLS: affiliates ser endast sina rader; admin ser allt

## Trackingflöde
1. Besök via `/pubXXXX` eller `?ref=XXXX` ⇒ spara `ref` och redirect
2. Registrering: läs `ref` ⇒ skapa referral (koppla kund till affiliate)
3. Köp: när betalning markeras "success" ⇒ skapa `affiliate_transactions` med belopp i pengar och kommission baserat på affiliate‑inställning
4. Alla fortsatta köp hamnar under samma affiliate (via referral)

## Admin: Affiliates‑sektion
- Skapa affiliate‑konto (anv: `pubfd9`, lösen: genereras starkt)
- Skapa länkar (obegränsat), toggla `is_active`
- BIRT‑rapport (excel‑style grid):
  - Kolumner: Månad (ex: 2025‑11), Omsättning USD/SEK, Antal kunder, Senaste köp
  - Per affiliate + totalsumma, exportera CSV

## Affiliate‑portal (separat från admin/operatör)
- Login för roll `affiliate`
- Dashboard:
  - Totalsumma omsättning
  - Månadsvis tabell (likt excel‑ark) med summeringar
  - Kundlista (referrals) med total omsättning/köpdatum
  - Länkar: skapa/aktivera/inaktivera egna koder

## UI/UX
- Kortlänkar `/pubXXXX` ger diskret url
- BIRT‑liknande tabell med stickad grid, summeringsrad, kolumnsortering, CSV‑exportknapp

## Operatörsappen – genomkörare (efter affiliates klart)
- Säker navigation i sidomenyn (NavLink)
- Standardiserad felhantering/toasts
- Verifiera och fixa lås/send/profilknappar

## Leverabler
- Nya tabeller och roll/RLS
- Admin‑sektion med skapande av konton, länkar och BIRT‑rapport
- Affiliate‑portal med login + dashboard
- Kortlänkar `/pubXXXX` integrerade i tracking

Bekräfta så implementerar jag allt direkt och skickar live‑länkar för att kika på stats i både admin och affiliate‑portalen.