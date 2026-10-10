import { render, screen, within, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import App from "../src/App";
import { calls, makeDb, person, pushLive, reset, sampleArticle, server, admin as adminApi, authApi, deleteMyAccount } from "./fakeSupa";

vi.mock("../src/api/supa", async () => await import("./fakeSupa.js"));

const LONG = { timeout: 8000 };
const nav = (u, name) => u.click(screen.getByRole("button", { name }));
const last = (op) => calls.remote.filter((c) => c.op === op).slice(-1)[0];

async function boot(db = makeDb(), opts) {
  reset(db, opts);
  const u = userEvent.setup();
  const view = render(<App />);
  return { u, view };
}
async function home(db) {
  const ctx = await boot(db);
  await screen.findByRole("heading", { name: /Welcome, Katie/i }, LONG);
  return ctx;
}

describe("entry flow", () => {
  it("shows the welcome screen with the real logo and no demo mode", async () => {
    await boot(makeDb(), { signedIn: false });
    await screen.findByText(/Women in Sports Leading The Way/i, {}, LONG);
    expect(screen.getAllByAltText("Her Game Plan").length).toBeGreaterThan(0);
    expect(screen.queryByText(/demo/i)).toBeNull();
  });

  it("requires a valid invite code, then onboards a new member", async () => {
    const { u } = await boot(makeDb(), { signedIn: false });
    await u.click(await screen.findByRole("button", { name: /Get started/i }, LONG));
    await u.click(screen.getByRole("button", { name: /Create account/i }));
    expect(await screen.findByText("Enter your invite code")).toBeInTheDocument();
    expect(screen.getByText("Enter your first name")).toBeInTheDocument();

    await u.type(screen.getByLabelText("Invite code"), "WRONGCODE");
    await u.type(screen.getByLabelText("First name"), "Katie");
    await u.type(screen.getByLabelText("Last name"), "Rygiel");
    await u.type(screen.getByLabelText("Email"), "katie@example.com");
    await u.type(screen.getByLabelText("Password"), "short");
    await u.click(screen.getByRole("checkbox"));
    await u.click(screen.getByRole("button", { name: /Create account/i }));
    expect(await screen.findByText("Use at least 8 characters")).toBeInTheDocument();

    await u.clear(screen.getByLabelText("Password"));
    await u.type(screen.getByLabelText("Password"), "playbook123");
    await u.click(screen.getByRole("button", { name: /Create account/i }));
    expect(await screen.findByText("That invite code isn't valid.")).toBeInTheDocument();
    expect(authApi.signUp).not.toHaveBeenCalled();

    await u.clear(screen.getByLabelText("Invite code"));
    await u.type(screen.getByLabelText("Invite code"), "playmaker26");
    await u.click(screen.getByRole("button", { name: /Create account/i }));
    expect(authApi.signUp).toHaveBeenCalledWith(expect.objectContaining({ inviteCode: "PLAYMAKER26", email: "katie@example.com" }));

    await screen.findByRole("heading", { name: /What's your role/i }, LONG);
    await u.click(screen.getByRole("button", { name: /Design & Creative/i }));
    await u.click(screen.getByRole("button", { name: /Continue/i }));
    await u.click(screen.getByRole("button", { name: "Branding" }));
    await u.click(screen.getByRole("button", { name: /Continue/i }));
    await u.type(screen.getByLabelText("Headline"), "Brand designer");
    await u.click(screen.getByRole("button", { name: /^Finish$/i }));
    expect(last("completeOnboarding").payload).toMatchObject({ role: "Design & Creative", interests: ["Branding"], headline: "Brand designer" });
    await screen.findByRole("heading", { name: /Welcome, Katie/i });
    expect(screen.getAllByText(/Add one/i).length).toBe(2);
  });

  it("rejects bad credentials and signs in with good ones", async () => {
    const { u } = await boot(makeDb(), { signedIn: false });
    await u.click(await screen.findByRole("button", { name: "Sign in" }, LONG));
    await u.type(screen.getByLabelText("Email"), "katie@example.com");
    await u.type(screen.getByLabelText("Password"), "wrongpass1");
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Email or password is incorrect.")).toBeInTheDocument();
    await u.clear(screen.getByLabelText("Password"));
    await u.type(screen.getByLabelText("Password"), "playbook123");
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("heading", { name: /Welcome, Katie/i }, LONG);
  });

  it("sends a password reset link", async () => {
    const { u } = await boot(makeDb(), { signedIn: false });
    await u.click(await screen.findByRole("button", { name: "Sign in" }, LONG));
    await u.click(screen.getByRole("button", { name: /Forgot password/i }));
    await u.type(screen.getByLabelText("Email"), "katie@example.com");
    await u.click(screen.getByRole("button", { name: /Send reset link/i }));
    expect(await screen.findByText(/reset link is on its way/i)).toBeInTheDocument();
    expect(calls.auth.find((c) => c.op === "sendReset").email).toBe("katie@example.com");
  });
});

describe("home", () => {
  it("is honest and empty for a new member: no jobs, no fake people", async () => {
    await home();
    expect(screen.getByText(/Be the first to post/i)).toBeInTheDocument();
    expect(screen.queryByText(/Jobs:/i)).toBeNull();
    expect(screen.getByText(/Concept sample/i)).toBeInTheDocument();
  });

  it("shows my goals and the latest community post", async () => {
    const db = makeDb({
      people: [person("u-2", "Maria Lopez")],
      posts: [{ id: "p1", authorId: "u-2", type: "win", ts: Date.now() - 3600e3, text: "Got an interview!", likes: [], comments: [] }],
      goals: [{ id: "g1", term: "short", title: "Apply to 2 jobs", isPublic: false, ts: Date.now(), completedAt: null, cheers: [], comments: [], steps: [{ id: "s1", label: "One", done: true }, { id: "s2", label: "Two", done: false }] }],
    });
    await home(db);
    expect(screen.getByText("Apply to 2 jobs")).toBeInTheDocument();
    expect(screen.getByText("Maria Lopez")).toBeInTheDocument();
    expect(screen.getByText("Got an interview!")).toBeInTheDocument();
  });
});

describe("goals", () => {
  it("creates a goal with steps, saves it, checks it off and completes it", async () => {
    const { u } = await home();
    await nav(u, "Goals");
    await u.click(screen.getByRole("button", { name: "New goal" }));
    await u.type(screen.getByLabelText(/What do you want to achieve/i), "Update my portfolio");
    await u.type(screen.getByPlaceholderText("Add a step"), "Pick projects");
    await u.click(screen.getByRole("button", { name: "Add" }));
    await u.click(screen.getByRole("button", { name: /^Create goal$/i }));
    await screen.findByRole("heading", { name: "Update my portfolio" });
    expect(last("addGoal").payload).toMatchObject({ term: "short", title: "Update my portfolio", steps: ["Pick projects"], isPublic: false });

    await u.click(screen.getByRole("button", { name: /Check Pick projects/i }));
    expect(last("toggleStep")).toBeTruthy();
    expect(await screen.findByText(/Goal complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
  });

  it("makes a goal public and lets another member cheer and comment", async () => {
    const db = makeDb({
      people: [person("u-2", "Nina Torres", { goals: [{ id: "g9", term: "long", title: "Redesign my portfolio", isPublic: true, ts: Date.now(), completedAt: null, cheers: [], comments: [], steps: [{ id: "x", label: "Audit", done: true }] }] })],
    });
    const { u } = await home(db);
    await nav(u, "Goals");
    await u.click(screen.getByRole("tab", { name: /Community/i }));
    await u.click(await screen.findByRole("button", { name: /Cheer · 0/i }));
    expect(last("cheerGoal").payload).toEqual({ id: "g9" });
    await u.click(screen.getByRole("button", { name: /Discuss/i }));
    await screen.findByRole("heading", { name: /Goal support/i });
    await u.type(screen.getByPlaceholderText(/Send encouragement/i), "You've got this!");
    await u.click(screen.getByRole("button", { name: "Send" }));
    expect(last("commentGoal").payload).toMatchObject({ id: "g9", text: "You've got this!" });
    expect(await screen.findByText("You've got this!")).toBeInTheDocument();
  });
});

describe("jobs (coming soon)", () => {
  it("collects interest by role and lets the member leave the list", async () => {
    const { u } = await home();
    await nav(u, "Jobs");
    await screen.findByText(/The women's sports job board/i);
    expect(screen.getByText("COMING SOON")).toBeInTheDocument();
    expect(screen.queryByText(/Apply now/i)).toBeNull();
    await u.click(screen.getByRole("button", { name: /Design & Creative/i }));
    await u.click(screen.getByRole("button", { name: /Remote Roles/i }));
    await u.click(screen.getByRole("button", { name: /Notify me/i }));
    expect(last("saveJobsInterest").payload).toEqual({ roles: ["Design & Creative", "Remote Roles"] });
    expect((await screen.findAllByText(/You're on the list/i)).length).toBeGreaterThan(0);
    await u.click(screen.getByRole("button", { name: /Remove me/i }));
    expect(last("clearJobsInterest")).toBeTruthy();
    expect(await screen.findByRole("button", { name: /Notify me/i })).toBeInTheDocument();
  });

  it("lets a member tell us about an employer", async () => {
    const { u } = await home();
    await nav(u, "Jobs");
    await u.click(await screen.findByRole("button", { name: "Tell us" }));
    const box = await screen.findByPlaceholderText("Type here…");
    await u.type(box, "Courtside Collective is hiring");
    await u.click(screen.getByRole("button", { name: "Send" }));
    expect(last("sendFeedback").payload).toMatchObject({ kind: "other" });
    expect(last("sendFeedback").payload.text).toContain("Courtside Collective");
  });
});

describe("community + messages", () => {
  it("posts, likes and comments, saving each to the database", async () => {
    const { u } = await home();
    await nav(u, "Connect");
    await u.click(screen.getByRole("button", { name: "New post" }));
    await u.click(screen.getByRole("button", { name: "Win", hidden: false }));
    await u.type(screen.getByPlaceholderText(/Celebrate something/i), "Finished my portfolio!");
    await u.click(screen.getByRole("button", { name: /^Post$/i }));
    expect(last("createPost").payload.post).toMatchObject({ type: "win", text: "Finished my portfolio!" });
    expect(await screen.findByText("Finished my portfolio!")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Like \(0\)/i }));
    expect(last("likePost")).toBeTruthy();
    await u.click(screen.getByRole("button", { name: /Comments \(0\)/i }));
    await u.type(screen.getByPlaceholderText("Add a comment…"), "Thanks all");
    await u.click(screen.getByRole("button", { name: "Send" }));
    expect(last("commentPost").payload).toMatchObject({ text: "Thanks all" });
  });

  it("starts a conversation, sends a message, and receives a live reply", async () => {
    const db = makeDb({ people: [person("u-2", "Maria Lopez")] });
    const { u } = await home(db);
    await nav(u, "Connect");
    await u.click(screen.getByRole("tab", { name: /Messages/i }));
    await u.click(screen.getByRole("button", { name: "New message" }));
    await u.click(await screen.findByRole("button", { name: /Maria Lopez/ }));
    await screen.findByRole("heading", { name: /Maria Lopez/i });
    await u.type(screen.getByPlaceholderText(/Message Maria/i), "Hi Maria!");
    await u.click(screen.getByRole("button", { name: "Send" }));
    expect(last("sendMessage").payload).toMatchObject({ userId: "u-2", text: "Hi Maria!" });
    expect(await screen.findByText("Hi Maria!")).toBeInTheDocument();

    // the other person replies: the server changes, realtime fires, the chat updates on its own
    const mine = { id: "m1", from: "me", text: "Hi Maria!", ts: Date.now() - 1000 };
    server.db = { ...server.db, conversations: [{ id: "c_u-2", userId: "u-2", unread: 1, messages: [mine, { id: "m2", from: "u-2", text: "Hey Katie, welcome!", ts: Date.now() }] }] };
    act(() => pushLive());
    expect(await screen.findByText("Hey Katie, welcome!", {}, LONG)).toBeInTheDocument();
  });

  it("reports and blocks from a post, saving to the database", async () => {
    const db = makeDb({ people: [person("u-2", "Maria Lopez")], posts: [{ id: "p1", authorId: "u-2", type: "update", ts: Date.now(), text: "Spammy post", likes: [], comments: [] }] });
    const { u } = await home(db);
    await nav(u, "Connect");
    await u.click(screen.getByRole("tab", { name: /Feed/i }));
    await u.click(await screen.findByRole("button", { name: "More options" }));
    await u.click(screen.getByRole("button", { name: /Report post/i }));
    await u.click(screen.getByRole("button", { name: "Spam or scam" }));
    expect(last("report").payload).toMatchObject({ kind: "post", id: "p1", reason: "Spam or scam", snapshot: "Spammy post" });
    await u.click(screen.getByRole("button", { name: "More options" }));
    await u.click(screen.getByRole("button", { name: /Block Maria/i }));
    await u.click(screen.getByRole("button", { name: /^Block$/ }));
    expect(last("blockUser").payload).toEqual({ id: "u-2" });
    await waitFor(() => expect(screen.queryByText("Spammy post")).toBeNull());
  });
});

describe("mentors", () => {
  it("shows an honest empty state and lets a member apply to mentor", async () => {
    const { u } = await home();
    await nav(u, "Connect");
    await u.click(screen.getByRole("tab", { name: /Mentors/i }));
    expect(await screen.findByText(/Mentors are joining soon/i)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Apply to mentor/i }));
    await screen.findByRole("heading", { name: /Mentor application/i });
    await u.click(screen.getByRole("button", { name: /Submit application/i }));
    expect(await screen.findByText(/Tell us your field/i)).toBeInTheDocument();
    await u.type(screen.getByLabelText("Your field"), "Design");
    await u.click(screen.getByRole("button", { name: "Branding" }));
    await u.type(screen.getByLabelText(/About your experience/i), "Five years designing for sports brands and teams.");
    await u.click(screen.getByRole("button", { name: /Submit application/i }));
    expect(last("applyMentor").payload.app).toMatchObject({ field: "Design", expertise: ["Branding"], capacity: "Open to 1 mentee" });
    await screen.findByRole("heading", { name: /Connect/i });
  });

  it("requests an approved mentor", async () => {
    const db = makeDb({ people: [person("u-3", "Nina Torres", { mentor: true, field: "Design", capacity: "Open to 2 mentees", expertise: ["Design", "Branding"], headline: "Brand designer" })] });
    const { u } = await home(db);
    await nav(u, "Connect");
    await u.click(screen.getByRole("tab", { name: /Mentors/i }));
    await u.click(await screen.findByRole("button", { name: /Request mentorship/i }));
    await u.type(screen.getByPlaceholderText(/Hi! I'm/i), "Would love portfolio feedback.");
    await u.click(screen.getByRole("button", { name: /Send request/i }));
    expect(last("requestMentor").payload).toMatchObject({ mentorId: "u-3", message: "Would love portfolio feedback." });
    expect(await screen.findByText(/Request pending/i)).toBeInTheDocument();
  });

  it("lets an approved mentor accept an incoming request", async () => {
    const db = makeDb({
      me: { mentor: true, capacity: "Open to 2 mentees" },
      people: [person("u-2", "Maria Lopez")],
      incomingRequests: [{ id: "r1", menteeId: "u-2", message: "Can you review my resume?", status: "pending", ts: Date.now() }],
    });
    const { u } = await home(db);
    await nav(u, "Connect");
    await u.click(screen.getByRole("tab", { name: /Mentors/i }));
    expect(await screen.findByText("Can you review my resume?")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Accept/i }));
    expect(last("answerRequest").payload).toEqual({ id: "r1", status: "accepted" });
    expect(await screen.findByRole("button", { name: /Message Maria/i })).toBeInTheDocument();
  });
});

describe("tips and notifications", () => {
  it("labels sample content and supports bookmarks and discussion", async () => {
    const db = makeDb({ articles: [sampleArticle()] });
    const { u } = await home(db);
    await nav(u, "Tips");
    await screen.findByText("From Fan to Pro");
    expect(screen.getAllByText(/Concept sample/i).length).toBeGreaterThan(1);
    await u.click(screen.getByRole("button", { name: /Bookmark article/i }));
    expect(last("toggleBookmark").payload).toEqual({ id: "a-1" });
    await u.click(screen.getByText("From Fan to Pro"));
    await screen.findByText("Map the roles");
    await u.click(screen.getByRole("button", { name: /Open discussion/i }));
    await u.type(screen.getByPlaceholderText(/Share your thoughts/i), "Helpful!");
    await u.click(screen.getByRole("button", { name: "Send" }));
    expect(last("commentArticle").payload).toMatchObject({ id: "a-1", text: "Helpful!" });
  });

  it("opens a notification's target and marks it read", async () => {
    const db = makeDb({
      people: [person("u-2", "Maria Lopez")],
      notifications: [{ id: "n1", kind: "message", text: "Maria Lopez sent you a message", ts: Date.now(), read: false, to: { name: "chat", params: { userId: "u-2" } } }],
    });
    const { u } = await home(db);
    await u.click(screen.getByRole("button", { name: "Notifications" }));
    await u.click(await screen.findByText("Maria Lopez sent you a message"));
    expect(last("readNotification").payload).toEqual({ id: "n1" });
    await screen.findByRole("heading", { name: /Maria Lopez/i });
  });

  it("supports the back button after opening a screen", async () => {
    const { u } = await home();
    await u.click(screen.getByRole("button", { name: "My profile" }));
    await screen.findByRole("heading", { name: /My profile/i });
    await u.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /Welcome, Katie/i })).toBeInTheDocument());
  });
});

describe("settings and account", () => {
  const openSettings = async (u) => {
    await u.click(screen.getByRole("button", { name: "My profile" }));
    await u.click(await screen.findByRole("button", { name: "Settings" }));
    await screen.findByRole("heading", { name: /^Settings$/i });
  };

  it("edits the profile and saves it", async () => {
    const { u } = await home();
    await u.click(screen.getByRole("button", { name: "My profile" }));
    await u.click(await screen.findByRole("button", { name: /Edit profile/i }));
    await u.clear(screen.getByLabelText("Headline"));
    await u.type(screen.getByLabelText("Headline"), "Designer for women's sports");
    await u.click(screen.getByRole("button", { name: /Save changes/i }));
    expect(last("updateMe").payload).toMatchObject({ headline: "Designer for women's sports", firstName: "Katie" });
    expect(await screen.findByText("Designer for women's sports")).toBeInTheDocument();
  });

  it("toggles alerts, sends feedback, hides admin tools from non-admins", async () => {
    const { u } = await home();
    await openSettings(u);
    expect(screen.queryByText(/Admin dashboard/i)).toBeNull();
    const sw = screen.getByRole("switch", { name: /In-app alerts/i });
    await u.click(sw);
    expect(last("setSetting").payload).toEqual({ key: "notifications", value: false });
    await u.click(screen.getByRole("button", { name: /Send feedback/i }));
    await u.type(await screen.findByPlaceholderText("Type here…"), "Love the goals tab");
    await u.click(screen.getByRole("button", { name: "Send" }));
    expect(last("sendFeedback").payload).toEqual({ kind: "idea", text: "Love the goals tab" });
  });

  it("deletes the account only after confirmation and returns to the welcome screen", async () => {
    const { u } = await home();
    await openSettings(u);
    await u.click(screen.getByRole("button", { name: /Delete my account/i }));
    expect(deleteMyAccount).not.toHaveBeenCalled();
    await u.click(await screen.findByRole("button", { name: /Delete everything/i }));
    await waitFor(() => expect(deleteMyAccount).toHaveBeenCalled());
    await screen.findByText(/Women in Sports Leading The Way/i, {}, LONG);
  });

  it("signs out", async () => {
    const { u } = await home();
    await openSettings(u);
    await u.click(screen.getByRole("button", { name: /Sign out/i }));
    await screen.findByText(/Women in Sports Leading The Way/i, {}, LONG);
  });
});

describe("admin", () => {
  it("shows the dashboard to admins and lets them approve a mentor", async () => {
    server.adminData = null;
    const { u } = await boot(makeDb({ me: { isAdmin: true } }));
    await screen.findByRole("heading", { name: /Welcome, Katie/i }, LONG);
    server.adminData = {
      stats: { members: 7, new_7d: 3, active_7d: 5, goals: 12, public_goals: 4, posts: 9, messages: 30, mentors: 1, mentor_requests: 2, jobs_interest: 6, invite_uses: 7, feedback_new: 1 },
      members: [], codes: [{ code: "PLAYMAKER26", active: true, uses: 7, note: "" }], roleCounts: { "Design & Creative": 4 }, articles: [],
      reports: [{ id: "rp1", kind: "post", target_id: "p1", status: "open", reason: "Spam or scam", reporterName: "Maria Lopez", subjectName: "Bot", subjectId: "u-9", postGone: false, preview: "Buy followers", created_at: new Date().toISOString() }],
      feedback: [{ id: "f1", kind: "idea", text: "Add dark mode", status: "new", name: "Maria Lopez", created_at: new Date().toISOString() }],
      apps: [{ id: "ap1", name: "Nina Torres", field: "Design", capacity: "Open to 2 mentees", expertise: ["Branding"], why: "Seven years in sports design.", status: "pending", created_at: new Date().toISOString() }],
    };
    await u.click(screen.getByRole("button", { name: "My profile" }));
    await u.click(await screen.findByRole("button", { name: "Settings" }));
    await u.click(await screen.findByRole("button", { name: /Admin dashboard/i }));
    await screen.findByRole("tab", { name: /Overview/i });
    expect(screen.getByText("PLAYMAKER26")).toBeInTheDocument();
    expect(screen.getByText("Design & Creative")).toBeInTheDocument();

    await u.click(screen.getByRole("tab", { name: /Mentors/i }));
    expect(await screen.findByText("Seven years in sports design.")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(adminApi.reviewApp).toHaveBeenCalledWith("ap1", true));

    await u.click(screen.getByRole("tab", { name: /Reports/i }));
    expect(await screen.findByText("Buy followers")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Remove post/i }));
    await waitFor(() => expect(adminApi.removePost).toHaveBeenCalledWith("p1"));

    await u.click(screen.getByRole("tab", { name: /Feedback/i }));
    expect(await screen.findByText("Add dark mode")).toBeInTheDocument();
  });
});

describe("reliability", () => {
  it("tells the member when a save fails", async () => {
    const { u } = await home();
    await nav(u, "Jobs");
    await u.click(await screen.findByRole("button", { name: /Design & Creative/i }));
    server.failNext = "saveJobsInterest";
    await u.click(screen.getByRole("button", { name: /Notify me/i }));
    expect(await screen.findByText(/Couldn't save that/i)).toBeInTheDocument();
  });
});
