## Functional Checklist for External Dating Site
1. Users & Auth
- Register/Login, session persistence, map to `users` (role `user`) with `id`, `email`, `is_active`, `is_verified`
- Optional e‑mail verification; allow purchase before verification
- Token handoff (JWT) for cross‑site single sign‑on (optional)

2. Profiles
- Create/edit `profiles` with: `user_id`, `site_id`, `name`, `age`, `gender`, `location`, `bio`, `interests`, `online_status`
- Profile gallery via `photos` (primary image, `is_blurred`, moderation status)
- Profile visibility per domain (site scoping)

3. Coins & Packages
- Show coin balance; update after each send and purchase
- Fetch site‑specific packages (EUR) and present “Buy Coins” UI
- Spend 1 coin per send (text+image/GIF together counts as 1)

4. Messaging/Chat
- Create/Resume `conversations`; send `messages` (text/image/GIF/emoji) with cost rules
- Typing indicator (optional), read receipts (optional)
- Operator lock support via `operator_locks`

5. Presence & Pool
- Update `profiles.online_status` with heartbeat; track `last_seen`
- Operator sees Online list; can move targets to pool and assign player profiles

6. Admin Controls
- Sites: create/edit domain, theme, language, baseline coin rate, packages
- Operators: add/remove operators, set roles, assign profiles
- Profiles: admin gallery with upload/blur/primary/delete
- Moderation: content flags, status
- Email/notifications: toggles (activate mail, forgot password, buy receipt, offline notify with threshold)
- Comments/Feedback: editable strings/content (see Localization)

7. Webhooks/Events (external integration)
- Payment provider callback → record purchase + coin credit
- Offline notify: trigger mail only if offline ≥ threshold
- Optional: analytics events (message sent, login, purchase)

8. Security & RLS
- Maintain Supabase RLS: users read/write own rows; admins/operators per policy
- External site uses anon key for read‑only endpoints and server key via Edge function for privileged ops (create user, purchases)

## Integration Options
1. Embed Widget (Quickest)
- Drop‑in JS widget (our SPA module) configured with `site_id`, Supabase URL/key
- Provides chat UI, coins, and profile viewing out‑of‑the‑box

2. REST/Edge API (Flexible)
- Minimal endpoints:
  - POST `/auth/register` (service role), POST `/auth/login` (issue JWT)
  - GET `/coins/packages?site_id=...`, GET `/coins/balance`
  - POST `/coins/spend`, POST `/coins/purchase/callback`
  - GET `/profiles/me`, POST `/profiles/photos` (upload signed URL), PATCH `/photos/:id` (blur/primary)
  - GET `/chat/conversations`, POST `/chat/send`
- External site renders UI; our API handles data/coins

3. Data Mapping Checklist
- Environment: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_ID`
- Domain mapping in `sites` with active flag
- Storage bucket for images; signed upload URLs or server upload flow

## English Localization & UI Copy
1. Localization Infrastructure
- Introduce i18n strings (`en`, `sv`) in a central file and hook
- Replace hard‑coded Swedish labels in Operator/Admin/Dating pages

2. Admin‑Editable Copy
- Add `system_strings` (or use `system_settings`) keys for editable text:
  - Operator header/menu labels, empty‑states, button tooltips
  - Comments/feedback templates shown to users
- Admin UI to edit strings; live read on client (no redeploy needed)

## Operator Dashboard Adjustments
- Ensure all labels are English (Dashboard, Chats, Settings, Log out)
- Align section names (“Conversations”, “Online”, “Chat Notes”, “Player Notes”)
- Lock columns to viewport height (`h-[calc(100vh-64px)]`); only Online scrolls

## Implementation Plan
1. Add i18n module and refactor labels in Operator/Admin
2. Create `system_strings` table + Admin page section to edit copy
3. Add site wizard for domain/theme/rate + coin packages
4. Build integration docs (+ minimal Edge API stubs) for external sites
5. Finalize chat cost logic and presence heartbeat
6. QA across breakpoints (mobile/tablet/desktop/3xl)

## Confirmation
- Shall I proceed to implement i18n (English default), admin‑editable copy, and the fixed‑height chat layout, and prepare integration docs plus simple Edge API stubs for external platforms?