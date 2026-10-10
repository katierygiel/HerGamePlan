/** In-memory stand-in for src/api/supa.js so the whole UI can be tested without a network. */
const vi = { fn: (f) => f };

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

/* ---- rich sample data for screenshots (?as=admin|new|out) ---- */
const q = new URLSearchParams(location.search);
const as = q.get("as") || "member";
const now = Date.now();
const d = (h) => now - h * 3600e3;
const goal = (id, term, title, steps, extra = {}) => ({ id, term, title, isPublic: true, ts: d(50), completedAt: null, cheers: [], comments: [], steps: steps.map(([label, done], i) => ({ id: `${id}${i}`, label, done })), ...extra });
if (as === "out") { reset(makeDb(), { signedIn: false }); }
else if (as === "new") { reset(makeDb({ me: { onboarded: false, interests: [], role: "", headline: "" } })); }
else {
  reset(makeDb({
    me: { isAdmin: as === "admin", interests: ["Design", "Branding", "Social Media"], headline: "Brand designer · class of 2025" },
    people: [
      person("u2", "Maria Lopez", { headline: "Senior, Sport Management", role: "Student", goals: [goal("g2", "short", "Apply to 5 marketing internships", [["Update resume", true], ["Draft cover letter", true], ["Apply to 3 teams", false]], { cheers: ["u3"] })] }),
      person("u3", "Nina Torres", { headline: "Brand Designer", role: "Design & Creative", mentor: true, field: "Design", capacity: "Open to 2 mentees", expertise: ["Design", "Branding", "Illustration"], bio: "Designing for sports brands." }),
      person("u4", "Rachel Kim", { headline: "Team Operations Coordinator", role: "Operations & Management" }),
    ],
    goals: [
      goal("g1", "short", "Apply to 2 jobs today", [["Update portfolio", true], ["Send two applications", false]], { isPublic: false }),
      goal("g3", "long", "Redesign my portfolio", [["Audit current work", true], ["Write 3 case studies", true], ["Rebuild in Figma", false], ["Launch and share", false]], { cheers: ["u2", "u3"], comments: [{ id: "c1", authorId: "u3", text: "Case studies are what get you interviews!", ts: d(5) }] }),
    ],
    articles: [sampleArticle({ id: "a1", cat: "Wellness", title: "Balancing Work and Wellness: Self-Care Tips for Women in Sports Careers", read: 5 }), sampleArticle({ id: "a2", cat: "Branding", title: "Building a Personal Brand in Sports" })],
    posts: [
      { id: "p1", authorId: "u2", type: "win", ts: d(3), text: "Just got an interview with a pro women's soccer club for their marketing internship!", likes: ["u3", "me"], comments: [{ id: "pc1", authorId: "u3", text: "So proud of you!", ts: d(2) }] },
      { id: "p2", authorId: "u4", type: "event", ts: d(9), text: "Hosting a free virtual meetup for women starting out in sports ops.", event: { when: "Thu, Oct 16 · 7 PM ET", where: "Virtual" }, likes: [], comments: [] },
    ],
    conversations: [{ id: "c_u3", userId: "u3", unread: 1, messages: [{ id: "m1", from: "me", text: "Hi Nina! Loved your portfolio talk.", ts: d(26) }, { id: "m2", from: "u3", text: "Thank you! Happy to chat any time this week.", ts: d(2) }] }],
    notifications: [
      { id: "n1", kind: "cheer", text: "Nina Torres cheered on your goal “Redesign my portfolio”", ts: d(3), read: false, to: { name: "goals" } },
      { id: "n2", kind: "message", text: "Nina Torres sent you a message", ts: d(2), read: false, to: { name: "connect" } },
    ],
    activity: [new Date(now).toISOString().slice(0, 10), new Date(now - 864e5).toISOString().slice(0, 10)],
    bookmarks: ["a1"],
  }));
}
