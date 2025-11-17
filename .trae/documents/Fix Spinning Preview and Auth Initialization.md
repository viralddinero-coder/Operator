## Målsättning
- Stoppa evig spinner, visa tydliga fel (auth/RLS/anslutning) tills allt fungerar.
- När flöden är stabila: återinföra spinner/skeleton med tydlig, begränsad laddtid.

## Förändringar
1) LoginPage (robust felhantering)
- Wrappa auth i try/catch/finally så `setIsLoading(false)` alltid körs.
- Visa fel: `invalid_grant`, `email_not_confirmed`, RLS/401/403, nätverksfel.
- Timeout‑vakt (t.ex. 8s): om inget svar → visa diagnos och länk till Health.

2) ProtectedRoute (undvik vänteloop)
- Ingen dev‑bypass; om ej inloggad → redirect till respektive login.
- Fel roll → redirect till `/`.

3) Dev‑CSP & bakgrund
- Meta CSP för dev som tillåter HMR (`unsafe-eval`) och Supabase/Functions connect.
- Lokal/solid bakgrund i login (ingen extern bild) för att undvika ORB‑stopp.

4) Health‑sida `/health`
- Visar: env nycklar närvarande, Supabase URL, test mot `rest/v1` (OK/fel), RLS check (kan läsa egen user‑rad?).
- Snabb åtgärdslista när något fallerar.

## Återinför spinner (när stabilt)
- Spinner/skeleton visas endast under aktiva anrop.
- Tydlig progress (t.ex. “Connecting…”, “Loading data…”).
- Maxladdningstid med fallback till fel/diagnos.

## Validering
- Admin/Operatör/Dating login visar fel i stället för evig spinner.
- ProtectedRoute redirectar korrekt; panelerna renderar.
- `/health` visar grönt när allt OK.

Bekräfta så implementerar jag detta och testar live. 