/**
 * Her Game Plan: optimistic local ops.
 *
 * Every user action is a pure function:   op(db, payload) => nextDb
 * The screen updates instantly from this, then api/supa.js saves the same op to the database.
 * Screens never touch storage or the network directly.
 */
import { dayKey } from "../data/seed";

export const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 0x3) | 0x8).toString(16); }));

/* ---------- helpers ---------- */
const mapBy = (arr, id, fn) => arr.map((x) => (x.id === id ? fn(x) : x));
const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const withActivity = (db) => {
  const k = dayKey(Date.now());
  return db.activity.includes(k) ? db : { ...db, activity: [...db.activity, k] };
};

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
  /* profile */
  updateMe: (db, patch) => ({ ...db, me: { ...db.me, ...patch } }),
  completeOnboarding: (db, patch) => ({ ...db, me: { ...db.me, ...patch, onboarded: true } }),
  setSetting: (db, { key, value }) => ({ ...db, settings: { ...db.settings, [key]: value } }),
  toggleConnect: (db, { id }) => ({ ...db, connections: toggle(db.connections, id) }),
  blockUser: (db, { id }) => ({ ...db, blocked: db.blocked.includes(id) ? db.blocked : [...db.blocked, id], connections: db.connections.filter((c) => c !== id) }),
  unblockUser: (db, { id }) => ({ ...db, blocked: db.blocked.filter((b) => b !== id) }),
  report: (db) => db,

  /* goals */
  addGoal: (db, { id, term, title, steps = [], isPublic = false }) =>
    withActivity({
      ...db,
      goals: [{ id, term, title, isPublic, ts: Date.now(), completedAt: null, cheers: [], comments: [], steps: steps.map((label) => ({ id: uid(), label, done: false })) }, ...db.goals],
    }),
  updateGoal: (db, { id, patch }) => mapGoal(db, id, (g) => ({ ...g, ...patch })),
  deleteGoal: (db, { id }) => ({ ...db, goals: db.goals.filter((g) => g.id !== id) }),
  addStep: (db, { id, label }) => mapGoal(db, id, (g) => finishCheck({ ...g, steps: [...g.steps, { id: uid(), label, done: false }] })),
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
  cheerGoal: (db, { id }) => mapGoal(db, id, (g) => ({ ...g, cheers: toggle(g.cheers, "me") })),
  commentGoal: (db, { id, text }) => mapGoal(db, id, (g) => ({ ...g, comments: [...g.comments, { id: uid(), authorId: "me", text, ts: Date.now() }] })),

  /* articles */
  toggleBookmark: (db, { id }) => ({ ...db, bookmarks: toggle(db.bookmarks, id) }),
  commentArticle: (db, { id, text }) => ({ ...db, articles: mapBy(db.articles, id, (a) => ({ ...a, comments: [...a.comments, { id: uid(), authorId: "me", text, ts: Date.now() }] })) }),

  /* feed */
  createPost: (db, { post }) => withActivity({ ...db, posts: [{ ts: Date.now(), likes: [], comments: [], authorId: "me", ...post }, ...db.posts] }),
  deletePost: (db, { id }) => ({ ...db, posts: db.posts.filter((p) => p.id !== id) }),
  likePost: (db, { id }) => ({ ...db, posts: mapBy(db.posts, id, (p) => ({ ...p, likes: toggle(p.likes, "me") })) }),
  commentPost: (db, { id, text }) => ({ ...db, posts: mapBy(db.posts, id, (p) => ({ ...p, comments: [...p.comments, { id: uid(), authorId: "me", text, ts: Date.now() }] })) }),

  /* messages */
  startConversation: (db, { userId }) => {
    const id = `c_${userId}`;
    return db.conversations.some((c) => c.id === id) ? db : { ...db, conversations: [{ id, userId, unread: 0, messages: [] }, ...db.conversations] };
  },
  sendMessage: (db, { userId, text }) => {
    const id = `c_${userId}`;
    const base = db.conversations.some((c) => c.id === id) ? db : { ...db, conversations: [{ id, userId, unread: 0, messages: [] }, ...db.conversations] };
    const conv = base.conversations.find((c) => c.id === id);
    const msg = { id: uid(), from: "me", text, ts: Date.now() };
    const updated = { ...conv, messages: [...conv.messages, msg], unread: 0 };
    return withActivity({ ...base, conversations: [updated, ...base.conversations.filter((c) => c.id !== id)] });
  },
  markRead: (db, { userId }) => ({ ...db, conversations: db.conversations.map((c) => (c.userId === userId && c.unread ? { ...c, unread: 0 } : c)) }),

  /* mentors */
  requestMentor: (db, { id, mentorId, message }) => {
    if (db.mentorRequests.some((r) => r.mentorId === mentorId)) return db;
    return withActivity({ ...db, mentorRequests: [{ id, mentorId, message, status: "pending", ts: Date.now() }, ...db.mentorRequests] });
  },
  cancelMentorRequest: (db, { mentorId }) => ({ ...db, mentorRequests: db.mentorRequests.filter((r) => r.mentorId !== mentorId) }),
  answerRequest: (db, { id, status }) => ({ ...db, incomingRequests: mapBy(db.incomingRequests, id, (r) => ({ ...r, status })) }),
  applyMentor: (db, { app }) => ({ ...db, mentorApp: { id: app.id, status: "pending", field: app.field, ts: Date.now() } }),

  /* notifications */
  readNotification: (db, { id }) => ({ ...db, notifications: mapBy(db.notifications, id, (n) => ({ ...n, read: true })) }),
  readAllNotifications: (db) => ({ ...db, notifications: db.notifications.map((n) => ({ ...n, read: true })) }),

  /* jobs "coming soon" interest list + feedback */
  saveJobsInterest: (db, { roles }) => ({ ...db, jobsInterest: { roles } }),
  clearJobsInterest: (db) => ({ ...db, jobsInterest: null }),
  sendFeedback: (db) => db,
};
