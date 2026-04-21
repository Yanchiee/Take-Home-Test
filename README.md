# Take-Home Test Platform

Self-hosted take-home test delivery and timing platform for Arca Academy.

## Local setup

1. `cp .env.local.example .env.local` and fill in values:
   - **Supabase**: create a project at https://supabase.com, paste the project URL and the **service role** key (NOT the anon key).
   - **Admin**: pick a strong password (`ADMIN_PASSWORD`) and a long random string (`ADMIN_COOKIE_SECRET`).
2. In Supabase → SQL Editor, paste the contents of `schema.sql` and run it once.
3. `npm install`
4. `npm run dev` → http://localhost:3000

## Tests

```bash
npm test
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel → New Project → import the repo.
3. Add the environment variables from `.env.local` to Vercel project settings.
4. Deploy.

## Editing the test content

`content/test.md` contains the take-home test. Edit it, push to `main`, Vercel auto-deploys. Candidates — including in-progress ones — see the latest content on next page load.

## Admin access

Visit `/admin` → enter `ADMIN_PASSWORD`. Cookie lasts 8 hours. Dashboard auto-refreshes every 30s.

## Architecture summary

- Candidates register with name + email at `/`
- They get a unique resume token URL: `/test/<token>`
- Server tracks active time via 10s heartbeats with a 15s grace window (`lib/accumulate.ts`)
- Client tracks discrete events (idle, tab close, paste) via `/api/event`
- On Finish, candidate pastes Drive + video links
- Admin sees a table of all candidates + per-candidate timeline view
