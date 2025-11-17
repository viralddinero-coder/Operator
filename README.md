# AngryAdmin Panel

## Deploy via Vercel

1. Create a private GitHub repo and push this project
2. In Vercel → Import the repo
3. Add env vars:
   - `VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<ANON_KEY>`
4. Add domain `admin.angryadmin.online` and set DNS CNAME to Vercel
5. In Supabase Auth → Redirect URLs:
   - `https://admin.angryadmin.online/admin/login`
   - `https://admin.angryadmin.online/`
6. Open `https://admin.angryadmin.online/admin`

## Notes

- SSL/TLS is automatic on Vercel
- Security headers controlled via `vercel.json`
- SPA rewrite for Netlify via `public/_redirects`
