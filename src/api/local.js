/**
 * Her Game Plan: local (demo) data layer.
 *
 * Every user action is a pure function:   op(db, payload) => nextDb
 * Each op maps 1:1 to a backend call (see README -> "Going real").
 * To go live, replace `ops[name]` with an async request that writes to your
 * server, then merge the response into local state. Screens never touch storage.
 */
import { SEED_SHARED, blankPersonal, demoPersonal, DEMO_EMAIL, dayKey } from "../data/seed";

const KEY = "hgp:db:v1";

export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

export function fresh() {
  return { v: 1, session: { signedIn: false, email: null }, accounts: [], ...SEED_SHARED(), ...blankPersonal() };
}
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.v === 1) return d;
    }
  } catch (e) { /* ignore, fall through */ }
  return fresh();
}
export function save(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn("Could not save", e); }
}
export function wipe() {
  try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
}

/* ---------- helpers ---------- */
const mapBy = (arr, id, fn) => arr.map((x) => (x.id === id ? fn(x) : x));
const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const withActivity = (db) => {
  const k = dayKey(Date.now());
  return db.activity.includes(k) ? db : { ...db, activity: [...db.activity, k] };
};
const pushNotif = (db, n) => ({
  ...db,
  notifications: [{ id: uid("n"), ts: Date.now(), read: false, ...n }, ...db.notifications].slice(0, 60),
});

/** find a goal that belongs to me or to someone in the community */
export function findGoal(db, id) {
  const mine = db.goals.find((g) => g.id === id);
  if (mine) return { goal: mine, ownerId: "me" };
  for (const p of db.people) {
    const g = p.goals.find((x) => x.id === id);
    if (g) return { goal: g, ownerId: p.id };
  }
  return null;
}
const mapGoal = (db, id, fn) => {
  if (db.goals.some((g) => g.id === id)) return { ...db, goals: mapBy(db.goals, id, fn) };
  return { ...db, people: db.people.map((p) => (p.goals.some((g) => g.id === id) ? { ...p, goals: mapBy(p.goals, id, fn) } : p)) };
};

const stepStats = (g) => ({ done: g.steps.filter((s) => s.done).length, total: g.steps.length });
const finishCheck = (g) => {
  const { done, total } = stepStats(g);
  if (total > 0 && done === total && !g.completedAt) return { ...g, completedAt: Date.now() };
  if (done < total && g.completedAt) return { ...g, completedAt: null };
  return g;
};

/* ---------- operations ---------- */
export const ops = {
  /* auth + session */
  signUp: (db, { firstName, lastName, email, hash }) => ({
    ...db,
    accounts: [...db.accounts.filter((a) => a.email !== email.toLowerCase()), { email: email.toLowerCase(), hash }],
    session: { signedIn: true, email: email.toLowerCase() },
    ...blankPersonal({ firstName, lastName, email: email.toLowerCase() }),
  }),
  signIn: (db, { email }) => {
    const e = email.toLowerCase();
    const next = { ...db, session: { signedIn: true, email: e } };
    if ((db.me.email || "").toLowerCase() === e) return next;
    return { ...next, ...blankPersonal({ firstName: e.split("@")[0], lastName: "", email: e }) };
  },
  loadDemo: (db) => ({ ...db, session: { signedIn: true, email: DEMO_EMAIL }, ...demoPersonal() }),
  signOut: (db) => ({ ...db, session: { signedIn: false, email: null } }),
  resetPassword: (db, { email, hash }) => ({ ...db, accounts: db.accounts.map((a) => (a.email === email.toLowerCase() ? { ...a, hash } : a)) }),
  resetAll: () => fresh(),

  /* profile */
  updateMe: (db, patch) => ({ ...db, me: { ...db.me, ...patch } }),
  completeOnboarding: (db, patch) =>
    pushNotif({ ...db, me: { ...db.me, ...patch, onboarded: true } }, { kind: "welcome", text: "Your profile is live. Say hi in the community feed.", to: { name: "connect" } }),
  setSetting: (db, { key, value }) => ({ ...db, settings: { ...db.settings, [key]: value } }),
  toggleConnect: (db, { id }) => ({ ...db, connections: toggle(db.connections, id) }),
  blockUser: (db, { id }) => ({ ...db, blocked: db.blocked.includes(id) ? db.blocked : [...db.blocked, id], connections: db.connections.filter((c) => c !== id) }),
  unblockUser: (db, { id }) => ({ ...db, blocked: db.blocked.filter((b) => b !== id) }),
  report: (db, { kind, id, reason }) => ({ ...db, reports: [...db.reports, { id: uid("r"), kind, target: id, reason, ts: Date.now() }] }),

  /* goals */
  addGoal: (db, { id, term, title, steps = [], isPublic = false }) =>
    withActivity({
      ...db,
      goals: [{ id, term, title, isPublic, ts: Date.now(), completedAt: null, cheers: [], comments: [], steps: steps.map((label) => ({ id: uid("s"), label, done: false })) }, ...db.goals],
    }),
  updateGoal: (db, { id, patch }) => mapGoal(db, id, (g) => ({ ...g, ...patch })),
  deleteGoal: (db, { id }) => ({ ...db, goals: db.goals.filter((g) => g.id !== id) }),
  addStep: (db, { id, label }) => mapGoal(db, id, (g) => finishCheck({ ...g, steps: [...g.steps, { id: uid("s"), label, done: false }] })),
  removeStep: (db, { id, stepId }) => mapGoal(db, id, (g) => finishCheck({ ...g, steps: g.steps.filter((s) => s.id !== stepId) })),
  toggleStep: (db, { id, stepId }) => {
    const next = mapGoal(db, id, (g) => finishCheck({ ...g, steps: mapBy(g.steps, stepId, (s) => ({ ...s, done: !s.done })) }));
    return withActivity(next);
  },
  /** the +/- buttons on the progress ring */
  adjustGoal: (db, { id, delta }) => {
    const next = mapGoal(db, id, (g) => {
      const steps = [...g.steps];
      if (delta > 0) {
        const i = steps.findIndex((s) => !s.done);
        if (i >= 0) steps[i] = { ...steps[i], done: true };
      } else {
        for (let i = steps.length - 1; i >= 0; i--) if (steps[i].done) { steps[i] = { ...steps[i], done: false }; break; }
      }
      return finishCheck({ ...g, steps });
    });
    return delta > 0 ? withActivity(next) : next;
  },
  cheerGoal: (db, { id, by = "me" }) => mapGoal(db, id, (g) => ({ ...g, cheers: toggle(g.cheers, by) })),
  commentGoal: (db, { id, text, by = "me" }) => mapGoal(db, id, (g) => ({ ...g, comments: [...g.comments, { id: uid("gc"), authorId: by, text, ts: Date.now() }] })),

  /* jobs */
  toggleSaveJob: (db, { id }) => ({ ...db, saved: toggle(db.saved, id) }),
  applyToJob: (db, { id: appId, jobId, form, saveToProfile }) => {
    const job = db.jobs.find((j) => j.id === jobId);
    if (!job || db.applications.some((a) => a.jobId === jobId)) return db;
    let next = {
      ...db,
      applications: [{ id: appId, jobId, jobSnap: { title: job.title, company: job.company }, status: "applied", ts: Date.now(), note: "", form }, ...db.applications],
      saved: db.saved.filter((s) => s !== jobId),
      jobs: mapBy(db.jobs, jobId, (j) => ({ ...j, interested: j.interested + 1 })),
    };
    if (saveToProfile) {
      next = { ...next, me: { ...next.me, firstName: form.firstName, lastName: form.lastName, phone: form.phone, city: form.city, state: form.state, headline: form.headline, portfolio: form.portfolio, resume: form.resume } };
    }
    return withActivity(next);
  },
  setApplicationStatus: (db, { id, status }) => ({ ...db, applications: mapBy(db.applications, id, (a) => ({ ...a, status })) }),
  setApplicationNote: (db, { id, note }) => ({ ...db, applications: mapBy(db.applications, id, (a) => ({ ...a, note })) }),
  withdrawApplication: (db, { id }) => {
    const app = db.applications.find((a) => a.id === id);
    return { ...db, applications: db.applications.filter((a) => a.id !== id), jobs: app ? mapBy(db.jobs, app.jobId, (j) => ({ ...j, interested: Math.max(0, j.interested - 1) })) : db.jobs };
  },
  postJob: (db, { job }) => withActivity({ ...db, jobs: [{ ...job, ts: Date.now(), interested: 0 }, ...db.jobs] }),
  deleteJob: (db, { id }) => ({ ...db, jobs: db.jobs.filter((j) => j.id !== id), saved: db.saved.filter((s) => s !== id) }),

  /* articles */
  toggleBookmark: (db, { id }) => ({ ...db, bookmarks: toggle(db.bookmarks, id) }),
  commentArticle: (db, { id, text, by = "me" }) => ({ ...db, articles: mapBy(db.articles, id, (a) => ({ ...a, comments: [...a.comments, { id: uid("ac"), authorId: by, text, ts: Date.now() }] })) }),

  /* feed */
  createPost: (db, { post }) => withActivity({ ...db, posts: [{ ts: Date.now(), likes: [], comments: [], authorId: "me", ...post }, ...db.posts] }),
  deletePost: (db, { id }) => ({ ...db, posts: db.posts.filter((p) => p.id !== id) }),
  likePost: (db, { id, by = "me" }) => ({ ...db, posts: mapBy(db.posts, id, (p) => ({ ...p, likes: toggle(p.likes, by) })) }),
  commentPost: (db, { id, text, by = "me" }) => ({ ...db, posts: mapBy(db.posts, id, (p) => ({ ...p, comments: [...p.comments, { id: uid("pc"), authorId: by, text, ts: Date.now() }] })) }),

  /* messages */
  startConversation: (db, { userId }) => {
    const id = `c_${userId}`;
    return db.conversations.some((c) => c.id === id) ? db : { ...db, conversations: [{ id, userId, unread: 0, messages: [] }, ...db.conversations] };
  },
  sendMessage: (db, { userId, text, by = "me" }) => {
    const id = `c_${userId}`;
    const base = db.conversations.some((c) => c.id === id) ? db : { ...db, conversations: [{ id, userId, unread: 0, messages: [] }, ...db.conversations] };
    const conv = base.conversations.find((c) => c.id === id);
    const msg = { id: uid("m"), from: by, text, ts: Date.now() };
    const updated = { ...conv, messages: [...conv.messages, msg], unread: by === "me" ? 0 : conv.unread + 1 };
    return { ...base, conversations: [updated, ...base.conversations.filter((c) => c.id !== id)] };
  },
  markRead: (db, { userId }) => ({ ...db, conversations: db.conversations.map((c) => (c.userId === userId && c.unread ? { ...c, unread: 0 } : c)) }),

  /* mentors */
  requestMentor: (db, { id, mentorId, message }) => {
    if (db.mentorRequests.some((r) => r.mentorId === mentorId && r.status !== "declined")) return db;
    return withActivity({ ...db, mentorRequests: [{ id, mentorId, message, status: "pending", ts: Date.now() }, ...db.mentorRequests] });
  },
  respondMentor: (db, { mentorId, status }) => ({ ...db, mentorRequests: db.mentorRequests.map((r) => (r.mentorId === mentorId ? { ...r, status } : r)) }),
  cancelMentorRequest: (db, { mentorId }) => ({ ...db, mentorRequests: db.mentorRequests.filter((r) => r.mentorId !== mentorId) }),

  /* notifications */
  notify: (db, n) => pushNotif(db, n),
  readNotification: (db, { id }) => ({ ...db, notifications: mapBy(db.notifications, id, (n) => ({ ...n, read: true })) }),
  readAllNotifications: (db) => ({ ...db, notifications: db.notifications.map((n) => ({ ...n, read: true })) }),
};
