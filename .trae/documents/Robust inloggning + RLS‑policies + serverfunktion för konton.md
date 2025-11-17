## Mål
- Fixa LoginPage felhantering (alltid stänga av loading, visa tydliga fel, roll‑styrd navigation).
- Lägga RLS‑policies så vanliga användare kan skapa/läsa/uppdatera sin egen rad i `users` (och `profiles` vid behov) utan RLS‑fel.
- Koppla admin/operatörsskapande till en serverfunktion (Edge Function) med Service Role, så UI kan skapa konton utan e‑postgränser.

## Ändringar i appen
- LoginPage.tsx
  - Lägg `try/catch/finally` runt auth.
  - Visa felkoder: `invalid_grant`, `email_not_confirmed`, nätverksfel.
  - Fallback: när identifier inte är e‑post → slå upp e‑post, annars använd `${identifier}@affilyx.local`.
  - På framgång: hämta `public.users`, sätt store och navigera (`/admin`, `/operator`, `/home`).
- ProtectedRoute.tsx
  - Garantiera att endast korrekt roll släpps in; annars redirect.
- Admin/Operatör skapande i UI
  - Anropa serverfunktionen `POST /createUser` med `{ username, password, role }` i stället för klient‑admin API.
  - Visa resultat och uppdatera listor.

## RLS‑policies (SQL att köra i Supabase)
- `users`:
  - INSERT (egen rad): `CREATE POLICY users_self_insert ON public.users FOR INSERT TO authenticated WITH CHECK (id = auth.uid() AND role = 'user');`
  - SELECT (egen rad): `CREATE POLICY users_self_select ON public.users FOR SELECT TO authenticated USING (id = auth.uid());`
  - UPDATE (egen rad): `CREATE POLICY users_self_update ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());`
  - (Valfritt) DEFAULT: `ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'user';`
- `profiles` (om profil skapas vid registrering):
  - INSERT: `CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND (is_operator_profile IS NULL OR is_operator_profile = false));`
  - SELECT/UPDATE: motsvarande self‑select/self‑update.

## Serverfunktion (Edge Function)
- Plats: `supabase/functions/createUser`.
- Miljö: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` som secrets.
- Logik: validera input, generera intern e‑post, `auth.admin.createUser({ email_confirm:true })`, insert i `public.users` med roll & username. Om admin: skriv `admin_permissions:<uid>`.
- Klientanrop: adminpanelen `fetch('/createUser', { method:'POST', body: JSON.stringify({ username, password, role }) })`.

## Validering
- Testa loginflöde (admin, operatör, dating) och kontrollera att knappen lämnar "Loggar in..." vid fel.
- Testa registrering på dating: ingen RLS‑krasch, rad skapas/uppdateras.
- Testa kontoskapande via UI mot Edge Function.

## Tidsplan
- Steg 1: LoginPage/ProtectedRoute felhantering.
- Steg 2: RLS‑policies.
- Steg 3: Edge Function + UI‑koppling.

Bekräfta så implementerar jag direkt och levererar ändringarna med tydliga testa‑steg.