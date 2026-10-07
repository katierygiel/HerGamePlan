# Her Game Plan: The Women Playmakers' Network

A working app built from the Her Game Plan Figma prototype: networking, mentorship, goals, job board, tips, and community for women in sports.

**Status:** fully interactive **demo mode**. Every screen and flow works, and data is saved in the browser. Other members, replies, and reactions are *simulated*. Making it live for real people needs a backend (see [Going real](#going-real)).

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 30 end-to-end tests (sign up, goals, jobs, tracker, chat, mentors...)
npm run build        # production build -> dist/
npm run build:single # everything inlined in ONE file -> dist-single/index.html
```

**Demo account:** `demo@hergameplan.app` / `playmaker` (or tap "Explore the demo" on the welcome screen).
A brand-new sign-up starts with an empty profile so you can test onboarding and empty states.

## Deploy to GitHub Pages
1. Push this folder to a GitHub repo (branch `main`).
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. Done. `.github/workflows/deploy.yml` tests, builds, and publishes on every push.

Prefer no build step? Upload `dist-single/index.html` as `index.html` to any static host.

## What's inside

| Area | What works |
|---|---|
| **Auth** | Splash, welcome, sign up / in with validation, forgot-password (email → code → new password), 3-step onboarding, terms checkbox |
| **Home** | Goal rings with +/-, streak, Video of the Week, best-match jobs, community preview, articles, notifications |
| **Goals** | Short / long term, multiple goals, steps (add/check/remove), edit/delete, public/private, streaks, celebration on completion, **community goals to cheer and comment on**, support threads |
| **Jobs** | Search (word-prefix), filters, match % from your interests, save, job detail, apply with pre-saved info, **application tracker** (Applied → Interviewing → Offer → Closed, with notes), post a job, delete your posts |
| **Tips** | Video of the Week player, category filters, bookmarks, full article reader, **per-article discussion** |
| **Connect** | Community feed (updates, wins, questions, events), likes, comments, report / block, **direct messages** with typing indicator, **mentor matching** with requests (pending, accepted, waitlisted) |
| **Profile** | Public profiles, connect, message, edit profile with photo upload, settings, blocked list, sign out |

## Make it yours
- **Logo:** replace the files in `src/assets/` keeping the same names (`logo-lockup-white.png`, `logo-lockup-purple.png`, `logo-icon-white.png`, `logo-icon-purple.png`). An **SVG** export is ideal: change the imports in `src/ui.jsx` to `.svg`.
- **Photos:** `emily-parker.jpg`, `emma-wilson.jpg`, `article-trainers.jpg` in `src/assets/`. Better originals will look much sharper.
- **Real video:** the Video of the Week uses a demo player (`VideoModal` in `src/screens/Tips.jsx`). Swap its poster block for a `<video src=...>` or an embed.
- **Content:** jobs, articles, people, and posts live in `src/data/seed.js`.
- **Colors / type:** CSS variables at the top of `src/styles.css`. Font is Cooper Hewitt via `@fontsource`.

## Architecture
```
src/
  api/local.js     every user action as a pure function: op(db, payload) -> nextDb  (+ localStorage load/save)
  store.jsx        React context, navigation stack, toasts, and the demo-mode "community" simulation
  screens/         one file per area (Auth, Home, Goals, Jobs, Tips, Connect, Profile)
  ui.jsx           shared components (Screen/wave header, NavBar, Ring, Sheet, Field, Thread...)
  data/seed.js     sample content
supabase/schema.sql  starter Postgres schema for the real backend
test/app.test.jsx    end-to-end tests
```

## Going real
Screens never touch storage; they call `act("opName", payload)`. Each op in `src/api/local.js` maps to one backend call:

| Op | Backend call |
|---|---|
| `signUp`, `signIn`, `signOut` | Supabase Auth |
| `updateMe`, `completeOnboarding` | `update profiles` |
| `addGoal`, `toggleStep`, `cheerGoal`, `commentGoal` | `goals`, `goal_steps`, `goal_cheers`, `comments` |
| `applyToJob`, `setApplicationStatus`, `postJob` | `applications`, `jobs` |
| `createPost`, `likePost`, `commentPost` | `posts`, `post_likes`, `comments` |
| `sendMessage` | `messages` (+ Realtime subscription) |
| `requestMentor`, `respondMentor` | `mentor_requests` |

Steps:
1. Create a Supabase project and run `supabase/schema.sql`. **Finish the Row Level Security policies** (only the key tables are sketched).
2. Replace each `ops[name]` with an async call that writes to the server and merges the result into state (keep an optimistic update so the UI stays instant).
3. Delete the simulation in `src/store.jsx` (`later(...)` blocks) because real people provide the replies and reactions.
4. Add what a public community needs: **email verification, content moderation** (a review queue for the `reports` table), rate limiting, a lawyer-reviewed **Privacy Policy and Terms** (Apple requires them), and account deletion.
5. For the App Store, wrap with [Capacitor](https://capacitorjs.com) to get an iOS/Android shell around this same code.

## Known limits (honest list)
- Demo data lives in one browser. Clearing site data resets it. Passwords are hashed client-side for the demo only and are **not** real authentication.
- Uploaded profile photos are resized and stored in localStorage (fine for a demo, not for production).
- The logo and photos were extracted from design screenshots at modest resolution; replace with the original exports.
