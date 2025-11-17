## Steg 1: Skapa användare i Supabase Auth
1. Öppna Supabase → Authentication → Users.
2. Klicka `Add user`.
3. Fyll:
   - Email: `datingtest@affilyx.local`
   - Password: `hejhej123`
   - Kryssa i `Email confirmed` (om knappen finns), eller ha e‑postbekräftelser avstängda i dev.
4. Klicka `Create`.
5. Kopiera `UID` från raden för `datingtest@affilyx.local` (OBS: använd den nya UID:en för datingkontot, inte admin UID).

## Steg 2: Koppla till appens users‑tabell
1. Gå till Supabase → `SQL`.
2. Kör (byt `NEW_UID_HERE` till den nya UID du kopierade):
```
insert into public.users (id, email, role, is_verified, is_active, username)
values ('NEW_UID_HERE', 'datingtest@affilyx.local', 'user', true, true, 'datingtest')
on conflict (id) do update set role='user', is_verified=true, is_active=true, username='datingtest';
```

## Steg 3 (valfritt): Lägg minimal profilrad
Om din app visar profil direkt:
```
insert into public.profiles (user_id, name, is_operator_profile, created_at)
values ('NEW_UID_HERE', 'datingtest', false, now())
on conflict (user_id) do nothing;
```
(Om din `profiles` tabell har fler obligatoriska fält, fyll dem enligt schema.)

## Steg 4: Testa inloggning i appen
1. Öppna `http://localhost:3000/login`.
2. Skriv `datingtest@affilyx.local` eller `datingtest`.
3. Skriv lösenordet `hejhej123`.
4. Tryck `Login`.

## Tips vid fel
- “Invalid login credentials”: kontrollera att Auth‑kontot verkligen finns och att lösenordet är `hejhej123`. Prova ändra password i Auth UI.
- “Email rate limit exceeded”: stäng av e‑postbekräftelser i Supabase → Authentication → Settings → Email → `Confirm signup` OFF (dev).

Vill du att jag automatiserar detta via en serverfunktion, så att adminpanelen kan skapa datingkonton utan att du behöver köra SQL manuellt? Jag kan koppla en Edge Function direkt efter ditt OK.