## Stäng av e‑postbekräftelser (Dev)
1. Öppna Supabase → Authentication.
2. Klicka `Sign In / Providers` i vänstermenyn.
3. Klicka `Email` (provider‑kortet).
4. Stäng av `Confirm email` (brytaren till OFF).
5. Spara.

Tips: Om din UI har fliken `Policies`, leta efter `Email confirmations` och stäng av där. Målet: ingen e‑post behövs i dev.

## Minska e‑post‑rate‑limit problem (snabbt)
1. I samma `Email`‑inställning, stäng av allt som triggar utskick (bekräftelse vid signup/ändring).
2. Under `Rate Limits`, låt standard stå – det räcker när bekräftelser är av.

## Skapa Admin direkt i Supabase UI
1. Gå till `Authentication` → `Users`.
2. Klicka `Add user` (uppe till höger).
3. Fyll:
   - `Email`: `DustinAdmin@affilyx.local` (eller din riktiga e‑post)
   - `Password`: `Hejhej123`
   - Kryssa i `Email confirmed` om den finns.
4. Klicka `Create`.

## Koppla admin till appens `users`‑tabell
1. Kopiera `UID` för användaren du nyss skapade (kolumnen `UID`).
2. Öppna `Table Editor` eller `SQL` i Supabase.
3. Kör detta SQL (byt `YOUR_UID_HERE` till ditt UID):
```
insert into public.users (id, email, role, is_verified, is_active)
values ('YOUR_UID_HERE', 'DustinAdmin@affilyx.local', 'admin', true, true)
on conflict (id) do update set role='admin', is_verified=true, is_active=true;
```
4. (Valfritt) sätt användarnamn i appens tabell:
```
update public.users set username='DustinAdmin' where id='YOUR_UID_HERE';
```
5. (Valfritt) ge fulla admin‑moduler:
```
insert into public.system_settings (key, value, updated_at)
values ('admin_permissions:YOUR_UID_HERE', '{"modules":["dashboard","sajter","profiler","operatörer","användare","transaktioner","moderering","inställningar","mass message","myntpaket"]}', now())
on conflict (key) do update set value=excluded.value, updated_at=excluded.updated_at;
```

## Skapa Operatör direkt i Supabase UI
1. Gå till `Authentication` → `Users` → `Add user`.
2. `Email`: `CS1@affilyx.local` (exempel)
3. `Password`: valfritt starkt.
4. Skapa.
5. Kopiera UID och kör SQL:
```
insert into public.users (id, email, role, is_verified, is_active, username)
values ('OPER_UID', 'CS1@affilyx.local', 'operator', true, true, 'CS1')
on conflict (id) do update set role='operator', is_verified=true, is_active=true, username='CS1';
```

## Testa inloggningar
- Admin: gå till `/admin/login` → skriv `DustinAdmin` eller `DustinAdmin@affilyx.local`, lösen `Hejhej123`.
- Operatör: gå till `/operator/login` → skriv användarnamn eller e‑post + ditt lösenord.

## Dating‑registrering (Dev & Prod)
- Dev: med `Confirm email` OFF kan användare registrera sig direkt.
- Prod: slå på `Confirm email` igen och lägg till mailprovider i `Sign In / Providers → Email` (SMTP/Resend). Då skickas riktiga bekräftelser.

## Varför detta funkar
- I dev slipper du e‑post och rate‑limits.
- I prod sköts allt korrekt via e‑post/OTP.

Säg till när du vill att jag ska koppla adminpanelen till en Edge Function för kontoskapande (server‑baserat) så slipper du göra UI‑stegen manuellt framöver.