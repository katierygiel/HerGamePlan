import React, { useState } from "react";
import {
  Home, Target, Lightbulb, Briefcase, MessageCircle, ArrowLeft,
  Plus, Minus, ChevronRight, Play, Check, Lock, Globe2, Heart, Send
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS
--------------------------------------------------------- */
const C = {
  blitz: "#662D91",
  blitzDark: "#4A1F6B",
  blitzDeep: "#341451",
  roster: "#233044",
  tennis: "#7FB88F",
  bleacher: "#8C8C8C",
  bleacherLight: "#EFEDF4",
  cream: "#FAF8FC",
  ink: "#231A2E",
  line: "#E7E3EF",
};

const FONT = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500&display=swap');
`;

/* ---------------------------------------------------------
   DATA
--------------------------------------------------------- */
const initialGoals = {
  short: {
    label: "SHORT TERM",
    title: "Apply to 2 jobs today",
    steps: [
      { id: "s1", label: "Jr. Graphic Designer — NYY", done: true },
      { id: "s2", label: "Jr. Graphic Designer — PHI", done: false },
    ],
    isPublic: false,
  },
  long: {
    label: "LONG TERM",
    title: "Complete Capstone Project",
    steps: [
      { id: "l1", label: "Project scope and goals", done: true },
      { id: "l2", label: "Conduct research", done: true },
      { id: "l3", label: "Develop a design brief", done: true },
      { id: "l4", label: "Sketch and brainstorm", done: true },
      { id: "l5", label: "Select design tools", done: true },
      { id: "l6", label: "Create low-fidelity prototypes", done: true },
      { id: "l7", label: "Test prototypes", done: true },
      { id: "l8", label: "Refine prototypes", done: true },
      { id: "l9", label: "Gather more feedback", done: true },
      { id: "l10", label: "Create case study", done: false },
      { id: "l11", label: "Final essay", done: false },
      { id: "l12", label: "Presentation", done: false },
    ],
    isPublic: true,
  },
};

const jobs = [
  { id: "j1", title: "Graphic Designer", company: "Her Game Plan", hgp: true, location: "New York, NY", posted: "1 week ago", pay: "$50K–$60K/yr", interests: 5, postedBy: "Carla Jennings" },
  { id: "j2", title: "Jr. Graphic Designer", company: "Promotion Media", hgp: false, location: "Brooklyn, NY", posted: "3 days ago", pay: "$50K/yr", interests: 3, postedBy: "Emily Carter" },
  { id: "j3", title: "Motion Graphics Intern", company: "NextPlay Digital", hgp: false, location: "Hoboken, NJ", posted: "1 day ago", pay: "$22/hr", interests: 4, postedBy: "Anonymous" },
  { id: "j4", title: "Digital Design Assistant", company: "Champion Branding Co.", hgp: false, location: "Long Island, NY", posted: "1 month ago", pay: "$50K/yr", interests: 4, postedBy: "Anonymous" },
  { id: "j5", title: "Graphic Design Assistant", company: "Victory Creative", hgp: false, location: "Manhattan, NY", posted: "5 days ago", pay: "$45K/yr", interests: 4, postedBy: "Jessica Thomas" },
  { id: "j6", title: "Jr. Visual Communication Designer", company: "Courtvision Studios", hgp: false, location: "Manhattan, NY", posted: "2 weeks ago", pay: "$47K/yr", interests: 6, postedBy: "Anonymous" },
];

const currentInterestsSeed = ["Design", "Entry Level", "New York", "Photoshop", "Social Media", "Illustration"];
const suggestedInterests = ["Web", "Marketing", "Video", "Branding", "Copywriting", "Photography", "Sports", "Motion Design", "UX/UI Design", "Public Relations", "App Development"];

const articles = [
  {
    id: "a1",
    title: "Balancing Work and Wellness: Self-Care Tips for Women in Sports Careers",
    author: "Sarah Johnson",
    role: "Head Athletic Trainer, USA Women's Basketball",
    excerpt: "Practical strategies for managing the stress and physical demands of a sports career while maintaining a healthy work-life balance.",
    body: [
      "Working in professional sports, especially as a woman, can be incredibly rewarding, but it's also a fast-paced, high-pressure environment. When you're constantly managing players' injuries, coordinating team schedules, and attending to the needs of high-performance athletes, it can be easy to neglect your own wellness.",
      "Prioritize physical activity. Whether it's a short walk or a restorative yoga session before bed, staying active helps me recharge, even on the busiest days.",
      "Set boundaries. In sports, there's often an unspoken expectation to be \"on\" 24/7. Constantly saying yes to every request leads to burnout — clear boundaries around work hours protect your well-being.",
      "Mental health matters. Journaling and talking with a therapist has been extremely helpful in managing work-related stress and maintaining a healthier perspective.",
      "Build a support system. Having a network of women who understand the unique challenges of this industry has been invaluable. Self-care isn't a luxury — it's a necessity.",
    ],
  },
  {
    id: "a2",
    title: "Building a Personal Brand in Sports: How to Stand Out and Get Noticed",
    author: "Olivia Carter",
    role: "Sports Marketing Manager, Sports Apparel Company",
    excerpt: "Ways to create a strong personal brand through social media, networking, and showcasing expertise.",
    body: [
      "Your personal brand is how the industry remembers you before you're even in the room. Start by getting specific about the intersection of what you're good at and what you care about.",
      "Social media is your portfolio in motion. Post consistently about the work you're doing and the perspective you bring — not just wins, but process.",
      "Networking is brand-building in real time. Every conversation, panel, or DM is a chance to reinforce what you stand for.",
      "Showcase expertise generously. Sharing what you know builds trust faster than any resume line.",
    ],
  },
  {
    id: "a3",
    title: "From Fan to Pro: How to Transition from a Passion for Sports to a Career",
    author: "Isabella Tran",
    role: "Marketing Manager, Sports Sponsorship",
    excerpt: "How to leverage your love of sports into a meaningful career in management, media, coaching, or behind-the-scenes.",
    body: [
      "Loving a sport and building a career around it are two different skill sets — the second one has to be learned deliberately.",
      "Start by mapping the roles you don't see on TV: sponsorship, operations, analytics, content, community. That's where most entry points live.",
      "Volunteer and intern relentlessly early on. Proximity to the industry teaches you its language faster than any course.",
      "Your fandom is an asset — it's the reason you'll outwork people who took the job for less personal reasons. Use that.",
    ],
  },
  {
    id: "a4",
    title: "Workplace Confidence: How to Speak Up and Own Your Space in Male-Dominated Environments",
    author: "Jessica Evans",
    role: "Head Coach, D1 NCAA Men's Basketball Team",
    excerpt: "Tips for cultivating confidence and assertiveness, from negotiating salaries to contributing ideas in meetings.",
    body: [
      "Confidence in rooms that weren't built with you in mind is a practiced skill, not a personality trait you either have or don't.",
      "Prepare your point before the meeting starts. Knowing exactly what you want to say removes the guesswork of speaking up in the moment.",
      "Negotiate like it's part of the job, because it is. Come with numbers, not apologies.",
      "Every time you take up space well, you make it a little easier for the next woman in the room.",
    ],
  },
];

const videoOfWeek = {
  name: "Emily Parker",
  role: "Sports Reporter",
  location: "Toronto, Ontario",
  series: "Journey to Today",
};

const seedArticleComments = {
  a1: [
    { id: "c1", name: "Maria Lopez", text: "The boundaries section hit home. Needed this today.", time: "2h" },
    { id: "c2", name: "Devon Price", text: "Starting a journaling habit tonight because of this.", time: "5h" },
  ],
  a2: [
    { id: "c1", name: "Nina Torres", text: "Great breakdown — saving this for later.", time: "1d" },
  ],
  a3: [
    { id: "c1", name: "Sam Okafor", text: "Wish I'd read this before applying to internships!", time: "3d" },
  ],
  a4: [
    { id: "c1", name: "Priya Anand", text: "\"Negotiate like it's part of the job\" — needed to hear that.", time: "6h" },
    { id: "c2", name: "Rachel Kim", text: "Sharing this with my whole team.", time: "1d" },
  ],
};

const seedGoalComments = {
  short: [],
  long: [
    { id: "g1", name: "Jessica Thomas", text: "You're almost there — the case study is the fun part 🎉", time: "1d" },
    { id: "g2", name: "Carla Jennings", text: "Following along, can't wait to see the final presentation!", time: "2d" },
  ],
};

/* ---------------------------------------------------------
   SMALL COMPONENTS
--------------------------------------------------------- */
function Wave({ flip = false, style = {} }) {
  return (
    <svg viewBox="0 0 400 42" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 34, ...style }}>
      <path d="M0,8 C90,38 160,-4 230,12 C300,30 340,2 400,14 L400,42 L0,42 Z" fill={flip ? C.cream : C.blitz} />
    </svg>
  );
}

function Logo({ size = 40, color = "#fff" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "baseline", fontFamily: "Montserrat", fontWeight: 900, fontSize: size, lineHeight: 1, color, letterSpacing: -1.5 }}>
      HGP
    </div>
  );
}

function Avatar({ name, size = 34 }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: C.bleacherLight, color: C.blitz,
      fontFamily: "Montserrat", fontWeight: 800, fontSize: size * 0.36,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Ring({ current, total, size = 108, label }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : Math.min(current / total, 1);
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.28)" strokeWidth="6" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke="#fff" strokeWidth="6" fill="none"
        strokeDasharray={c} strokeDashoffset={c - pct * c} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.35s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" fill="#fff" fontFamily="Montserrat" fontWeight="800" fontSize={size * 0.22} dominantBaseline="central">
        {label}
      </text>
    </svg>
  );
}

function NavBar({ screen, go, unread }) {
  const items = [
    { key: "home", icon: Home },
    { key: "goals", icon: Target },
    { key: "tips", icon: Lightbulb },
    { key: "jobs", icon: Briefcase },
    { key: "messages", icon: MessageCircle },
  ];
  return (
    <div style={{ background: C.blitzDeep, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 6px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      {items.map(({ key, icon: Icon }) => {
        const active = screen === key;
        return (
          <button key={key} onClick={() => go(key)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, position: "relative", borderRadius: 12 }}>
            <div style={{
              width: 40, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? "rgba(255,255,255,0.16)" : "transparent",
            }}>
              <Icon size={20} color={active ? "#fff" : "rgba(255,255,255,0.55)"} strokeWidth={active ? 2.3 : 2} />
            </div>
            {key === "messages" && unread > 0 && (
              <span style={{ position: "absolute", top: 4, right: 6, width: 8, height: 8, borderRadius: "50%", background: C.tennis, border: `1.5px solid ${C.blitzDeep}` }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function TopBar({ title, onBack, subtitle }) {
  return (
    <div style={{ padding: "16px 20px 8px", background: C.cream, position: "relative" }}>
      {onBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.blitz, position: "absolute", left: 14, top: 15 }}>
          <ArrowLeft size={21} />
        </button>
      )}
      <h1 style={{ margin: 0, textAlign: "center", fontFamily: "Montserrat", fontWeight: 800, fontSize: 14.5, letterSpacing: 0.8, color: C.ink, textTransform: "uppercase", paddingLeft: onBack ? 22 : 0, paddingRight: onBack ? 22 : 0 }}>
        {title}
      </h1>
      {subtitle && <div style={{ textAlign: "center", fontFamily: "Montserrat", fontSize: 11, color: C.bleacher, marginTop: 3 }}>{subtitle}</div>}
    </div>
  );
}

function Pill({ children, tone = "light", onClick, active }) {
  const styles = {
    light: { background: "rgba(255,255,255,0.92)", color: C.blitz },
    dark: { background: active ? "#fff" : "rgba(255,255,255,0.14)", color: active ? C.blitz : "#fff", border: "1px solid rgba(255,255,255,0.4)" },
    ghost: { background: C.bleacherLight, color: C.roster },
  };
  return (
    <span onClick={onClick} style={{ ...styles[tone], fontFamily: "Montserrat", fontWeight: 700, fontSize: 11, padding: "6px 11px", borderRadius: 99, display: "inline-block", cursor: onClick ? "pointer" : "default" }}>
      {children}
    </span>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: 10, color: C.bleacher, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", marginTop: 5, padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: "#fff", fontFamily: "Montserrat", fontSize: 13.5, color: C.ink, outline: "none" }}
        onFocus={(e) => (e.target.style.borderColor = C.blitz)}
        onBlur={(e) => (e.target.style.borderColor = C.line)}
      />
    </div>
  );
}

/* Reusable comment thread — used for both article discussions and goal support */
function CommentThread({ comments, onPost, placeholder, emptyText, showCheer, onCheer, cheered }) {
  const [text, setText] = useState("");
  const post = () => {
    if (!text.trim()) return;
    onPost(text.trim());
    setText("");
  };
  return (
    <div>
      {showCheer && (
        <button onClick={onCheer} style={{
          display: "flex", alignItems: "center", gap: 7, background: cheered ? "#fff" : "rgba(255,255,255,0.14)",
          color: cheered ? C.blitz : "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 99,
          padding: "8px 16px", fontFamily: "Montserrat", fontWeight: 700, fontSize: 12, cursor: "pointer", marginBottom: 18,
        }}>
          <Heart size={14} fill={cheered ? C.blitz : "none"} /> {cheered ? "Cheering you on" : "Cheer her on"}
        </button>
      )}

      {comments.length === 0 && (
        <div style={{ fontFamily: "Montserrat", fontSize: 12.5, color: "rgba(255,255,255,0.7)", fontStyle: "italic", marginBottom: 16 }}>{emptyText}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        {comments.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 10 }}>
            <Avatar name={c.name} />
            <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "9px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 12, color: "#fff" }}>{c.name}</span>
                <span style={{ fontFamily: "Montserrat", fontSize: 10, color: "rgba(255,255,255,0.6)", flexShrink: 0 }}>{c.time}</span>
              </div>
              <div style={{ fontFamily: "Montserrat", fontSize: 12.5, color: "rgba(255,255,255,0.92)", marginTop: 3, lineHeight: 1.5 }}>{c.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", position: "sticky", bottom: 0 }}>
        <input
          value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && post()}
          style={{ flex: 1, padding: "11px 14px", borderRadius: 99, border: "none", fontFamily: "Montserrat", fontSize: 12.5, outline: "none" }}
        />
        <button onClick={post} style={{ width: 38, height: 38, borderRadius: "50%", background: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <Send size={16} color={C.blitz} />
        </button>
      </div>
    </div>
  );
}

const btnPrimary = { background: "#fff", color: C.blitz, border: "none", borderRadius: 12, padding: "14px 0", fontFamily: "Montserrat", fontWeight: 800, fontSize: 13.5, letterSpacing: 0.6, cursor: "pointer" };
const btnGhost = { background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.55)", borderRadius: 12, padding: "14px 0", fontFamily: "Montserrat", fontWeight: 800, fontSize: 13.5, letterSpacing: 0.6, cursor: "pointer" };
const cardShadow = "0 3px 14px rgba(35,20,50,0.09)";

/* ---------------------------------------------------------
   SCREENS
--------------------------------------------------------- */
function WelcomeScreen({ go }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: `linear-gradient(165deg, ${C.blitz}, ${C.blitzDeep})`, color: "#fff", justifyContent: "space-between", padding: "44px 30px 36px", textAlign: "center" }}>
      <div />
      <div>
        <Logo size={64} />
        <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 26, letterSpacing: 0.5, marginTop: 10 }}>HER GAME PLAN</div>
        <div style={{ fontFamily: "Montserrat", fontWeight: 500, fontSize: 12.5, opacity: 0.8, marginTop: 10, lineHeight: 1.5 }}>
          Women in Sports Leading The Way:<br />Your Playbook for Success
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <button onClick={() => go("auth", { mode: "signup" })} style={btnPrimary}>Sign Up</button>
        <button onClick={() => go("auth", { mode: "signin" })} style={btnGhost}>Sign In</button>
      </div>
    </div>
  );
}

function AuthScreen({ mode, setMode, go, setUser }) {
  const [firstName, setFirstName] = useState("Emma");
  const [lastName, setLastName] = useState("Wilson");
  const [email, setEmail] = useState("emma@emmagraphics.com");
  const [password, setPassword] = useState("");
  const canSubmit = email.trim() && password.trim() && (mode === "signin" || (firstName.trim() && lastName.trim()));

  const submit = () => {
    if (!canSubmit) return;
    setUser({ firstName, lastName, email });
    go("home");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.cream }}>
      <div style={{ background: C.blitz, padding: "30px 24px 0" }}>
        <Logo size={30} />
        <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 16, color: "#fff", marginTop: 4 }}>HER GAME PLAN</div>
        <div style={{ fontFamily: "Montserrat", fontWeight: 500, fontSize: 9.5, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>The Women Playmakers' Network</div>
        <Wave flip />
      </div>

      <div style={{ flex: 1, padding: "0 26px", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 22, margin: "18px 0 20px" }}>
          {["signin", "signup"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: "Montserrat", fontWeight: 800, fontSize: 12.5, letterSpacing: 0.6,
              color: mode === m ? C.blitz : C.bleacher,
              borderBottom: mode === m ? `2.5px solid ${C.blitz}` : "2.5px solid transparent", paddingBottom: 6,
            }}>
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <>
            <Field label="First Name" value={firstName} onChange={setFirstName} />
            <Field label="Last Name" value={lastName} onChange={setLastName} />
          </>
        )}
        <Field label="Email" value={email} onChange={setEmail} />
        <Field label="Password" value={password} onChange={setPassword} type="password" />

        <button onClick={submit} disabled={!canSubmit} style={{ ...btnPrimary, background: canSubmit ? C.blitz : C.line, color: canSubmit ? "#fff" : C.bleacher, width: "100%", marginTop: 8, cursor: canSubmit ? "pointer" : "not-allowed" }}>
          {mode === "signin" ? "Sign In" : "Create Account"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontFamily: "Montserrat", fontSize: 12, color: C.bleacher }}>
          {mode === "signin" ? (
            <>Don't have an account? <span onClick={() => setMode("signup")} style={{ color: C.blitz, fontWeight: 700, cursor: "pointer" }}>Sign Up</span></>
          ) : (
            <>Already have an account? <span onClick={() => setMode("signin")} style={{ color: C.blitz, fontWeight: 700, cursor: "pointer" }}>Sign In</span></>
          )}
        </div>
        {mode === "signin" && (
          <div style={{ textAlign: "center", marginTop: 10, fontFamily: "Montserrat", fontSize: 11.5, color: C.blitz, fontWeight: 700, cursor: "pointer" }}>Forgot Password?</div>
        )}
      </div>
    </div>
  );
}

function HomeScreen({ user, go, goals, articleComments, goalComments }) {
  const goalMeta = (key) => {
    const g = goals[key];
    return g.isPublic
      ? { text: `${goalComments[key].length} comment${goalComments[key].length === 1 ? "" : "s"}`, icon: Globe2 }
      : { text: "Private", icon: Lock };
  };
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.blitz }}>
      <div style={{ background: C.cream, padding: "18px 22px 4px" }}>
        <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 19, color: C.ink, letterSpacing: 0.2 }}>Welcome, {user.firstName}</div>
      </div>
      <Wave />
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 22px" }}>
        <div onClick={() => go("goals")} style={{ background: "#fff", borderRadius: 16, padding: "16px 16px 14px", boxShadow: cardShadow, cursor: "pointer" }}>
          <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 12.5, color: C.bleacher, textAlign: "center", marginBottom: 12, letterSpacing: 0.5 }}>MY GOALS</div>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            {["short", "long"].map((k) => {
              const g = goals[k];
              const done = g.steps.filter((s) => s.done).length;
              const total = g.steps.length;
              const meta = goalMeta(k);
              const MetaIcon = meta.icon;
              return (
                <div key={k}>
                  <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 10, color: C.blitz, letterSpacing: 0.4 }}>{g.label}</div>
                  <div style={{ fontFamily: "Montserrat", fontWeight: 600, fontSize: 10.5, color: C.roster, margin: "3px 0 8px", maxWidth: 110 }}>{g.title}</div>
                  <div style={{ background: C.blitz, borderRadius: "50%", display: "inline-block", padding: 6 }}>
                    <Ring current={done} total={total} size={68} label={k === "short" ? `${done}/${total}` : `${total - done}`} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "Montserrat", fontSize: 9.5, color: C.bleacher, marginTop: 7 }}>
                    <MetaIcon size={10} /> {meta.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div onClick={() => go("tips")} style={{ marginTop: 14, borderRadius: 16, overflow: "hidden", position: "relative", height: 128, cursor: "pointer", background: `linear-gradient(125deg, ${C.roster}, ${C.blitzDark})` }}>
          <div style={{ position: "absolute", right: 16, top: 14, textAlign: "right", fontFamily: "Montserrat", fontWeight: 800, fontSize: 10.5, color: "rgba(255,255,255,0.65)", letterSpacing: 1 }}>VIDEO OF THE WEEK</div>
          <div style={{ position: "absolute", left: 16, bottom: 14, color: "#fff" }}>
            <div style={{ fontFamily: "Montserrat", fontSize: 10, opacity: 0.7, fontWeight: 600 }}>{videoOfWeek.series}</div>
            <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 16 }}>{videoOfWeek.name}</div>
            <div style={{ fontFamily: "Montserrat", fontSize: 10, opacity: 0.7 }}>{videoOfWeek.role} · {videoOfWeek.location}</div>
          </div>
          <div style={{ position: "absolute", left: 16, top: 14, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={14} color="#fff" fill="#fff" />
          </div>
        </div>

        <SectionLabel onClick={() => go("jobs")}>Suggested for you</SectionLabel>
        <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 11.5, color: "rgba(255,255,255,0.85)", letterSpacing: 0.5, margin: "10px 0 8px" }}>JOBS</div>
        {jobs.slice(0, 1).map((j) => <JobCard key={j.id} job={j} onClick={() => go("jobs")} />)}
        <ViewMore onClick={() => go("jobs")} />

        <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 11.5, color: "rgba(255,255,255,0.85)", letterSpacing: 0.5, margin: "18px 0 8px" }}>TIPS &amp; TRICKS</div>
        {articles.slice(0, 2).map((a) => (
          <ArticlePreview key={a.id} article={a} commentCount={articleComments[a.id]?.length || 0} onClick={() => go("articleDetail", { article: a })} />
        ))}
        <ViewMore onClick={() => go("tips")} />
      </div>
    </div>
  );
}

function SectionLabel({ children, onClick }) {
  return (
    <div onClick={onClick} style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 15.5, color: "#fff", textAlign: "center", marginTop: 22, cursor: onClick ? "pointer" : "default" }}>
      {children}
    </div>
  );
}
function ViewMore({ onClick }) {
  return <div onClick={onClick} style={{ textAlign: "center", fontFamily: "Montserrat", fontSize: 11.5, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginTop: 10, cursor: "pointer" }}>View more →</div>;
}

function JobCard({ job, onClick, onApply, onSave, saved }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: cardShadow, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: job.hgp ? C.blitz : C.bleacherLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {job.hgp ? <Logo size={16} /> : <span style={{ fontFamily: "Montserrat", fontWeight: 800, color: C.roster, fontSize: 15 }}>{job.company[0]}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 13, color: C.ink }}>{job.title}</div>
          <div style={{ fontFamily: "Montserrat", fontSize: 11.5, color: C.bleacher, marginTop: 1 }}>{job.company} · {job.location}</div>
          <div style={{ fontFamily: "Montserrat", fontSize: 11, color: C.bleacher, marginTop: 1 }}>{job.posted} · <span style={{ color: C.blitz, fontWeight: 700 }}>{job.pay}</span></div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", gap: 8 }}>
          {onApply && <button onClick={(e) => { e.stopPropagation(); onApply(); }} style={{ background: C.blitz, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: "Montserrat", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Apply</button>}
          {onSave && <button onClick={(e) => { e.stopPropagation(); onSave(); }} style={{ background: saved ? C.roster : "#fff", color: saved ? "#fff" : C.roster, border: `1.5px solid ${C.roster}`, borderRadius: 8, padding: "6px 14px", fontFamily: "Montserrat", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>{saved ? "Saved" : "Save"}</button>}
        </div>
        <div style={{ fontFamily: "Montserrat", fontSize: 10, color: C.bleacher, textAlign: "right" }}>
          {job.interests} matched interests<br />posted by <span style={{ color: C.blitz, fontWeight: 700 }}>{job.postedBy}</span>
        </div>
      </div>
    </div>
  );
}

function ArticlePreview({ article, onClick, commentCount }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: 14, padding: "13px 14px", marginBottom: 10, cursor: "pointer", boxShadow: cardShadow }}>
      <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 12.5, color: C.ink, lineHeight: 1.35 }}>{article.title}</div>
      <div style={{ fontFamily: "Montserrat", fontSize: 11, color: C.bleacher, marginTop: 6, lineHeight: 1.4 }}>{article.excerpt}</div>
      <div style={{ fontFamily: "Montserrat", fontSize: 10.5, color: C.blitz, fontWeight: 700, marginTop: 8 }}>{commentCount} comment{commentCount === 1 ? "" : "s"}</div>
    </div>
  );
}

function GoalsScreen({ goals, setGoals, go }) {
  const [tab, setTab] = useState("short");
  const g = goals[tab];
  const done = g.steps.filter((s) => s.done).length;
  const total = g.steps.length;

  const adjust = (delta) => {
    setGoals((prev) => {
      const steps = [...prev[tab].steps];
      if (delta > 0) {
        const idx = steps.findIndex((s) => !s.done);
        if (idx !== -1) steps[idx] = { ...steps[idx], done: true };
      } else {
        for (let i = steps.length - 1; i >= 0; i--) {
          if (steps[i].done) { steps[i] = { ...steps[i], done: false }; break; }
        }
      }
      return { ...prev, [tab]: { ...prev[tab], steps } };
    });
  };
  const toggleStep = (id) => {
    setGoals((prev) => ({ ...prev, [tab]: { ...prev[tab], steps: prev[tab].steps.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) } }));
  };
  const togglePublic = () => setGoals((prev) => ({ ...prev, [tab]: { ...prev[tab], isPublic: !prev[tab].isPublic } }));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.cream }}>
        <TopBar title="Reach Your Goals" />
        <Wave />
      </div>
      <div style={{ flex: 1, background: C.blitz, overflowY: "auto", padding: "16px 22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 26, marginBottom: 16 }}>
          {["short", "long"].map((k) => (
            <button key={k} onClick={() => setTab(k)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "Montserrat", fontWeight: 800, fontSize: 12, letterSpacing: 0.5, color: "#fff", opacity: tab === k ? 1 : 0.5, borderBottom: tab === k ? "2px solid #fff" : "2px solid transparent", paddingBottom: 4 }}>
              {goals[k].label}
            </button>
          ))}
        </div>

        <div style={{ textAlign: "center", fontFamily: "Montserrat", fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 18 }}>{g.title}</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 6 }}>
          <button onClick={() => adjust(-1)} style={circleBtn}><Minus size={17} color="#fff" /></button>
          <Ring current={done} total={total} size={112} label={tab === "short" ? `${done}/${total}` : `${total - done}`} />
          <button onClick={() => adjust(1)} style={circleBtn}><Plus size={17} color="#fff" /></button>
        </div>
        {tab === "long" && <div style={{ textAlign: "center", fontFamily: "Montserrat", fontSize: 10.5, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>tasks left</div>}
        {tab === "short" && <div style={{ marginBottom: 16 }} />}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {g.steps.map((s) => (
            <div key={s.id} onClick={() => toggleStep(s.id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: s.done ? "#fff" : "transparent" }}>
                {s.done && <Check size={12} color={C.blitz} strokeWidth={3.5} />}
              </span>
              <span style={{ fontFamily: "Montserrat", fontSize: 12.5, color: "#fff", opacity: s.done ? 0.75 : 1, textDecoration: s.done ? "line-through" : "none" }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Montserrat", fontSize: 11.5, color: "rgba(255,255,255,0.9)" }}>
            {g.isPublic ? <Globe2 size={13} /> : <Lock size={13} />}
            This goal is currently {g.isPublic ? "public" : "private"}.
          </div>
          <div onClick={togglePublic} style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: 11.5, color: "#fff", textDecoration: "underline", marginTop: 6, cursor: "pointer" }}>
            Switch to {g.isPublic ? "private" : "public to open discussion"}
          </div>
          {g.isPublic && (
            <div onClick={() => go("goalDiscussion", { goalKey: tab })} style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 12, color: "#fff", marginTop: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              View discussion &amp; support <ChevronRight size={14} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
const circleBtn = { width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.16)", border: "1.5px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };

function GoalDiscussionScreen({ goals, goalKey, goalComments, postGoalComment, cheeredGoals, toggleCheer, go }) {
  const g = goals[goalKey];
  const comments = goalComments[goalKey];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.cream }}>
        <TopBar title="Goal support" subtitle={g.title} onBack={() => go("goals")} />
        <Wave />
      </div>
      <div style={{ flex: 1, background: C.blitz, overflowY: "auto", display: "flex", flexDirection: "column", padding: "18px 20px 18px" }}>
        <div style={{ flex: 1 }}>
          <CommentThread
            comments={comments}
            onPost={(text) => postGoalComment(goalKey, text)}
            placeholder="Send encouragement…"
            emptyText="No comments yet — be the first to cheer her on."
            showCheer
            cheered={cheeredGoals.has(goalKey)}
            onCheer={() => toggleCheer(goalKey)}
          />
        </div>
      </div>
    </div>
  );
}

function JobsScreen({ go, interests, setInterests, savedJobs, toggleSave }) {
  const [showAdd, setShowAdd] = useState(false);
  const available = suggestedInterests.filter((s) => !interests.includes(s));
  const removeInterest = (i) => setInterests((prev) => prev.filter((x) => x !== i));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.cream }}>
        <TopBar title="Your Job Board" />
        <Wave />
      </div>
      <div style={{ flex: 1, background: C.blitz, overflowY: "auto", padding: "16px 20px 24px" }}>
        <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 14, padding: "14px" }}>
          <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 12, color: "#fff", marginBottom: 9, letterSpacing: 0.4 }}>YOUR INTERESTS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: showAdd ? 12 : 0 }}>
            {interests.map((i) => <Pill key={i} tone="light" onClick={() => removeInterest(i)}>{i} ✕</Pill>)}
            <Pill tone="dark" onClick={() => setShowAdd((v) => !v)}>{showAdd ? "Done" : "+ Add more"}</Pill>
          </div>
          {showAdd && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {available.map((s) => <Pill key={s} tone="dark" onClick={() => setInterests((prev) => [...prev, s])}>+ {s}</Pill>)}
              {available.length === 0 && <span style={{ fontFamily: "Montserrat", fontSize: 11, color: "rgba(255,255,255,0.65)" }}>You've added them all!</span>}
            </div>
          )}
        </div>

        <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 15.5, color: "#fff", textAlign: "center", margin: "20px 0 14px" }}>Suggested for you</div>

        {jobs.map((j) => (
          <JobCard key={j.id} job={j} onApply={() => go("jobProfile", { job: j })} onSave={() => toggleSave(j.id)} saved={savedJobs.has(j.id)} />
        ))}
      </div>
    </div>
  );
}

function JobProfileScreen({ go, job, user }) {
  const [form, setForm] = useState({
    firstName: user.firstName, lastName: user.lastName, email: user.email,
    phone: "123-456-7890", city: "Mahwah", state: "New Jersey",
    headline: "Class of 2025 Visual Design Student",
    portfolio: "emmawilson.portfolio.com", resume: "emmawilsonresume.pdf",
  });
  const upd = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.cream }}>
        <TopBar title="Apply" subtitle={job ? `${job.title} · ${job.company}` : undefined} onBack={() => go("jobs")} />
        <Wave />
      </div>
      <div style={{ flex: 1, background: C.blitz, overflowY: "auto", padding: "16px 20px 24px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 18, boxShadow: cardShadow }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Avatar name={`${form.firstName} ${form.lastName}`} size={60} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><Field label="First Name" value={form.firstName} onChange={upd("firstName")} /></div>
            <div style={{ flex: 1 }}><Field label="Last Name" value={form.lastName} onChange={upd("lastName")} /></div>
          </div>
          <Field label="Email" value={form.email} onChange={upd("email")} />
          <Field label="Phone Number" value={form.phone} onChange={upd("phone")} />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><Field label="City" value={form.city} onChange={upd("city")} /></div>
            <div style={{ flex: 1 }}><Field label="State" value={form.state} onChange={upd("state")} /></div>
          </div>
          <Field label="Headline" value={form.headline} onChange={upd("headline")} />
          <Field label="Portfolio" value={form.portfolio} onChange={upd("portfolio")} />
          <Field label="Resume" value={form.resume} onChange={upd("resume")} />
          <button onClick={() => go("jobSubmitted")} style={{ ...btnPrimary, background: C.blitz, color: "#fff", width: "100%", marginTop: 6 }}>Submit application</button>
        </div>
      </div>
    </div>
  );
}

function JobSubmittedScreen({ go }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.cream }}><TopBar title="Your Job Board" /><Wave /></div>
      <div style={{ flex: 1, background: C.blitz, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <div style={{ width: 78, height: 78, borderRadius: "50%", background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={40} color="#fff" strokeWidth={3} />
        </div>
        <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 21, color: "#fff" }}>Application submitted</div>
        <div style={{ fontFamily: "Montserrat", fontSize: 12, color: "rgba(255,255,255,0.75)", textAlign: "center", maxWidth: 220 }}>You'll hear back through Messages if the poster follows up.</div>
        <button onClick={() => go("home")} style={{ ...btnGhost, padding: "11px 26px" }}>Return home</button>
      </div>
    </div>
  );
}

function TipsScreen({ go, articleComments }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.cream }}><TopBar title="Tips and Tricks" /><Wave /></div>
      <div style={{ flex: 1, background: C.blitz, overflowY: "auto", padding: "16px 20px 24px" }}>
        <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 12, color: "rgba(255,255,255,0.85)", letterSpacing: 0.5, marginBottom: 10 }}>VIDEO OF THE WEEK</div>
        <div onClick={() => go("articleDetail", { article: articles[0] })} style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 22, cursor: "pointer", display: "flex", gap: 12, boxShadow: cardShadow }}>
          <div style={{ width: 72, height: 84, borderRadius: 10, background: `linear-gradient(140deg, ${C.roster}, ${C.blitzDark})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={20} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 12.5, color: C.ink }}>{videoOfWeek.series}: {videoOfWeek.name}</div>
            <div style={{ fontFamily: "Montserrat", fontSize: 11, color: C.blitz, fontWeight: 700, marginTop: 4 }}>{videoOfWeek.role}</div>
            <div style={{ fontFamily: "Montserrat", fontSize: 10.5, color: C.bleacher, marginTop: 2 }}>{videoOfWeek.location}</div>
          </div>
        </div>

        <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 12, color: "rgba(255,255,255,0.85)", letterSpacing: 0.5, marginBottom: 10 }}>HIGHLIGHTED ARTICLES</div>
        {articles.map((a) => (
          <ArticlePreview key={a.id} article={a} commentCount={articleComments[a.id]?.length || 0} onClick={() => go("articleDetail", { article: a })} />
        ))}
      </div>
    </div>
  );
}

function ArticleDetailScreen({ article, go, commentCount }) {
  if (!article) return null;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.blitz, padding: "16px 20px 18px" }}>
        <button onClick={() => go("tips")} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", marginBottom: 10 }}><ArrowLeft size={20} /></button>
        <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 16, color: "#fff", lineHeight: 1.3 }}>{article.title}</div>
        <div style={{ fontFamily: "Montserrat", fontSize: 11.5, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>{article.author} · {article.role}</div>
        <Wave flip style={{ marginTop: 12 }} />
      </div>
      <div style={{ flex: 1, background: C.cream, overflowY: "auto", padding: "8px 22px 26px" }}>
        {article.body.map((p, i) => <p key={i} style={{ fontFamily: "Montserrat", fontSize: 13, color: C.ink, lineHeight: 1.7, marginBottom: 14 }}>{p}</p>)}
        <div onClick={() => go("articleDiscussion", { article })} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: `1.5px solid ${C.line}`,
          borderRadius: 12, padding: "12px 14px", marginTop: 6, cursor: "pointer",
        }}>
          <span style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: 12.5, color: C.blitz }}>{commentCount} comment{commentCount === 1 ? "" : "s"} — join the discussion</span>
          <ChevronRight size={16} color={C.blitz} />
        </div>
      </div>
    </div>
  );
}

function ArticleDiscussionScreen({ article, articleComments, postArticleComment, go }) {
  if (!article) return null;
  const comments = articleComments[article.id] || [];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.cream }}>
        <TopBar title="Discussion" subtitle={article.title} onBack={() => go("articleDetail", { article })} />
        <Wave />
      </div>
      <div style={{ flex: 1, background: C.blitz, overflowY: "auto", padding: "18px 20px" }}>
        <CommentThread
          comments={comments}
          onPost={(text) => postArticleComment(article.id, text)}
          placeholder="Add a comment or question…"
          emptyText="No comments yet — start the conversation."
        />
      </div>
    </div>
  );
}

function MessagesScreen() {
  const threads = [
    { name: "Carla Jennings", preview: "Would love to see your portfolio — feel free to apply!", tag: "Her Game Plan · Graphic Designer", time: "2h" },
    { name: "Jessica Thomas", preview: "Happy to chat more about the Graphic Design Assistant role.", tag: "Victory Creative", time: "1d" },
    { name: "Emily Carter", preview: "Thanks for applying — we'll be in touch this week.", tag: "Promotion Media", time: "2d" },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.cream }}><TopBar title="Messages" subtitle="Direct messages from employers &amp; connections" /><Wave /></div>
      <div style={{ flex: 1, background: C.blitz, overflowY: "auto", padding: "16px 20px 24px" }}>
        {threads.map((t, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 13, marginBottom: 10, display: "flex", gap: 12, boxShadow: cardShadow, cursor: "pointer" }}>
            <Avatar name={t.name} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 12.5, color: C.ink }}>{t.name}</div>
                <div style={{ fontFamily: "Montserrat", fontSize: 10, color: C.bleacher, flexShrink: 0 }}>{t.time}</div>
              </div>
              <div style={{ fontFamily: "Montserrat", fontSize: 11, color: C.roster, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.preview}</div>
              <div style={{ fontFamily: "Montserrat", fontSize: 9.5, color: C.blitz, marginTop: 3, fontWeight: 700 }}>{t.tag}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   APP SHELL
--------------------------------------------------------- */
export default function HerGamePlanApp() {
  const [screen, setScreen] = useState("welcome");
  const [authMode, setAuthMode] = useState("signin");
  const [user, setUser] = useState({ firstName: "Emma", lastName: "Wilson", email: "emma@emmagraphics.com" });
  const [goals, setGoals] = useState(initialGoals);
  const [goalKey, setGoalKey] = useState("long");
  const [interests, setInterests] = useState(currentInterestsSeed);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [selectedArticle, setSelectedArticle] = useState(articles[0]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [articleComments, setArticleComments] = useState(seedArticleComments);
  const [goalComments, setGoalComments] = useState(seedGoalComments);
  const [cheeredGoals, setCheeredGoals] = useState(new Set());

  const go = (next, payload = {}) => {
    if (payload.mode) setAuthMode(payload.mode);
    if (payload.article) setSelectedArticle(payload.article);
    if (payload.job !== undefined) setSelectedJob(payload.job);
    if (payload.goalKey) setGoalKey(payload.goalKey);
    setScreen(next);
  };

  const toggleSave = (id) => setSavedJobs((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const postArticleComment = (articleId, text) => {
    setArticleComments((prev) => ({
      ...prev,
      [articleId]: [...(prev[articleId] || []), { id: `c${Date.now()}`, name: `${user.firstName} ${user.lastName}`, text, time: "now" }],
    }));
  };
  const postGoalComment = (key, text) => {
    setGoalComments((prev) => ({
      ...prev,
      [key]: [...prev[key], { id: `g${Date.now()}`, name: `${user.firstName} ${user.lastName}`, text, time: "now" }],
    }));
  };
  const toggleCheer = (key) => setCheeredGoals((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const showNav = !["welcome", "auth"].includes(screen);

  let body;
  switch (screen) {
    case "welcome": body = <WelcomeScreen go={go} />; break;
    case "auth": body = <AuthScreen mode={authMode} setMode={setAuthMode} go={go} setUser={setUser} />; break;
    case "home": body = <HomeScreen user={user} go={go} goals={goals} articleComments={articleComments} goalComments={goalComments} />; break;
    case "goals": body = <GoalsScreen goals={goals} setGoals={setGoals} go={go} />; break;
    case "goalDiscussion": body = <GoalDiscussionScreen goals={goals} goalKey={goalKey} goalComments={goalComments} postGoalComment={postGoalComment} cheeredGoals={cheeredGoals} toggleCheer={toggleCheer} go={go} />; break;
    case "jobs": body = <JobsScreen go={go} interests={interests} setInterests={setInterests} savedJobs={savedJobs} toggleSave={toggleSave} />; break;
    case "jobProfile": body = <JobProfileScreen go={go} job={selectedJob} user={user} />; break;
    case "jobSubmitted": body = <JobSubmittedScreen go={go} />; break;
    case "tips": body = <TipsScreen go={go} articleComments={articleComments} />; break;
    case "articleDetail": body = <ArticleDetailScreen article={selectedArticle} go={go} commentCount={articleComments[selectedArticle?.id]?.length || 0} />; break;
    case "articleDiscussion": body = <ArticleDiscussionScreen article={selectedArticle} articleComments={articleComments} postArticleComment={postArticleComment} go={go} />; break;
    case "messages": body = <MessagesScreen />; break;
    default: body = <WelcomeScreen go={go} />;
  }

  const unread = 1;

  return (
    <div style={{ minHeight: "100vh", background: "#EDEAF2", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0", fontFamily: "Montserrat" }}>
      <style>{FONT}</style>
      <div style={{ width: 390, height: 780, maxWidth: "100vw", maxHeight: "100vh", background: C.cream, borderRadius: 34, overflow: "hidden", boxShadow: "0 30px 60px rgba(35,20,50,0.35)", display: "flex", flexDirection: "column", border: "8px solid #17101f" }}>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{body}</div>
        {showNav && <NavBar screen={screen} go={go} unread={screen === "messages" ? 0 : unread} />}
      </div>
    </div>
  );
}
