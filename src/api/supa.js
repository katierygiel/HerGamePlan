/**
 * Her Game Plan: Supabase data layer.
 *
 *  - `hydrate(userId)`  reads everything the signed-in member is allowed to see and returns the
 *    same `db` shape the screens already use ("me" always means the signed-in member).
 *  - `remote[op]`       persists each user action (same op names as api/local.js). The UI updates
 *    instantly from the local op, then the matching remote call saves it; Row Level Security in the
 *    database is what actually decides who may read or write what.
 *  - admin helpers, data export and account deletion live at the bottom.
 */
import { createClient } from "@supabase/supabase-js";
import trainersImg from "../assets/article-trainers.jpg";
import { dayKey } from "../data/seed";

const URL = import.meta.env.VITE_SUPABASE_URL || "https://iqukkllcjxrtarcezpsv.supabase.co";
// Publishable (anon) key: designed to be public. Data is protected by Row Level Security, not by hiding this.
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_pBxLYg-bHkx1YOST818p4w_dX2zdS3R";

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 10 } },
});

const ok = async (p) => {
  const r = await p;
  if (r.error) throw r.error;
  return r.data;
};
const ts = (s) => (s ? new Date(s).getTime() : null);
const IMAGES = { trainers: trainersImg };

/* ------------------------------------------------------------------ */
/* shape converters                                                   */
/* ------------------------------------------------------------------ */
const fullName = (p) => `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Member";

function toPerson(p) {
  return {
    id: p.id, name: fullName(p), firstName: p.first_name, lastName: p.last_name, headline: p.headline, role: p.role, bio: p.bio,
    city: p.city, state: p.state, photo: p.photo_url || null, years: p.years || 0, interests: p.interests || [],
    mentor: !!p.is_mentor, field: p.mentor_field || "", capacity: p.mentor_capacity || "", expertise: p.expertise || [],
    goals: [],
  };
}

function toMe(p) {
  return {
    id: "me", userId: p.id, email: p.email || "", firstName: p.first_name, lastName: p.last_name, role: p.role, headline: p.headline,
    bio: p.bio, city: p.city, state: p.state, phone: p.phone, portfolio: p.portfolio, resume: p.resume, photo: p.photo_url || null,
    interests: p.interests || [], onboarded: !!p.onboarded, isAdmin: !!p.is_admin, mentor: !!p.is_mentor,
    field: p.mentor_field || "", capacity: p.mentor_capacity || "", expertise: p.expertise || [], years: p.years || 0,
  };
}

function toGoal(g, id) {
  return {
    id: g.id, term: g.term, title: g.title, isPublic: g.is_public, ts: ts(g.created_at), completedAt: ts(g.completed_at),
    steps: [...(g.goal_steps || [])].sort((a, b) => a.position - b.position || ts(a.created_at) - ts(b.created_at)).map((s) => ({ id: s.id, label: s.label, done: s.done })),
    cheers: (g.goal_cheers || []).map((c) => id(c.user_id)),
    comments: [...(g.goal_comments || [])].sort((a, b) => ts(a.created_at) - ts(b.created_at)).map((c) => ({ id: c.id, authorId: id(c.user_id), text: c.text, ts: ts(c.created_at) })),
  };
}

/* ------------------------------------------------------------------ */
/* read everything                                                    */
/* ------------------------------------------------------------------ */
export async function hydrate(userId) {
  const id = (x) => (x === userId ? "me" : x);
  const [profiles, goals, posts, articles, bookmarks, msgs, reqs, conns, blocks, notifs, acts, interest, apps] = await Promise.all([
    ok(supabase.from("profiles").select("*")),
    ok(supabase.from("goals").select("*, goal_steps(*), goal_cheers(user_id), goal_comments(*)").order("created_at", { ascending: false })),
    ok(supabase.from("posts").select("*, post_likes(user_id), post_comments(*)").order("created_at", { ascending: false }).limit(150)),
    ok(supabase.from("articles").select("*, article_comments(*)").order("created_at", { ascending: false })),
    ok(supabase.from("bookmarks").select("article_id").eq("user_id", userId)),
    ok(supabase.from("messages").select("*").or(`from_id.eq.${userId},to_id.eq.${userId}`).order("created_at", { ascending: true }).limit(2000)),
    ok(supabase.from("mentor_requests").select("*").or(`mentee_id.eq.${userId},mentor_id.eq.${userId}`).order("created_at", { ascending: false })),
    ok(supabase.from("connections").select("other_id").eq("user_id", userId)),
    ok(supabase.from("blocks").select("blocked_id").eq("user_id", userId)),
    ok(supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(60)),
    ok(supabase.from("activity_days").select("day").eq("user_id", userId).order("day", { ascending: false }).limit(120)),
    ok(supabase.from("jobs_interest").select("*").eq("user_id", userId).maybeSingle()),
    ok(supabase.from("mentor_applications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1)),
  ]);

  const meRow = profiles.find((p) => p.id === userId);
  if (!meRow) throw new Error("Your profile could not be loaded.");
  const people = profiles.filter((p) => p.id !== userId).map(toPerson);
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));

  const myGoals = [];
  goals.forEach((g) => {
    const goal = toGoal(g, id);
    if (g.user_id === userId) myGoals.push(goal);
    else if (byId[g.user_id] && g.is_public) byId[g.user_id].goals.push(goal);
  });

  const convMap = new Map();
  msgs.forEach((m) => {
    const other = m.from_id === userId ? m.to_id : m.from_id;
    if (!convMap.has(other)) convMap.set(other, { id: `c_${other}`, userId: other, unread: 0, messages: [] });
    const c = convMap.get(other);
    c.messages.push({ id: m.id, from: id(m.from_id), text: m.text, ts: ts(m.created_at) });
    if (m.to_id === userId && !m.read_at) c.unread += 1;
  });
  const conversations = [...convMap.values()].sort((a, b) => b.messages[b.messages.length - 1].ts - a.messages[a.messages.length - 1].ts);

  return {
    v: 2,
    session: { signedIn: true, userId, email: meRow.email },
    me: toMe(meRow),
    settings: { notifications: true, ...(meRow.settings || {}) },
    people,
    goals: myGoals,
    articles: articles.map((a) => ({
      id: a.id, cat: a.category, read: a.read_min, photo: IMAGES[a.image_key] || null, title: a.title, author: a.author_label, role: a.role_label,
      excerpt: a.excerpt, blocks: a.blocks || [], isSample: a.is_sample, ts: ts(a.created_at),
      comments: [...(a.article_comments || [])].sort((x, y) => ts(x.created_at) - ts(y.created_at)).map((c) => ({ id: c.id, authorId: id(c.user_id), text: c.text, ts: ts(c.created_at) })),
    })),
    bookmarks: bookmarks.map((b) => b.article_id),
    posts: posts.map((p) => ({
      id: p.id, authorId: id(p.user_id), type: p.kind, ts: ts(p.created_at), text: p.text,
      ...(p.kind === "event" ? { event: { when: p.event_when || "", where: p.event_where || "TBD" } } : {}),
      likes: (p.post_likes || []).map((l) => id(l.user_id)),
      comments: [...(p.post_comments || [])].sort((a, b) => ts(a.created_at) - ts(b.created_at)).map((c) => ({ id: c.id, authorId: id(c.user_id), text: c.text, ts: ts(c.created_at) })),
    })),
    conversations,
    mentorRequests: reqs.filter((r) => r.mentee_id === userId).map((r) => ({ id: r.id, mentorId: r.mentor_id, message: r.message, status: r.status, ts: ts(r.created_at) })),
    incomingRequests: reqs.filter((r) => r.mentor_id === userId).map((r) => ({ id: r.id, menteeId: r.mentee_id, message: r.message, status: r.status, ts: ts(r.created_at) })),
    mentorApp: apps[0] ? { id: apps[0].id, status: apps[0].status, field: apps[0].field, ts: ts(apps[0].created_at) } : null,
    connections: conns.map((c) => c.other_id),
    blocked: blocks.map((b) => b.blocked_id),
    notifications: notifs.map((n) => ({ id: n.id, kind: n.kind, text: n.text, ts: ts(n.created_at), read: n.read, to: n.target })),
    activity: acts.map((a) => a.day),
    jobsInterest: interest ? { roles: interest.roles || [] } : null,
  };
}

/* ------------------------------------------------------------------ */
/* writes (one per user action; same names as api/local.js ops)       */
/* ------------------------------------------------------------------ */
const COLS = {
  firstName: "first_name", lastName: "last_name", headline: "headline", role: "role", bio: "bio", city: "city", state: "state",
  phone: "phone", portfolio: "portfolio", resume: "resume", photo: "photo_url", interests: "interests", onboarded: "onboarded",
  capacity: "mentor_capacity", expertise: "expertise",
};
const toCols = (patch) => Object.fromEntries(Object.entries(patch).filter(([k]) => COLS[k]).map(([k, v]) => [COLS[k], v]));
const goalIn = (db, goalId) => db.goals.find((g) => g.id === goalId) || db.people.flatMap((p) => p.goals).find((g) => g.id === goalId);

const syncCompletion = (goalId, next) => {
  const g = next.goals.find((x) => x.id === goalId);
  if (!g) return null;
  return supabase.from("goals").update({ completed_at: g.completedAt ? new Date(g.completedAt).toISOString() : null }).eq("id", goalId).then(({ error }) => { if (error) throw error; });
};

export const remote = {
  updateMe: async (p, _prev, next, { uid }) => { await ok(supabase.from("profiles").update(toCols(p)).eq("id", uid)); },
  completeOnboarding: async (p, _prev, _next, { uid }) => { await ok(supabase.from("profiles").update({ ...toCols(p), onboarded: true }).eq("id", uid)); },
  setSetting: async (_p, _prev, next, { uid }) => { await ok(supabase.from("profiles").update({ settings: next.settings }).eq("id", uid)); },
  toggleConnect: async ({ id }, _prev, next, { uid }) => {
    if (next.connections.includes(id)) await ok(supabase.from("connections").upsert({ user_id: uid, other_id: id }));
    else await ok(supabase.from("connections").delete().eq("user_id", uid).eq("other_id", id));
  },
  blockUser: async ({ id }, _prev, _next, { uid }) => {
    await ok(supabase.from("blocks").upsert({ user_id: uid, blocked_id: id }));
    await ok(supabase.from("connections").delete().eq("user_id", uid).eq("other_id", id));
  },
  unblockUser: async ({ id }, _prev, _next, { uid }) => { await ok(supabase.from("blocks").delete().eq("user_id", uid).eq("blocked_id", id)); },
  report: async ({ kind, id, reason, snapshot = "" }, _prev, _next, { uid }) => {
    await ok(supabase.from("reports").insert({ reporter_id: uid, kind, target_id: String(id), reason, snapshot: String(snapshot).slice(0, 500) }));
  },

  addGoal: async ({ id }, _prev, next, { uid }) => {
    const g = next.goals.find((x) => x.id === id);
    await ok(supabase.from("goals").insert({ id, user_id: uid, term: g.term, title: g.title, is_public: g.isPublic }));
    if (g.steps.length) await ok(supabase.from("goal_steps").insert(g.steps.map((s, i) => ({ id: s.id, goal_id: id, label: s.label, done: s.done, position: i }))));
  },
  updateGoal: async ({ id, patch }) => {
    const row = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.isPublic !== undefined) row.is_public = patch.isPublic;
    if (Object.keys(row).length) await ok(supabase.from("goals").update(row).eq("id", id));
  },
  deleteGoal: async ({ id }) => { await ok(supabase.from("goals").delete().eq("id", id)); },
  addStep: async ({ id }, _prev, next) => {
    const g = next.goals.find((x) => x.id === id);
    const s = g.steps[g.steps.length - 1];
    await ok(supabase.from("goal_steps").insert({ id: s.id, goal_id: id, label: s.label, done: s.done, position: g.steps.length - 1 }));
    await syncCompletion(id, next);
  },
  removeStep: async ({ id, stepId }, _prev, next) => {
    await ok(supabase.from("goal_steps").delete().eq("id", stepId));
    await syncCompletion(id, next);
  },
  toggleStep: async ({ id, stepId }, _prev, next) => {
    const s = next.goals.find((x) => x.id === id).steps.find((x) => x.id === stepId);
    await ok(supabase.from("goal_steps").update({ done: s.done }).eq("id", stepId));
    await syncCompletion(id, next);
  },
  adjustGoal: async ({ id }, prev, next) => {
    const before = prev.goals.find((x) => x.id === id).steps;
    const after = next.goals.find((x) => x.id === id).steps;
    for (const s of after) {
      const b = before.find((x) => x.id === s.id);
      if (b && b.done !== s.done) await ok(supabase.from("goal_steps").update({ done: s.done }).eq("id", s.id));
    }
    await syncCompletion(id, next);
  },
  cheerGoal: async ({ id }, _prev, next, { uid }) => {
    const g = goalIn(next, id);
    if (g.cheers.includes("me")) await ok(supabase.from("goal_cheers").upsert({ goal_id: id, user_id: uid }, { ignoreDuplicates: true }));
    else await ok(supabase.from("goal_cheers").delete().eq("goal_id", id).eq("user_id", uid));
  },
  commentGoal: async ({ id }, _prev, next, { uid }) => {
    const c = goalIn(next, id).comments.slice(-1)[0];
    await ok(supabase.from("goal_comments").insert({ id: c.id, goal_id: id, user_id: uid, text: c.text }));
  },

  toggleBookmark: async ({ id }, _prev, next, { uid }) => {
    if (next.bookmarks.includes(id)) await ok(supabase.from("bookmarks").upsert({ user_id: uid, article_id: id }));
    else await ok(supabase.from("bookmarks").delete().eq("user_id", uid).eq("article_id", id));
  },
  commentArticle: async ({ id }, _prev, next, { uid }) => {
    const c = next.articles.find((a) => a.id === id).comments.slice(-1)[0];
    await ok(supabase.from("article_comments").insert({ id: c.id, article_id: id, user_id: uid, text: c.text }));
  },

  createPost: async ({ post }, _prev, _next, { uid }) => {
    await ok(supabase.from("posts").insert({ id: post.id, user_id: uid, kind: post.type, text: post.text, event_when: post.event?.when || null, event_where: post.event?.where || null }));
  },
  deletePost: async ({ id }) => { await ok(supabase.from("posts").delete().eq("id", id)); },
  likePost: async ({ id }, _prev, next, { uid }) => {
    const p = next.posts.find((x) => x.id === id);
    if (p.likes.includes("me")) await ok(supabase.from("post_likes").upsert({ post_id: id, user_id: uid }, { ignoreDuplicates: true }));
    else await ok(supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", uid));
  },
  commentPost: async ({ id }, _prev, next, { uid }) => {
    const c = next.posts.find((x) => x.id === id).comments.slice(-1)[0];
    await ok(supabase.from("post_comments").insert({ id: c.id, post_id: id, user_id: uid, text: c.text }));
  },

  sendMessage: async ({ userId }, _prev, next, { uid }) => {
    const m = next.conversations.find((c) => c.userId === userId).messages.slice(-1)[0];
    await ok(supabase.from("messages").insert({ id: m.id, from_id: uid, to_id: userId, text: m.text }));
  },
  markRead: async ({ userId }, _prev, _next, { uid }) => {
    await ok(supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("to_id", uid).eq("from_id", userId).is("read_at", null));
  },

  requestMentor: async ({ id, mentorId, message }, _prev, _next, { uid }) => {
    await ok(supabase.from("mentor_requests").insert({ id, mentee_id: uid, mentor_id: mentorId, message }));
  },
  cancelMentorRequest: async ({ mentorId }, _prev, _next, { uid }) => {
    await ok(supabase.from("mentor_requests").delete().eq("mentee_id", uid).eq("mentor_id", mentorId));
  },
  answerRequest: async ({ id, status }) => { await ok(supabase.from("mentor_requests").update({ status }).eq("id", id)); },
  applyMentor: async ({ app }, _prev, _next, { uid }) => {
    await ok(supabase.from("mentor_applications").insert({ id: app.id, user_id: uid, field: app.field, expertise: app.expertise, capacity: app.capacity, why: app.why }));
  },

  readNotification: async ({ id }) => { await ok(supabase.from("notifications").update({ read: true }).eq("id", id)); },
  readAllNotifications: async (_p, _prev, _next, { uid }) => { await ok(supabase.from("notifications").update({ read: true }).eq("user_id", uid).eq("read", false)); },

  saveJobsInterest: async ({ roles }, _prev, _next, { uid }) => { await ok(supabase.from("jobs_interest").upsert({ user_id: uid, roles })); },
  clearJobsInterest: async (_p, _prev, _next, { uid }) => { await ok(supabase.from("jobs_interest").delete().eq("user_id", uid)); },
  sendFeedback: async ({ kind, text }, _prev, _next, { uid }) => { await ok(supabase.from("feedback").insert({ user_id: uid, kind, text })); },
};

/** record that the member was active today (powers streaks and the admin "weekly actives" number) */
export async function markActive(uid) {
  await supabase.from("activity_days").upsert({ user_id: uid, day: dayKey(Date.now()) }, { ignoreDuplicates: true });
}

/* ------------------------------------------------------------------ */
/* realtime                                                           */
/* ------------------------------------------------------------------ */
const LIVE_TABLES = ["messages", "notifications", "posts", "post_likes", "post_comments", "goals", "goal_steps", "goal_cheers", "goal_comments", "mentor_requests", "profiles", "articles", "article_comments"];
export function subscribeLive(onChange) {
  const ch = supabase.channel("hgp-live");
  LIVE_TABLES.forEach((table) => ch.on("postgres_changes", { event: "*", schema: "public", table }, onChange));
  ch.subscribe();
  return () => { supabase.removeChannel(ch); };
}

/* ------------------------------------------------------------------ */
/* auth                                                               */
/* ------------------------------------------------------------------ */
export const authApi = {
  async checkInvite(code) {
    const { data, error } = await supabase.rpc("check_invite", { p_code: code });
    if (error) throw error;
    return !!data;
  },
  async signUp({ firstName, lastName, email, password, inviteCode }) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { first_name: firstName, last_name: lastName, invite_code: inviteCode.trim().toUpperCase() }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return { needsConfirm: !data.session };
  },
  async signIn({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async signOut() { await supabase.auth.signOut(); },
  async sendReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw error;
  },
  async setPassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },
};

/** friendlier messages for the errors people actually hit */
export function niceError(e) {
  const m = String(e?.message || e || "");
  if (/INVALID_INVITE_CODE|Database error saving new user/i.test(m)) return "That invite code isn't valid.";
  if (/Invalid login credentials/i.test(m)) return "Email or password is incorrect.";
  if (/already registered|already been registered/i.test(m)) return "An account with this email already exists. Try signing in.";
  if (/Email not confirmed/i.test(m)) return "Please confirm your email first. Check your inbox.";
  if (/rate limit|too many/i.test(m)) return "Too many tries. Please wait a few minutes and try again.";
  if (/Password should be|weak/i.test(m)) return "Choose a stronger password (at least 8 characters).";
  if (/Failed to fetch|NetworkError|network/i.test(m)) return "Can't reach the server. Check your connection and try again.";
  return m || "Something went wrong. Please try again.";
}

/* ------------------------------------------------------------------ */
/* account: export + delete                                           */
/* ------------------------------------------------------------------ */
export async function exportMyData(uid) {
  const tables = [
    ["profile", supabase.from("profiles").select("*").eq("id", uid)],
    ["goals", supabase.from("goals").select("*, goal_steps(*), goal_comments(*)").eq("user_id", uid)],
    ["posts", supabase.from("posts").select("*").eq("user_id", uid)],
    ["post_comments", supabase.from("post_comments").select("*").eq("user_id", uid)],
    ["goal_comments_written", supabase.from("goal_comments").select("*").eq("user_id", uid)],
    ["article_comments", supabase.from("article_comments").select("*").eq("user_id", uid)],
    ["messages", supabase.from("messages").select("*").or(`from_id.eq.${uid},to_id.eq.${uid}`)],
    ["mentor_requests", supabase.from("mentor_requests").select("*").or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`)],
    ["connections", supabase.from("connections").select("*").eq("user_id", uid)],
    ["bookmarks", supabase.from("bookmarks").select("*").eq("user_id", uid)],
    ["jobs_interest", supabase.from("jobs_interest").select("*").eq("user_id", uid)],
    ["feedback", supabase.from("feedback").select("*").eq("user_id", uid)],
  ];
  const out = { exportedAt: new Date().toISOString() };
  for (const [name, q] of tables) out[name] = await ok(q);
  return out;
}
export async function deleteMyAccount() {
  await ok(supabase.rpc("delete_my_account"));
  await supabase.auth.signOut();
}

/* ------------------------------------------------------------------ */
/* admin                                                              */
/* ------------------------------------------------------------------ */
export const admin = {
  async load() {
    const [stats, reports, feedback, apps, members, codes, interest, articles] = await Promise.all([
      ok(supabase.rpc("admin_stats")),
      ok(supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100)),
      ok(supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(100)),
      ok(supabase.from("mentor_applications").select("*").order("created_at", { ascending: false }).limit(100)),
      ok(supabase.from("profiles").select("id, first_name, last_name, email, role, is_mentor, is_admin, created_at").order("created_at", { ascending: false })),
      ok(supabase.from("invite_codes").select("*").order("created_at", { ascending: true })),
      ok(supabase.from("jobs_interest").select("roles")),
      ok(supabase.from("articles").select("id, title, category, is_sample, created_at").order("created_at", { ascending: false })),
    ]);
    const roleCounts = {};
    interest.forEach((r) => (r.roles || []).forEach((x) => { roleCounts[x] = (roleCounts[x] || 0) + 1; }));
    const name = Object.fromEntries(members.map((m) => [m.id, `${m.first_name} ${m.last_name}`.trim() || m.email]));
    const postIds = reports.filter((r) => r.kind === "post").map((r) => r.target_id);
    const posts = postIds.length ? await ok(supabase.from("posts").select("id, user_id, text").in("id", postIds)) : [];
    const postBy = Object.fromEntries(posts.map((p) => [p.id, p]));
    return {
      stats, members, codes, roleCounts, articles,
      reports: reports.map((r) => {
        const post = r.kind === "post" ? postBy[r.target_id] : null;
        const subjectId = post ? post.user_id : r.kind === "profile" ? r.target_id : null;
        return { ...r, reporterName: name[r.reporter_id] || "Former member", subjectId, subjectName: subjectId ? name[subjectId] || "Former member" : "", postGone: r.kind === "post" && !post, preview: post ? post.text : r.snapshot };
      }),
      feedback: feedback.map((f) => ({ ...f, name: name[f.user_id] || "Former member" })),
      apps: apps.map((a) => ({ ...a, name: name[a.user_id] || "Former member" })),
    };
  },
  resolveReport: (id) => ok(supabase.from("reports").update({ status: "resolved" }).eq("id", id)),
  removePost: (id) => ok(supabase.from("posts").delete().eq("id", id)),
  removeMember: (id) => ok(supabase.rpc("admin_remove_member", { p_id: id })),
  doneFeedback: (id) => ok(supabase.from("feedback").update({ status: "done" }).eq("id", id)),
  reviewApp: (id, approve) => ok(supabase.rpc("review_mentor_application", { p_id: id, p_approve: approve })),
  setCodeActive: (code, active) => ok(supabase.from("invite_codes").update({ active }).eq("code", code)),
  addCode: (code, note) => ok(supabase.from("invite_codes").insert({ code: code.trim().toUpperCase(), note })),
  publishArticle: (a) => ok(supabase.from("articles").insert({ title: a.title, category: a.category, read_min: a.read, excerpt: a.excerpt, author_label: a.author, role_label: a.role, blocks: a.blocks, is_sample: false })),
  deleteArticle: (id) => ok(supabase.from("articles").delete().eq("id", id)),
};
