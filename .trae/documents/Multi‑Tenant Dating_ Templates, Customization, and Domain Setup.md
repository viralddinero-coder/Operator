## Goals
- Create and manage multiple dating sites from a shared codebase.
- Provide an Admin “Site Templates” and “Customize UI” module to clone and tailor sites.
- Support per‑site branding (logos, colors, backgrounds), mail settings, and domain mapping.

## Data Model
- `sites`: id, name, domain, status, created_at.
- `system_settings`: per‑site keys:
  - `site:<id>:branding` → { logo_url, bg_url, colors: { primary, secondary, text, bg } }
  - `site:<id>:strings` → translation overrides
  - `site:<id>:smtp_config` → mail provider credentials
  - `site:<id>:mail_settings` → toggles (welcome, reset, receipts, offline)
  - `site:<id>:templates` → UI/layout flags (cards, grid, hero sections)
  - `site:<id>:cookie_bar` → GDPR settings

## Admin UI
- “Sites” page:
  - Create site: name, domain, base template.
  - Quick actions: activate/deactivate, delete.
- “Customize UI” page (per site):
  - Branding: upload/select logo, background, pick colors, typographic scale.
  - Strings: inline editor for labels.
  - Layout toggles: choose modules (hero, featured profiles, grid type, card shape).
  - Cookie/GDPR: consent text per site.
  - Mail config: SMTP/API and test send.
- “Templates” page:
  - Define base templates (Minimal, Standard, Pro).
  - Clone from template → prefill `system_settings` for new site.

## Domain Mapping
- Client: host‑based `getSiteByDomain(hostname)` on app init.
- Fallback: site id via query or path for staging.
- Deploy: add domains per site in hosting (Vercel/Netlify) and set correct `VITE_SUPABASE_URL` per env.

## Auth & Mail
- Dev: disable email confirmations; Prod: enable and configure provider.
- `sendMail` Edge Function:
  - Input: siteId, templateKey, to, data.
  - Reads `site:<id>:smtp_config` + `site:<id>:mail_templates`.
  - Sends with site‑specific `from_email` and logs `mail_logs`.

## Branding Assets
- Storage bucket `branding` with folders per site id.
- Admin uploads write URLs into `site:<id>:branding`.
- Client applies CSS variables from `branding.colors`.

## Edge Functions
- `createUser` & `updatePassword` (Service Role) for admin/operatör.
- `sendMail` (per‑site mail provider).
- `massMessage` (scheduled; per‑site cadence).

## RLS & Security
- Self insert/select/update for `users` and `profiles`.
- Admin actions via Edge Functions (Service Role), not client.
- Secrets only on server.

## CI/CD
- Migrations for settings & policies.
- Edge Functions deploy with secrets.
- Preview deployments; site detection by host.

## Rollout Steps
1) Create base templates (Minimal/Standard/Pro) in Admin Templates.
2) Add new site in Admin Sites with domain and base template.
3) Customize UI: branding, strings, layout.
4) Configure mail provider credentials per site and test send.
5) Map domain in hosting and Supabase auth redirects.
6) Enable email confirmations in prod.

## Testing Checklist
- Register/login per site with site‑specific emails.
- Reset password, receipts and offline notifications.
- UI branding correct (logos/colors/backgrounds).
- Mass Message and announcements per site.

Confirm and I’ll implement: Admin Templates + Customize UI pages, per‑site settings keys, domain detection, `sendMail` function, and all required RLS/SQL. 