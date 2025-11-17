## Mål
- Ge affiliates egen inloggning och panel där de ser enbart sin statistik.
- Införa robust spårning med "custom links" (ref‑koder) som kopplar kunder till en affiliate både vid registrering och framtida köp.
- Visa omsättning (pengar) per kund/affiliate, inte antal coins.
- Snabb genomkörning av operatörsappen för trasiga knappar/navigering.

## Hur en affiliate‑länk ser ut
- Produktion: `https://mynteri.com/?ref=ANNA42`
- Registreringsdirekt: `https://mynteri.com/register?ref=ANNA42`
- Dev: `http://localhost:5173/?ref=ANNA42`
- Kod `ANNA42` är en rad i `affiliate_links(code)` kopplad till en affiliate.
- När besökaren kommer in med `?ref=...`, sparas koden i t.ex. cookie/localStorage och knyts vid registrering till användaren. Alla framtida köp hos användaren kopplas till affiliate.

## Datamodell (RLS‑säker)
- `affiliates`: affiliate‑konto, kopplad till `users(id)` med rollen `affiliate`.
- `affiliate_links`: flera spårningskoder per affiliate (fält: `code`, `site_id`, `is_active`).
- `affiliate_referrals`: rad per kund (user_id) med vilken länk som skapade relationen.
- `payments`: ny tabell för monetära köp (pengar), fält: `id`, `user_id`, `amount_money`, `currency`, `provider`, `status`, `created_at`.
- `affiliate_transactions`: skrivs vid varje `payments` "successful" av kund med affiliate‑koppling: fält: `affiliate_id`, `user_id`, `payment_id`, `amount_money`, `commission`.
- RLS: affiliates ser bara sina `links`, `referrals` och summeringar; admin ser allt.

## Registrering & köpflöde
- Registrering: läs `ref` från URL/cookie → hitta `affiliate_links.code` → skapa `affiliate_referrals` för registrerad `user_id`.
- Köp: när en betalning slutförs, kolla om `user_id` finns i `affiliate_referrals` → skriv `affiliate_transactions` med belopp i pengar och kommission.

## Affiliate‑portal (egna sidor)
- Inloggning: roll `affiliate` via Supabase Auth.
- Sidor:
  - `Dashboard`: total omsättning, antal kunder, senaste köp.
  - `Links`: skapa egna spårningslänkar (kod), aktivera/inaktivera.
  - `Customers`: lista referrals (kundlista) med total omsättning per kund.
  - `Payments`: tabell med köp (belopp, valuta, datum).
- Allt filtrerat per affiliate (RLS).

## Adminvy för affiliates
- `Admin > Affiliates`: lista affiliates, per‑affiliate detalj: länkar, kundlista, total omsättning, senaste köp.
- Export/rapport för löneutbetalning (CSV).

## Operator‑appen: genomkörning
- Byt all sidomeny‑navigering till `NavLink` (client‑side), ta bort mockvärden.
- Säkerställ att knapparna för lås, send, profiler och statistik fungerar under olika states; standardisera felhantering/toasts.
- Lägg till operatörsstatistik: skickade/mottagna/aktiva chattar via Supabase.

## QA & verifiering
- E2E flöde: besök `?ref=KOD` → registrera → gör köp → se i affiliate‑portal & i admin totalsummor.
- Operatör: klickbar nav, chattbeteende (pling, bubblor, lås) validerat.

## Leverabel
- Nya tabeller, triggers och API‑funktioner för affiliate‑tracking.
- Egen affiliate‑portal med inloggning och panel.
- Adminvy med per‑affiliate detaljer.
- Justerad operatörsapp med fungerande knappar och statistik.

Bekräfta så implementerar jag detta direkt (inkl. betalnings‑pengar‑spårning, affiliate‑portal och operatörsgenomgång).