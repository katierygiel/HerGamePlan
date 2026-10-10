/** In-memory stand-in for src/api/supa.js so the whole UI can be tested without a network. */
import { vi } from "vitest";

const H = 3600e3;
export const server = { db: null, session: null, listeners: [], live: null, inviteOk: (c) => c.trim().toUpperCase() === "PLAYMAKER26", failNext: null, adminData: null };
export const calls = { remote: [], auth: [], admin: [] };

export function makeDb(over = {}) {
  const base = {
    v: 2,
    session: { signedIn: true, userId: "u-me", email: "katie@example.com" },
    me: { id: "me", userId: "u-me", email: "katie@example.com", firstName: "Katie", lastName: "Rygiel", role: "Design & Creative", headline: "Brand designer", bio: "", city: "", state: "", phone: "", portfolio: "", resume: "", photo: null, interests: ["Design"], onboarded: true, isAdmin: false, mentor: false, field: "", capacity: "", expertise: [], years: 0 },
    settings: { notifications: true },
    people: [],
    goals: [], articles: [], bookmarks: [], posts: [], conversations: [], mentorRequests: [], incomingRequests: [], mentorApp: null,
    connections: [], blocked: [], notifications: [], activity: [], jobsInterest: null,
  };
  return { ...base, ...over, me: { ...base.me, ...(over.me || {}) } };
}
export const person = (id, name, extra = {}) => ({ id, name, firstName: name.split(" ")[0], lastName: name.split(" ")[1] || "", headline: "Sports marketing", role: "Marketing & Sponsorship", bio: "", city: "Austin", state: "TX", photo: null, years: 0, interests: ["Marketing"], mentor: false, field: "", capacity: "", expertise: [], goals: [], ...extra });
export const sampleArticle = (over = {}) => ({
  id: "a-1", cat: "Career", read: 4, photo: null, title: "From Fan to Pro", author: "Concept sample", role: "Example article written to show the format, not by a real professional",
  excerpt: "How to turn a love of sports into a career.", blocks: [{ h: "Map the roles", p: "Most entry points live behind the scenes." }], isSample: true, ts: Date.now(), comments: [], ...over,
});

export function reset(db = makeDb(), { signedIn = true } = {}) {
  server.db = db;
  server.session = signedIn ? { user: { id: "u-me" } } : null;
  server.listeners = [];
  server.failNext = null;
  server.adminData = null;
  calls.remote = []; calls.auth = []; calls.admin = [];
}

const emit = (event, session) => server.listeners.forEach((l) => l(event, session));
export const pushLive = () => server.live && server.live();

/* ---- the same exports as src/api/supa.js ---- */
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: server.session } }),
    onAuthStateChange: (cb) => { server.listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
  },
};
export const hydrate = vi.fn(async () => JSON.parse(JSON.stringify(server.db)));
export const markActive = vi.fn(async () => {});
export const subscribeLive = (cb) => { server.live = cb; return () => { server.live = null; }; };

const record = (name) => vi.fn(async (payload) => {
  calls.remote.push({ op: name, payload });
  if (server.failNext === name) { server.failNext = null; throw new Error("network down"); }
});
const OPS = ["updateMe", "completeOnboarding", "setSetting", "toggleConnect", "blockUser", "unblockUser", "report", "addGoal", "updateGoal", "deleteGoal", "addStep", "removeStep", "toggleStep", "adjustGoal", "cheerGoal", "commentGoal", "toggleBookmark", "commentArticle", "createPost", "deletePost", "likePost", "commentPost", "sendMessage", "markRead", "requestMentor", "cancelMentorRequest", "answerRequest", "applyMentor", "readNotification", "readAllNotifications", "saveJobsInterest", "clearJobsInterest", "sendFeedback"];
export const remote = Object.fromEntries(OPS.map((o) => [o, record(o)]));

export const authApi = {
  checkInvite: vi.fn(async (c) => server.inviteOk(c)),
  signUp: vi.fn(async (p) => {
    calls.auth.push({ op: "signUp", ...p });
    server.db = makeDb({ me: { firstName: p.firstName, lastName: p.lastName, email: p.email, onboarded: false, interests: [], role: "", headline: "" } });
    server.session = { user: { id: "u-me" } };
    setTimeout(() => emit("SIGNED_IN", server.session), 0);
    return { needsConfirm: false };
  }),
  signIn: vi.fn(async ({ email, password }) => {
    calls.auth.push({ op: "signIn", email });
    if (password !== "playbook123") throw new Error("Invalid login credentials");
    server.session = { user: { id: "u-me" } };
    setTimeout(() => emit("SIGNED_IN", server.session), 0);
  }),
  signOut: vi.fn(async () => { calls.auth.push({ op: "signOut" }); server.session = null; emit("SIGNED_OUT", null); }),
  sendReset: vi.fn(async (email) => { calls.auth.push({ op: "sendReset", email }); }),
  setPassword: vi.fn(async () => {}),
};
export function niceError(e) {
  const m = String(e?.message || e || "");
  if (/Invalid login credentials/i.test(m)) return "Email or password is incorrect.";
  return m;
}
export const exportMyData = vi.fn(async () => ({ exportedAt: "now", profile: [] }));
export const deleteMyAccount = vi.fn(async () => { calls.auth.push({ op: "delete" }); server.session = null; emit("SIGNED_OUT", null); });

export const admin = {
  load: vi.fn(async () => server.adminData || {
    stats: { members: 7, new_7d: 3, active_7d: 5, goals: 12, public_goals: 4, posts: 9, messages: 30, mentors: 1, mentor_requests: 2, jobs_interest: 6, invite_uses: 7, feedback_new: 1 },
    members: [], codes: [{ code: "PLAYMAKER26", active: true, uses: 7, note: "Launch test group" }], roleCounts: { "Design & Creative": 4 }, articles: [],
    reports: [], feedback: [], apps: [],
  }),
  resolveReport: vi.fn(async (id) => { calls.admin.push({ op: "resolveReport", id }); }),
  removePost: vi.fn(async (id) => { calls.admin.push({ op: "removePost", id }); }),
  removeMember: vi.fn(async (id) => { calls.admin.push({ op: "removeMember", id }); }),
  doneFeedback: vi.fn(async (id) => { calls.admin.push({ op: "doneFeedback", id }); }),
  reviewApp: vi.fn(async (id, approve) => { calls.admin.push({ op: "reviewApp", id, approve }); }),
  setCodeActive: vi.fn(async (code, active) => { calls.admin.push({ op: "setCodeActive", code, active }); }),
  addCode: vi.fn(async (code) => { calls.admin.push({ op: "addCode", code }); }),
  publishArticle: vi.fn(async (a) => { calls.admin.push({ op: "publishArticle", a }); }),
  deleteArticle: vi.fn(async (id) => { calls.admin.push({ op: "deleteArticle", id }); }),
};
