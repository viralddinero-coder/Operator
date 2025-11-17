## Problem
- Sidomenyn i adminpanelen länkar till routes som inte finns, därför händer inget.
- Snabbstatistiken i sidomenyn visar hårdkodad mockdata.
- Top‑innehållet i adminpanelen visar delvis mockdata.

## Åtgärdsplan (en sak i taget, fokuserat på admin‑sidomenyn och data)

### 1) Routingstruktur för admin
- Skapa riktiga under‑routes under `/admin`: `/admin/dashboard`, `/admin/sites`, `/admin/operators`, `/admin/users`, `/admin/transactions`, `/admin/moderation`, `/admin/settings`, `/admin/chat-monitoring`.
- Uppdatera `AdminLayout` så att `Outlet` visar aktuell undersida.
- Länka sidomenyn till dessa routes.

### 2) Sidomenyn: navigering + statistik
- Byt från `<a href>` till `NavLink` (react-router) för korrekt client‑side navigation och aktivt menyval.
- Ta bort hårdkodade siffror (3, 8, 1,247). Hämta realtidsvärden från Supabase:
  - Aktiva sajter: `sites` där `is_active=true`
  - Operatörer: `users` där `role='operator'`
  - Användare: `users` (alla aktiva)
- Visa laddningsindikator kort, och fallback "–" om data saknas.

### 3) Admin‑sidor (minimalt fungerande innehåll, utan mock)
- Dashboard: Använd redan införd logik för Supabase‑data (aktiva sajter, operatörer, användare, dagens coins). Rensa kvarvarande hårdkod.
- Sites: Lista `sites`, visa status, enkel aktivera/inaktivera, lägg till ny via enkel form som skriver till `sites`.
- Operators: Lista `users` med `role='operator'`, enklare formulär för att skapa ny operatör (`users` + ev. koppling till `operator_assignments`).
- Users: Lista `users` (pagination enkel), sök via e‑post, flagga `is_active`/`is_verified`.
- Transactions: Lista `coin_transactions`, total summering över valbar period (idag/alla), och totalsumma deposits (positiva belopp).
- Moderering: Återanvänd befintlig `PhotoModeration` utan mock, mot väntande bilder.
- Settings: Använd `SystemSettings` (tabell `system_settings`) för centrala nycklar (min_age, default_site, affiliate_commission).
- Chat‑övervakning: Visa senaste konversationer och meddelanden (finns), få in route och meny.

### 4) QA och verifiering
- Klicka alla menyval i sidomenyn och verifiera att rätt undersida renderas.
- Bekräfta att inga hårdkodade siffror återstår; alla visningar kommer från Supabase.
- Säkerställ att dashboard och moderering fungerar utan errors.

### Leverabler
- Uppdaterad `AdminSidebar` (NavLink + verklig statistik)
- Uppdaterad router med admin‑under‑routes och `Outlet`
- Enkla, fungerande admin‑undersidor för Sites/Operators/Users/Transactions/Settings (utan mock)
- QA‑genomgång (snabb) för att bekräfta klickbarhet och dataflöden

Bekräfta så utför jag dessa steg direkt och levererar en fungerande admin‑sidomeny med riktiga data.