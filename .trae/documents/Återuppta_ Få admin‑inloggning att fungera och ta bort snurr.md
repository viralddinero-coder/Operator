## Mål
- Logga in i adminpanelen utan evig laddning.
- Säkerställa att kontot har rätt admin‑roll och att RLS inte blockerar läsning av nödvändiga tabeller.

## Snabbcheck (ingen kod)
- Bekräfta att du loggar in med kontot som är kopplat till admin:
  - public.users: raden för ditt UID har `role='admin'` och `username='DustinAdmin'`.
  - public.user_roles: en rad med `user_id=<UID>`, `role='admin'`, `scope='global'` finns.
- I Supabase Auth → Users: sätt ett nytt säkert lösenord och markera email confirmed.
- Rensa lokal lagring (Application → Clear storage) och ladda om sidan.

## Diagnostik i webbläsare
- DevTools → Network:
  - `auth/v1/token?grant_type=password` ska ge 200.
  - Efter login: `rest/v1/system_settings`/`rest/v1/users` ska ge 200 (ej 401/403). Om 401/403 → roll/RLS saknas.
- DevTools → Console: kontrollera meddelanden om “permission denied/forbidden/row level security”.

## Åtgärder jag gör efter ditt OK
1) Frontend felhantering (Login/ProtectedRoute):
- Säkerställa att loading alltid släpper vid fel och visar tydlig orsak (“fel panel/roll” eller “behörighet saknas”).
- Role‑mismatch → omdirigera till rätt login/startsida direkt.
2) Admin konto‑hjälp:
- Scripts/SQL (icke‑destruktivt) för att säkerställa `public.users` + `user_roles` överensstämmer med admin.
3) Health‑ruta `/health` (enkel):
- Visar Supabase URL/nycklar närvarande, test mot `rest/v1`, och om admin‑roll hittas; hjälper felsökning när snurr uppstår.

## Klart indikator
- Admin login går in på dashboard utan snurr.
- Operatör och dating fungerar likadant (rollkontroll + tydlig felvisning).

Bekräfta så kör jag dessa steg (ingen databasskrivning utan ditt godkännande; frontend justeras för robust handling).