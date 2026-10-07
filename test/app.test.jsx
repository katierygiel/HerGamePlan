import { render, screen, within, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";

const LONG = { timeout: 9000 };

async function boot() {
  const u = userEvent.setup();
  const view = render(<App />);
  await screen.findByText(/Explore the demo/i, {}, { timeout: 4000 });
  return { u, view };
}
async function demo() {
  const ctx = await boot();
  await ctx.u.click(screen.getByText(/Explore the demo/i));
  await screen.findByRole("heading", { name: /Welcome, Emma/i });
  return ctx;
}
const nav = (u, name) => u.click(screen.getByRole("button", { name }));

describe("entry flow", () => {
  it("boots to the welcome screen with the real logo", async () => {
    await boot();
    expect(screen.getAllByAltText("Her Game Plan").length).toBeGreaterThan(0);
    expect(screen.getByText(/Women in Sports Leading The Way/i)).toBeInTheDocument();
  });

  it("validates sign up, creates an account, and walks through onboarding", async () => {
    const { u } = await boot();
    await u.click(screen.getByRole("button", { name: /Get started/i }));
    await u.click(screen.getByRole("button", { name: /Create account/i }));
    expect(await screen.findByText(/Please fill out all fields/i)).toBeInTheDocument();
    expect(screen.getByText("Enter your first name")).toBeInTheDocument();
    expect(screen.getByText("Please agree to continue")).toBeInTheDocument();

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

    await screen.findByRole("heading", { name: /What's your role/i });
    expect(screen.getByRole("button", { name: /Continue/i })).toBeDisabled();
    await u.click(screen.getByRole("button", { name: /Design & Creative/i }));
    await u.click(screen.getByRole("button", { name: /Continue/i }));
    await screen.findByRole("heading", { name: /Pick your interests/i });
    await u.click(screen.getByRole("button", { name: "Design" }));
    await u.click(screen.getByRole("button", { name: "Branding" }));
    await u.click(screen.getByRole("button", { name: /Continue/i }));
    await screen.findByRole("heading", { name: /Make it yours/i });
    await u.type(screen.getByLabelText("Headline"), "Brand designer");
    await u.click(screen.getByRole("button", { name: /^Finish$/i }));
    await screen.findByRole("heading", { name: /Welcome, Katie/i });
    // a brand-new account starts with empty goals and a prompt to create one
    expect(screen.getAllByText(/Add one/i).length).toBe(2);
  });

  it("rejects bad credentials and accepts the demo login", async () => {
    const { u } = await boot();
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    await u.type(screen.getByLabelText("Email"), "nobody@example.com");
    await u.type(screen.getByLabelText("Password"), "whatever1");
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Email or password is incorrect.")).toBeInTheDocument();
    await u.click(screen.getByText(/Try the demo account/i));
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("heading", { name: /Welcome, Emma/i });
  });

  it("runs the forgot-password flow: email, code, new password", async () => {
    const { u } = await boot();
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    await u.click(screen.getByRole("button", { name: /Forgot password/i }));
    await u.type(screen.getByLabelText("Email"), "emma@example.com");
    await u.click(screen.getByRole("button", { name: /Send code/i }));
    const hint = await screen.findByText(/Your code is/i);
    const code = hint.textContent.match(/\d{5}/)[0];

    // wrong code first
    for (let i = 1; i <= 5; i++) await u.type(screen.getByLabelText(`Digit ${i}`), "0");
    await u.click(screen.getByRole("button", { name: /^Continue$/i }));
    expect(await screen.findByText(/doesn't match/i)).toBeInTheDocument();
    for (let i = 1; i <= 5; i++) { await u.clear(screen.getByLabelText(`Digit ${i}`)); await u.type(screen.getByLabelText(`Digit ${i}`), code[i - 1]); }
    await u.click(screen.getByRole("button", { name: /^Continue$/i }));
    await u.type(await screen.findByLabelText("New password"), "brandnew123");
    await u.click(screen.getByRole("button", { name: /Save password/i }));
    expect(await screen.findByText(/Password updated/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});

describe("home", () => {
  it("shows goals, video, matched jobs, community and tips", async () => {
    await demo();
    expect(screen.getByText("My goals:")).toBeInTheDocument();
    expect(screen.getByText("Apply to 2 jobs today")).toBeInTheDocument();
    expect(screen.getByText("Complete Capstone Project")).toBeInTheDocument();
    expect(screen.getByText("Suggested for you…")).toBeInTheDocument();
    expect(screen.getAllByText(/% match/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/3-day streak/i)).toBeInTheDocument();
  });

  it("the +/- on the home goal ring updates progress", async () => {
    const { u } = await demo();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /One more step done: Apply to 2 jobs today/i }));
    expect(screen.getByText("✓")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /One fewer step done: Apply to 2 jobs today/i }));
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("opens notifications and navigates to the target", async () => {
    const { u } = await demo();
    await u.click(screen.getByRole("button", { name: /Notifications/i }));
    await screen.findByRole("heading", { name: /^Notifications$/i });
    await u.click(screen.getByText(/Carla Jennings sent you a message/i));
    await screen.findByRole("heading", { name: /Carla Jennings/i });
    expect(screen.getByText(/Would love to see your portfolio/i)).toBeInTheDocument();
  });
});

describe("goals", () => {
  async function goalsTab() {
    const ctx = await demo();
    await nav(ctx.u, "Goals");
    await screen.findByRole("heading", { name: /Reach your goals/i });
    await ctx.u.click(screen.getByRole("tab", { name: /Short term/i }));
    return ctx;
  }

  it("moves progress, completes a goal with celebration, and can undo", async () => {
    const { u } = await goalsTab();
    expect(screen.getByRole("heading", { name: "Apply to 2 jobs today" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Mark one more step done" }));
    expect(await screen.findByText(/Goal complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed just now/i)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Mark one fewer step done" }));
    expect(screen.queryByText(/Completed just now/i)).not.toBeInTheDocument();
  });

  it("checks steps, adds a step, and removes a step", async () => {
    const { u } = await goalsTab();
    await u.click(screen.getByRole("button", { name: /Check Jr. Graphic Designer PHI/i }));
    expect(screen.getByRole("button", { name: /Uncheck Jr. Graphic Designer PHI/i })).toHaveAttribute("aria-pressed", "true");
    await u.type(screen.getByLabelText("Add another step"), "Follow up with recruiters{Enter}");
    expect(screen.getByText("Follow up with recruiters")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Remove Follow up with recruiters/i }));
    expect(screen.queryByText("Follow up with recruiters")).not.toBeInTheDocument();
  });

  it("creates a new goal with steps, then edits and deletes it", async () => {
    const { u } = await goalsTab();
    await u.click(screen.getByRole("button", { name: "New goal" }));
    await screen.findByRole("heading", { name: /^New goal$/i });
    await u.click(screen.getByRole("button", { name: /^Create goal$/i }));
    expect(await screen.findByText("Give your goal a name")).toBeInTheDocument();
    await u.type(screen.getByLabelText(/What do you want to achieve/i), "Message two mentors");
    await u.type(screen.getByLabelText(/Steps \(optional\)/i), "Draft intro note");
    await u.click(screen.getByRole("button", { name: /^Add$/i }));
    await u.click(screen.getByRole("button", { name: /^Create goal$/i }));
    await screen.findByRole("heading", { name: "Message two mentors" });
    expect(screen.getByText("Draft intro note")).toBeInTheDocument();

    await u.click(screen.getByRole("button", { name: /Edit/i }));
    const dlg = screen.getByRole("dialog");
    await u.clear(within(dlg).getByLabelText("Goal"));
    await u.type(within(dlg).getByLabelText("Goal"), "Message three mentors");
    await u.click(within(dlg).getByRole("button", { name: /^Save$/i }));
    await screen.findByRole("heading", { name: "Message three mentors" });

    await u.click(screen.getByRole("button", { name: /Delete/i }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Delete goal/i }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Message three mentors" })).not.toBeInTheDocument());
  });

  it("long-term goals read 'tasks left' and public goals open a support thread", async () => {
    const { u } = await goalsTab();
    await u.click(screen.getByRole("tab", { name: /Long term/i }));
    expect(screen.getByText("TASKS LEFT")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /View discussion/i }));
    await screen.findByRole("heading", { name: /Goal support/i });
    expect(screen.getByText(/the case study is the fun part/i)).toBeInTheDocument();
    await u.type(screen.getByLabelText(/Reply or add an update/i), "Case study draft is done!{Enter}");
    expect(await screen.findByText("Case study draft is done!")).toBeInTheDocument();
  });

  it("lets me cheer on a community goal and comment on it", async () => {
    const { u } = await goalsTab();
    await u.click(screen.getByRole("tab", { name: /Community/i }));
    const card = screen.getByText("Apply to 5 marketing internships").closest("article");
    await u.click(within(card).getByRole("button", { name: /Cheer · 2/i }));
    expect(within(card).getByRole("button", { name: /Cheering · 3/i })).toHaveAttribute("aria-pressed", "true");
    await u.click(within(card).getByRole("button", { name: /Discuss/i }));
    await screen.findByRole("heading", { name: /Goal support/i });
    await u.type(screen.getByLabelText(/Send encouragement/i), "You've got this, Maria!{Enter}");
    expect(await screen.findByText("You've got this, Maria!")).toBeInTheDocument();
  });

  it("makes a private goal public and gets simulated cheers back", async () => {
    const { u } = await goalsTab();
    await u.click(screen.getByRole("switch", { name: /Private goal/i }));
    expect(await screen.findByText(/Goal is public/i)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /View discussion/i }));
    await screen.findByRole("heading", { name: /Goal support/i });
    await waitFor(() => expect(screen.getByText("1 cheer")).toBeInTheDocument(), LONG);
  });
});

describe("jobs", () => {
  async function jobsTab() {
    const ctx = await demo();
    await nav(ctx.u, "Jobs");
    await screen.findByText(/^10 jobs$/i, {}, LONG);
    return ctx;
  }

  it("searches and filters the board", async () => {
    const { u } = await jobsTab();
    await u.type(screen.getByLabelText(/Search roles/i), "motion");
    expect(await screen.findByText(/^1 job$/i)).toBeInTheDocument();
    expect(screen.getAllByText("Motion Graphics Intern").length).toBeGreaterThan(0);
    await u.clear(screen.getByLabelText(/Search roles/i));
    await u.click(screen.getByRole("button", { name: "Filters" }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Internship" }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Show results/i }));
    expect(await screen.findByText(/^2 jobs$/i)).toBeInTheDocument();
  });

  it("adds and removes interests, which changes match scores", async () => {
    const { u } = await jobsTab();
    await u.click(screen.getByRole("button", { name: /Add more interests/i }));
    const dlg = screen.getByRole("dialog");
    await u.click(within(dlg).getByRole("button", { name: "Marketing" }));
    expect(within(dlg).getAllByText("Marketing").length).toBe(1);
    await u.click(within(dlg).getByRole("button", { name: /Marketing/ }));
    await u.click(within(dlg).getByRole("button", { name: /^Done$/i }));
  });

  it("saves a job and finds it under Saved", async () => {
    const { u } = await jobsTab();
    const card = screen.getAllByText("Graphic Designer")[0].closest("article");
    await u.click(within(card).getByRole("button", { name: /^Save$/ }));
    expect(await screen.findByText(/Job saved/i)).toBeInTheDocument();
    await u.click(screen.getByRole("tab", { name: /Saved/i }));
    expect(screen.getAllByText("Graphic Designer").length).toBeGreaterThan(0);
  });

  it("applies end to end and tracks the application through stages", async () => {
    const { u } = await jobsTab();
    await u.type(screen.getByLabelText(/Search roles/i), "Digital Design Assistant");
    await u.click(await screen.findByRole("heading", { name: "Digital Design Assistant" }));
    await screen.findByRole("heading", { name: /Job details/i });
    expect(screen.getByText(/About the role/i)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Apply now/i }));
    await screen.findByRole("heading", { name: /^Apply$/i });
    // validation: clear email
    await u.clear(screen.getByLabelText("Email"));
    await u.click(screen.getByRole("button", { name: /Submit application/i }));
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    await u.type(screen.getByLabelText("Email"), "emma@emmagraphics.com");
    await u.click(screen.getByRole("button", { name: /Submit application/i }));
    await screen.findByRole("heading", { name: /Submitted!/i });
    await u.click(screen.getByRole("button", { name: /Track application/i }));
    await screen.findByText("Digital Design Assistant", { selector: "h3" });
    const card = screen.getByText("Digital Design Assistant", { selector: "h3" }).closest("article");
    expect(within(card).getByRole("button", { name: "Applied" })).toHaveAttribute("aria-pressed", "true");
    await u.click(within(card).getByRole("button", { name: "Offer" }));
    expect(await screen.findByText(/Congratulations on the offer/i)).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Offer" })).toHaveAttribute("aria-pressed", "true");
    await u.type(within(card).getByPlaceholderText(/Add a note/i), "Start date Oct 20");
    await u.click(within(card).getByRole("button", { name: /Save note/i }));
    expect(await screen.findByText(/Note saved/i)).toBeInTheDocument();
    // withdraw
    await u.click(within(card).getByRole("button", { name: /Withdraw/i }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /^Withdraw$/i }));
    await waitFor(() => expect(screen.queryByText("Digital Design Assistant", { selector: "h3" })).not.toBeInTheDocument());
  });

  it("posts a job (with validation) and it shows on the board and in my posts", async () => {
    const { u } = await jobsTab();
    await u.click(screen.getByRole("button", { name: "Post a job" }));
    await screen.findByRole("heading", { name: /Post a job/i });
    await u.click(screen.getByRole("button", { name: /^Post job$/i }));
    expect(await screen.findByText("Add a job title")).toBeInTheDocument();
    await u.type(screen.getByLabelText("Job title"), "Community Manager");
    await u.type(screen.getByLabelText("Company or team"), "Pitchside Collective");
    await u.type(screen.getByLabelText("Location"), "Austin, TX");
    await u.type(screen.getByLabelText("About the role"), "Grow and care for a community of women in sports.");
    await u.click(screen.getByRole("button", { name: "Marketing" }));
    await u.click(screen.getByRole("button", { name: /^Post job$/i }));
    await screen.findByRole("heading", { name: /Your job board/i });
    await u.type(screen.getByLabelText(/Search roles/i), "Community Manager");
    expect(await screen.findByRole("heading", { name: "Community Manager" })).toBeInTheDocument();
    await u.click(screen.getByRole("tab", { name: /Tracker/i }));
    expect(screen.getByText(/Your job posts/i)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Delete Community Manager/i }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Delete post/i }));
    await waitFor(() => expect(screen.queryByText(/Your job posts/i)).not.toBeInTheDocument());
  });
});

describe("tips", () => {
  it("filters articles, bookmarks, reads, and joins the discussion", async () => {
    const { u } = await demo();
    await nav(u, "Tips");
    await screen.findByRole("heading", { name: /Tips and tricks/i });
    expect(screen.getByText(/Video of the week:/i)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Career" }));
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["From Fan to Pro: How to Transition from a Passion for Sports to a Career"]);
    await u.click(screen.getByRole("button", { name: "All" }));
    await u.click(screen.getAllByRole("button", { name: /Bookmark article/i })[0]);
    expect(await screen.findByText(/Saved to your bookmarks/i)).toBeInTheDocument();
    await u.click(screen.getByRole("heading", { name: /Balancing Work and Wellness/i }));
    await screen.findByText("Prioritize Physical Activity");
    expect(screen.getByText(/Sarah Johnson \| Head Athletic Trainer/i)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Open discussion/i }));
    await screen.findByRole("heading", { name: /^Discussion$/i });
    await u.type(screen.getByLabelText(/Share your thoughts/i), "Boundaries have changed my week.{Enter}");
    expect(await screen.findByText("Boundaries have changed my week.")).toBeInTheDocument();
  });

  it("plays the video of the week and jumps between chapters", async () => {
    const { u } = await demo();
    await nav(u, "Tips");
    await u.click(await screen.findByRole("button", { name: /Play video of the week/i }));
    const dlg = await screen.findByRole("dialog");
    await u.click(within(dlg).getByRole("button", { name: "Play" }));
    expect(within(dlg).getByRole("button", { name: "Pause" })).toBeInTheDocument();
    await u.click(within(dlg).getByRole("button", { name: /Advice for your first year/i }));
    expect(within(dlg).getAllByText("2:01").length).toBeGreaterThan(0);
  });
});

describe("connect", () => {
  async function connectTab() {
    const ctx = await demo();
    await nav(ctx.u, "Connect");
    await screen.findByRole("heading", { name: /^Connect$/i });
    await ctx.u.click(screen.getByRole("tab", { name: /^Feed$/i }));
    return ctx;
  }

  it("posts to the feed, likes, comments, and gets simulated reactions", async () => {
    const { u } = await connectTab();
    await u.click(await screen.findByRole("button", { name: /Share an update/i }));
    const dlg = screen.getByRole("dialog");
    await u.click(within(dlg).getByRole("button", { name: /^Post$/i }));
    expect(await within(dlg).findByText("Write something to share")).toBeInTheDocument();
    await u.click(within(dlg).getByRole("button", { name: "Win" }));
    await u.type(within(dlg).getByPlaceholderText(/Celebrate/i), "Finished my capstone presentation!");
    await u.click(within(dlg).getByRole("button", { name: /^Post$/i }));
    const text = await screen.findByText("Finished my capstone presentation!");
    const post = text.closest("article");
    await u.click(within(post).getByRole("button", { name: "Like (0)" }));
    expect(within(post).getByRole("button", { name: "Unlike (1)" })).toHaveAttribute("aria-pressed", "true");
    await u.click(within(post).getByRole("button", { name: "Comments (0)" }));
    await u.type(within(post).getByLabelText(/Add a comment/i), "Thank you all!{Enter}");
    expect(await within(post).findByText("Thank you all!")).toBeInTheDocument();
    // simulated community reacts after ~5s
    await waitFor(() => expect(within(post).getByRole("button", { name: /^Unlike \([34]\)$/ })).toBeInTheDocument(), LONG);
  });

  it("requires a date for event posts", async () => {
    const { u } = await connectTab();
    await u.click(await screen.findByRole("button", { name: /Share an update/i }));
    const dlg = screen.getByRole("dialog");
    await u.click(within(dlg).getByRole("button", { name: "Event" }));
    await u.type(within(dlg).getByPlaceholderText(/Tell people about your event/i), "Portfolio review night");
    await u.click(within(dlg).getByRole("button", { name: /^Post$/i }));
    expect(await within(dlg).findByText(/Add a date and time/i)).toBeInTheDocument();
    await u.type(within(dlg).getByLabelText("When"), "Fri, Nov 7 · 6 PM ET");
    await u.click(within(dlg).getByRole("button", { name: /^Post$/i }));
    expect(await screen.findByText("Fri, Nov 7 · 6 PM ET")).toBeInTheDocument();
  });

  it("reports a post and blocks an author, hiding their content", async () => {
    const { u } = await connectTab();
    await screen.findByText(/Just got an interview/i);
    const post = screen.getByText(/Just got an interview/i).closest("article");
    await u.click(within(post).getByRole("button", { name: /More options/i }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Report post/i }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Spam or scam/i }));
    expect(await screen.findByText(/Thanks for reporting/i)).toBeInTheDocument();
    await u.click(within(post).getByRole("button", { name: /More options/i }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Block Maria/i }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /^Block$/i }));
    await waitFor(() => expect(screen.queryByText(/Just got an interview/i)).not.toBeInTheDocument());
  });

  it("chats with typing indicator and gets a reply", async () => {
    const { u } = await connectTab();
    await u.click(screen.getByRole("tab", { name: /Messages/i }));
    await u.click(await screen.findByText(/Jessica Thomas/i));
    await screen.findByRole("heading", { name: /Jessica Thomas/i });
    const real = () => document.querySelectorAll(".bubble.them:not(.typing)").length;
    const before = real();
    await u.type(screen.getByLabelText(/Message Jessica/i), "Is the role hybrid?{Enter}");
    expect(await screen.findByText("Is the role hybrid?")).toBeInTheDocument();
    await waitFor(() => expect(real()).toBeGreaterThan(before), LONG);
    expect(document.querySelector(".bubble.typing")).toBeNull();
  });

  it("starts a brand-new conversation from the picker", async () => {
    const { u } = await connectTab();
    await u.click(screen.getByRole("tab", { name: /Messages/i }));
    await u.click(screen.getByRole("button", { name: "New message" }));
    await u.click(within(screen.getByRole("dialog")).getByText("Olivia Carter"));
    await screen.findByRole("heading", { name: /Olivia Carter/i });
    expect(screen.getByText(/Say hi to Olivia/i)).toBeInTheDocument();
  });

  it("requests a mentor, then gets accepted and can message her; waitlist works too", async () => {
    const { u } = await connectTab();
    await u.click(screen.getByRole("tab", { name: /Mentors/i }));
    const emily = (await screen.findAllByText("Emily Parker")).map((e) => e.closest("article")).find(Boolean);
    await u.click(within(emily).getByRole("button", { name: /Request mentorship/i }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /I'm breaking into the industry/i }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Send request/i }));
    expect(await within(emily).findByText(/Request pending/i)).toBeInTheDocument();
    await waitFor(() => expect(within(emily).getByRole("button", { name: /Message Emily/i })).toBeInTheDocument(), LONG);

    const jess = screen.getByText("Jessica Evans").closest("article");
    await u.click(within(jess).getByRole("button", { name: /Request mentorship/i }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Send request/i }));
    await waitFor(() => expect(within(jess).getByText(/On the waitlist/i)).toBeInTheDocument(), LONG);

    // accepted mentor shows up in Messages
    await u.click(screen.getByRole("tab", { name: /Messages/i }));
    expect(await screen.findByText(/I'd love to mentor you/i)).toBeInTheDocument();
  });
});

describe("profile & settings", () => {
  it("edits my profile and sees it reflected", async () => {
    const { u } = await demo();
    await u.click(screen.getByRole("button", { name: "My profile" }));
    await screen.findByRole("heading", { name: /My profile/i });
    expect(screen.getByText("Emma Wilson")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Edit profile/i }));
    await u.clear(screen.getByLabelText("Headline"));
    await u.type(screen.getByLabelText("Headline"), "Brand designer for women's sports");
    await u.click(screen.getByRole("button", { name: /Save changes/i }));
    expect(await screen.findByText("Brand designer for women's sports")).toBeInTheDocument();
  });

  it("views another member, connects, and messages", async () => {
    const { u } = await demo();
    await nav(u, "Connect");
    await u.click(screen.getByRole("tab", { name: /Mentors/i }));
    const card = (await screen.findByText("Nina Torres")).closest("article");
    await u.click(within(card).getByRole("button", { name: /Nina Torres/ }));
    await screen.findByText("Redesign my portfolio");
    const prof = document.querySelector(".prof");
    await u.click(within(prof).getByRole("button", { name: /^Connect$/i }));
    expect(await screen.findByText(/now connected with Nina/i)).toBeInTheDocument();
    await u.click(within(prof).getByRole("button", { name: /Message/i }));
    await screen.findByRole("heading", { name: /Nina Torres/i });
  });

  it("toggles settings, unblocks, and signs out back to welcome", async () => {
    const { u } = await demo();
    await u.click(screen.getByRole("button", { name: "My profile" }));
    await u.click(screen.getByRole("button", { name: "Settings" }));
    await screen.findByRole("heading", { name: /^Settings$/i });
    const sw = screen.getByRole("switch", { name: /In-app alerts/i });
    expect(sw).toHaveAttribute("aria-checked", "true");
    await u.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/haven't blocked anyone/i)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Sign out/i }));
    await screen.findByText(/Explore the demo/i);
  });

  it("persists data across a reload", async () => {
    const { u, view } = await demo();
    await nav(u, "Goals");
    await u.click(screen.getByRole("button", { name: "New goal" }));
    await u.type(screen.getByLabelText(/What do you want to achieve/i), "Persist me");
    await u.click(screen.getByRole("button", { name: /^Create goal$/i }));
    await screen.findByRole("heading", { name: "Persist me" });
    view.unmount();
    render(<App />);
    await screen.findByRole("heading", { name: /Welcome, Emma/i }, LONG);
    await userEvent.setup().click(screen.getByRole("button", { name: "Goals" }));
    await screen.findByRole("heading", { name: "Persist me" });
  });
});
