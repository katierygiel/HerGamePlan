# Her Game Plan: The Women Playmakers' Network

A mobile-first web app (works on iPhone, Android and desktop; installable to the home screen) for women in sports:
goals with community cheering, a community feed, messaging, mentor matching, tips & tricks, and a jobs "coming soon" list.

**Stack:** React 18 + Vite · Supabase (Auth, Postgres with Row Level Security, Realtime) · Vercel hosting.

## Run it locally
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 25 UI tests against an in-memory stand-in for the database
npm run build      # production build in dist/
```
The app talks to Supabase using the project URL and **publishable** key in `src/api/supa.js` (safe to be public; data is
protected by Row Level Security). To point at a different project set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Database
`supabase/schema.sql` creates every table, the privacy rules, notification triggers, invite-code gating and admin functions.
`supabase/seed_articles.sql` adds the four labeled concept-sample articles. Run both once in the Supabase SQL Editor.

- **Invite-only:** sign-up is rejected by the database unless the invite code is valid (`invite_codes` table; manage in Admin).
- **Admin:** after you sign up, run `update public.profiles set is_admin = true where email = 'you@email.com';`
- **Mentors:** members apply in the app; admins approve in Admin → Mentors. Only approved mentors are listed.
- **Privacy:** private goals are visible only to their owner; messages only to the two people in them; nobody can make
  themselves admin or mentor; members can export or delete their own data from Settings.

## Code map
- `src/api/supa.js`: reads (`hydrate`), writes (`remote[op]`), realtime, auth, admin, export/delete
- `src/api/local.js`: pure optimistic ops (`op(db, payload) => nextDb`), used for instant UI updates
- `src/store.jsx`: app state, action queue, live refresh, navigation (browser back / iPhone swipe-back)
- `src/screens/*`: Auth, Home, Goals, Tips, Jobs (coming soon), Connect, Profile/Settings, Admin
- `test/`: UI tests (`fakeSupa.js` is the in-memory backend) and `test/shots` for visual checks

## Before a public launch
Have a lawyer review `src/screens/Legal.jsx` (Terms & Privacy), set up a custom domain and a custom SMTP sender for
Supabase emails, and consider the LLC / trademark steps in the launch roadmap.
