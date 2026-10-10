import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, Flag, Heart, MessageCircle, MoreHorizontal, Plus, Ban, Trash2, Users, Sparkles, Info, Send } from "lucide-react";
import { useApp } from "../store";
import { Avatar, Comment, Composer, Confirm, Empty, Field, IconBtn, Pill, Screen, SearchBar, Segmented, Sheet } from "../ui";
import { INTEREST_OPTIONS } from "../data/seed";
import { mentorMatch, plural, shortTime, timeAgo } from "../util";
import { uid } from "../api/local";

let lastSeg = "feed";
export const setConnectSeg = (s) => { lastSeg = s; };
const TYPES = [
  { id: "update", label: "Update" },
  { id: "win", label: "Win" },
  { id: "question", label: "Question" },
  { id: "event", label: "Event" },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.id, t.label]));

export default function Connect({ seg: initial }) {
  const { db, go, unreadMessages } = useApp();
  const [seg, setSegState] = useState(initial || lastSeg);
  const setSeg = (s) => { lastSeg = s; setSegState(s); };
  const [composing, setComposing] = useState(false);
  const [picking, setPicking] = useState(false);

  const right = seg === "feed"
    ? <IconBtn icon={Plus} label="New post" onClick={() => setComposing(true)} />
    : seg === "messages" ? <IconBtn icon={Plus} label="New message" onClick={() => setPicking(true)} /> : null;

  return (
    <Screen title="Connect" right={right}>
      <Segmented value={seg} onChange={setSeg} options={[
        { id: "feed", label: "Feed" },
        { id: "messages", label: "Messages", count: unreadMessages },
        { id: "mentors", label: "Mentors" },
      ]} />
      {seg === "feed" && <Feed onCompose={() => setComposing(true)} />}
      {seg === "messages" && <Inbox onNew={() => setPicking(true)} />}
      {seg === "mentors" && <Mentors />}
      <ComposeSheet open={composing} onClose={() => setComposing(false)} />
      <NewMessageSheet open={picking} onClose={() => setPicking(false)} onPick={(id) => { setPicking(false); go("chat", { userId: id }); }} />
    </Screen>
  );
}

/* --------------------------------- feed --------------------------------- */
function Feed({ onCompose }) {
  const { db, me, person } = useApp();
  const [type, setType] = useState("all");
  const posts = db.posts.filter((p) => !db.blocked.includes(p.authorId) && (type === "all" || p.type === type));
  const mePerson = person("me");

  return (
    <>
      <button type="button" className="card compose-bar" onClick={onCompose}>
        <Avatar person={mePerson} size={40} />
        <span>Share an update, win, or question…</span>
      </button>
      <div className="chips-row" role="tablist" aria-label="Post types">
        <Pill variant="chip" active={type === "all"} onClick={() => setType("all")}>All</Pill>
        {TYPES.map((t) => <Pill key={t.id} variant="chip" active={type === t.id} onClick={() => setType(t.id)}>{t.label === "Win" ? "Wins" : `${t.label}s`}</Pill>)}
      </div>
      {posts.length === 0
        ? <Empty icon={Users} title="No posts here yet" text="Be the first to share something with the community." action={<button type="button" className="btn white sm" onClick={onCompose}>Create a post</button>} />
        : posts.map((p) => <PostCard key={p.id} p={p} />)}
    </>
  );
}

const REASONS = ["Spam or scam", "Harassment or hate", "Misleading or unsafe", "Something else"];

function PostCard({ p }) {
  const { db, person, act, go, toast } = useApp();
  const author = person(p.authorId);
  const mine = p.authorId === "me";
  const liked = p.likes.includes("me");
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const comments = p.comments.filter((c) => !db.blocked.includes(c.authorId));

  return (
    <article className="card post">
      <header>
        <button type="button" className="po-id" onClick={() => go("profile", { id: author.id })}>
          <Avatar person={author} size={42} />
          <span><b>{author.name}</b><small>{author.headline || "Member"}</small></span>
        </button>
        <span className="po-time">{timeAgo(p.ts)}</span>
        <button type="button" className="ibtn light" aria-label="More options" onClick={() => setMenu(true)}><MoreHorizontal size={20} /></button>
      </header>
      <Pill variant="tag" className={p.type}>{TYPE_LABEL[p.type] || "Update"}</Pill>
      <p className="po-text">{p.text}</p>
      {p.event && (
        <div className="eventbox"><CalendarDays size={20} /><div><b>{p.event.when}</b><small>{p.event.where}</small></div></div>
      )}
      <footer>
        <button type="button" className={liked ? "on" : ""} aria-pressed={liked} aria-label={`${liked ? "Unlike" : "Like"} (${p.likes.length})`} onClick={() => act("likePost", { id: p.id })}>
          <Heart size={18} fill={liked ? "currentColor" : "none"} /> {p.likes.length}
        </button>
        <button type="button" aria-expanded={open} aria-label={`Comments (${comments.length})`} onClick={() => setOpen((o) => !o)}><MessageCircle size={18} /> {comments.length}</button>
      </footer>
      {open && (
        <div className="po-comments">
          {comments.map((c) => <Comment key={c.id} c={c} onPerson={(id) => go("profile", { id })} />)}
          <Composer className="inline" placeholder="Add a comment…" onSend={(text) => act("commentPost", { id: p.id, text })} />
        </div>
      )}
      <PostMenu open={menu} onClose={() => setMenu(false)} post={p} author={author} mine={mine} />
    </article>
  );
}

function PostMenu({ open, onClose, post, author, mine }) {
  const { act, toast, go } = useApp();
  const [step, setStep] = useState("menu");
  const [confirm, setConfirm] = useState(null);
  useEffect(() => { if (open) setStep("menu"); }, [open]);
  return (
    <>
      <Sheet open={open} onClose={onClose} title={step === "report" ? "Report this post" : "Post options"}>
        {step === "menu" && (
          <div className="menu-list">
            {mine ? (
              <button type="button" className="danger" onClick={() => { onClose(); setConfirm("delete"); }}><Trash2 size={18} /> Delete post</button>
            ) : (<>
              <button type="button" onClick={() => { onClose(); go("profile", { id: author.id }); }}><Users size={18} /> View {author.name.split(" ")[0]}'s profile</button>
              <button type="button" onClick={() => setStep("report")}><Flag size={18} /> Report post</button>
              <button type="button" className="danger" onClick={() => { onClose(); setConfirm("block"); }}><Ban size={18} /> Block {author.name.split(" ")[0]}</button>
            </>)}
          </div>
        )}
        {step === "report" && (
          <div className="menu-list">
            <p className="sheet-text">Why are you reporting this? Reports are private.</p>
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => { act("report", { kind: "post", id: post.id, reason: r, snapshot: post.text }); onClose(); toast("Thanks for reporting. Our team will review it."); }}>{r}</button>
            ))}
          </div>
        )}
      </Sheet>
      <Confirm open={confirm === "delete"} title="Delete this post?" text="This can't be undone." confirmLabel="Delete" danger onConfirm={() => { act("deletePost", { id: post.id }); toast("Post deleted"); }} onClose={() => setConfirm(null)} />
      <Confirm open={confirm === "block"} title={`Block ${author.name}?`} text="You won't see their posts or comments, and they won't be able to message you. You can unblock them in Settings." confirmLabel="Block" danger
        onConfirm={() => { act("blockUser", { id: author.id }); toast(`${author.name} is blocked`); }} onClose={() => setConfirm(null)} />
    </>
  );
}

function ComposeSheet({ open, onClose }) {
  const { A, toast } = useApp();
  const [type, setType] = useState("update");
  const [text, setText] = useState("");
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("Virtual");
  const [err, setErr] = useState("");

  const post = () => {
    if (!text.trim()) { setErr("Write something to share"); return; }
    if (type === "event" && !when.trim()) { setErr("Add a date and time for your event"); return; }
    A.createPost({ type, text: text.trim(), ...(type === "event" ? { event: { when: when.trim(), where: where.trim() || "TBD" } } : {}) });
    setText(""); setWhen(""); setType("update"); setErr("");
    onClose();
  };
  const placeholders = { update: "What's on your mind?", win: "Celebrate something. Big or small!", question: "Ask the community…", event: "Tell people about your event…" };
  return (
    <Sheet open={open} onClose={onClose} title="New post" tall>
      <div className="pills-wrap tight">{TYPES.map((t) => <Pill key={t.id} variant="chip-dark" active={type === t.id} onClick={() => { setType(t.id); setErr(""); }}>{t.label}</Pill>)}</div>
      <Field textarea rows={5} value={text} onChange={(v) => { setText(v); setErr(""); }} placeholder={placeholders[type]} maxLength={400} error={!text.trim() ? err : ""} hint={`${text.length}/400`} />
      {type === "event" && (
        <div className="two">
          <Field label="When" value={when} onChange={(v) => { setWhen(v); setErr(""); }} placeholder="Thu, Oct 16 · 7 PM ET" error={text.trim() ? err : ""} />
          <Field label="Where" value={where} onChange={setWhere} placeholder="Virtual or city" />
        </div>
      )}
      <button type="button" className="btn solid wide" onClick={post}>Post</button>
    </Sheet>
  );
}

/* -------------------------------- messages -------------------------------- */
function Inbox({ onNew }) {
  const { db, person, go } = useApp();
  const [q, setQ] = useState("");
  const convs = db.conversations
    .filter((c) => !db.blocked.includes(c.userId) && c.messages.length > 0)
    .filter((c) => person(c.userId).name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.messages[b.messages.length - 1].ts - a.messages[a.messages.length - 1].ts);

  return (
    <>
      <SearchBar value={q} onChange={setQ} placeholder="Search messages" />
      {convs.length === 0 ? (
        <Empty icon={MessageCircle} title={q ? "No conversations found" : "No messages yet"} text="Introduce yourself to another member or ask a mentor for advice."
          action={<button type="button" className="btn white sm" onClick={onNew}>Start a conversation</button>} />
      ) : convs.map((c) => {
        const p = person(c.userId);
        const last = c.messages[c.messages.length - 1];
        return (
          <button key={c.id} type="button" className={`card convo ${c.unread ? "unread" : ""}`} onClick={() => go("chat", { userId: c.userId })}>
            <Avatar person={p} size={48} />
            <span className="cv-main">
              <span className="cv-top"><b>{p.name}</b><small>{shortTime(last.ts)}</small></span>
              <span className="cv-prev">{last.from === "me" ? "You: " : ""}{last.text}</span>
            </span>
            {c.unread > 0 && <i className="cv-dot" aria-label={`${c.unread} unread`}>{c.unread}</i>}
          </button>
        );
      })}
    </>
  );
}

function NewMessageSheet({ open, onClose, onPick }) {
  const { db, person } = useApp();
  const [q, setQ] = useState("");
  const ids = useMemo(() => {
    const first = new Set([...db.connections, ...db.people.filter((p) => p.mentor).map((p) => p.id)]);
    const rest = db.people.map((p) => p.id).filter((id) => !first.has(id));
    return [...first, ...rest].filter((id) => !db.blocked.includes(id));
  }, [db.connections, db.people, db.blocked]);
  const list = ids.map(person).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Sheet open={open} onClose={onClose} title="New message" tall>
      <SearchBar value={q} onChange={setQ} placeholder="Search members" />
      <div className="menu-list">
        {list.map((p) => (
          <button key={p.id} type="button" className="person-row" onClick={() => { setQ(""); onPick(p.id); }}>
            <Avatar person={p} size={40} /><span><b>{p.name}</b><small>{p.headline || p.role || "Member"}</small></span>
          </button>
        ))}
        {list.length === 0 && <p className="sheet-text">{db.people.length === 0 ? "You're one of the first here! Invite a friend to join." : "No one found."}</p>}
      </div>
    </Sheet>
  );
}

export function Chat({ userId }) {
  const { db, person, A, act, back, go } = useApp();
  const p = person(userId);
  const conv = db.conversations.find((c) => c.userId === userId);
  const msgs = conv ? conv.messages : [];
  const endRef = useRef(null);
  const blocked = db.blocked.includes(userId);

  useEffect(() => { if (conv && conv.unread > 0) act("markRead", { userId }); }, [conv, userId, act]);
  useEffect(() => { endRef.current?.scrollIntoView?.({ block: "end" }); }, [msgs.length]);

  return (
    <Screen title={p.name} sub={p.headline} onBack={back} right={<IconBtn icon={Info} label="View profile" onClick={() => go("profile", { id: userId })} />}
      footer={blocked ? <div className="blocked-note">You've blocked this member.</div> : <Composer onSend={(t) => A.send(userId, t)} placeholder={`Message ${p.name.split(" ")[0]}…`} />}>
      <div className="chat">
        {msgs.length === 0 && <Empty icon={Sparkles} title={`Say hi to ${p.name.split(" ")[0]}`} text="Share a little about yourself and what you're hoping to learn." />}
        {msgs.map((m, i) => {
          const mine = m.from === "me";
          const showTime = i === 0 || m.ts - msgs[i - 1].ts > 1000 * 60 * 60 * 3;
          return (
            <div key={m.id}>
              {showTime && <div className="stamp">{new Date(m.ts).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}</div>}
              <div className={`bubble ${mine ? "me" : "them"}`}>{m.text}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </Screen>
  );
}

/* --------------------------------- mentors --------------------------------- */
function Mentors() {
  const { db, me, go } = useApp();
  const [field, setField] = useState("All");
  const mentors = db.people.filter((p) => p.mentor && !db.blocked.includes(p.id));
  const fields = ["All", ...Array.from(new Set(mentors.map((m) => m.field).filter(Boolean)))];
  const list = mentors
    .filter((m) => field === "All" || m.field === field)
    .sort((a, b) => (mentorMatch(b, me.interests) || 0) - (mentorMatch(a, me.interests) || 0));
  const app = db.mentorApp;
  return (
    <>
      {me.mentor && <IncomingRequests />}
      <div className="card pad intro">
        <Sparkles size={22} />
        <div><h3>Find a mentor who's walked your path</h3><p>Every mentor is personally approved by our team. Request an intro in under a minute.</p></div>
      </div>
      {mentors.length > 0 && (
        <div className="chips-row" role="tablist" aria-label="Mentor fields">
          {fields.map((f) => <Pill key={f} variant="chip" active={field === f} onClick={() => setField(f)}>{f}</Pill>)}
        </div>
      )}
      {list.map((m) => <MentorCard key={m.id} m={m} />)}
      {mentors.length === 0 && (
        <Empty icon={Users} title="Mentors are joining soon" text="We're personally approving our first mentors. Check back soon, or apply below if you have experience to share." />
      )}
      {!me.mentor && (
        <div className="card pad become">
          <h3>Have experience to share?</h3>
          {app?.status === "pending"
            ? <p>Thanks for applying! We're reviewing your application and will notify you.</p>
            : <><p>Apply to become a Her Game Plan mentor. We review every application.</p>
              <button type="button" className="btn solid wide" onClick={() => go("mentorApply")}>{app?.status === "declined" ? "Apply again" : "Apply to mentor"}</button></>}
        </div>
      )}
    </>
  );
}

/** requests people have sent to me as a mentor */
function IncomingRequests() {
  const { db, person, act, go, toast } = useApp();
  const list = db.incomingRequests.filter((r) => !db.blocked.includes(r.menteeId) && r.status !== "declined");
  if (list.length === 0) return null;
  const answer = (r, status) => { act("answerRequest", { id: r.id, status }); toast(status === "accepted" ? "Accepted. Say hello!" : status === "waitlisted" ? "Added to your waitlist" : "Declined"); };
  return (
    <section className="card pad">
      <h3 className="sec-h">Mentorship requests</h3>
      {list.map((r) => {
        const p = person(r.menteeId);
        return (
          <div key={r.id} className="req">
            <button type="button" className="po-id" onClick={() => go("profile", { id: p.id })}><Avatar person={p} size={40} /><span><b>{p.name}</b><small>{p.headline || p.role || "Member"} · {timeAgo(r.ts)}</small></span></button>
            <p className="req-msg">{r.message}</p>
            {r.status === "pending" ? (
              <div className="row-btns">
                <button type="button" className="btn solid sm" onClick={() => answer(r, "accepted")}><Check size={15} /> Accept</button>
                <button type="button" className="btn ghost-dark sm" onClick={() => answer(r, "waitlisted")}>Waitlist</button>
                <button type="button" className="btn ghost-dark sm" onClick={() => answer(r, "declined")}>Decline</button>
              </div>
            ) : r.status === "accepted" ? (
              <button type="button" className="btn solid sm" onClick={() => go("chat", { userId: p.id })}><MessageCircle size={15} /> Message {p.name.split(" ")[0]}</button>
            ) : <span className="status waitlist">On your waitlist</span>}
          </div>
        );
      })}
    </section>
  );
}

/** application form: reviewed by an admin before the person appears as a mentor */
export function MentorApply() {
  const { act, back, toast, me } = useApp();
  const [field, setField] = useState("");
  const [expertise, setExpertise] = useState([]);
  const [capacity, setCapacity] = useState("Open to 1 mentee");
  const [why, setWhy] = useState("");
  const [err, setErr] = useState("");
  const toggle = (i) => setExpertise((s) => (s.includes(i) ? s.filter((x) => x !== i) : s.length < 6 ? [...s, i] : s));
  const submit = () => {
    if (!field.trim()) { setErr("Tell us your field"); return; }
    if (expertise.length === 0) { setErr("Pick at least one thing you can help with"); return; }
    if (why.trim().length < 20) { setErr("Add a sentence or two about your experience"); return; }
    act("applyMentor", { app: { id: uid(), field: field.trim(), expertise, capacity, why: why.trim() } });
    toast("Application sent. We'll be in touch!", "win");
    back();
  };
  return (
    <Screen title="Mentor application" sub="Reviewed by our team" onBack={back}>
      <div className="card pad">
        <p className="body-p">Hi {me.firstName}! Mentors are real women in sports volunteering their time. Tell us a little about you.</p>
        <Field label="Your field" value={field} onChange={(v) => { setField(v); setErr(""); }} placeholder="e.g. Marketing, Coaching, Design" maxLength={40} />
        <div className="field">
          <label>I can help with (up to 6)</label>
          <div className="pills-wrap tight">{INTEREST_OPTIONS.map((i) => <Pill key={i} variant="chip-dark" active={expertise.includes(i)} onClick={() => { toggle(i); setErr(""); }}>{i}</Pill>)}</div>
        </div>
        <div className="field">
          <label>How many mentees can you take on?</label>
          <div className="pills-wrap tight">{["Open to 1 mentee", "Open to 2 mentees", "Open to 3 mentees"].map((c) => <Pill key={c} variant="chip-dark" active={capacity === c} onClick={() => setCapacity(c)}>{c}</Pill>)}</div>
        </div>
        <Field label="About your experience" textarea rows={5} value={why} onChange={(v) => { setWhy(v); setErr(""); }} maxLength={600} placeholder="Your role, how long you've been in sports, and why you want to mentor." hint={`${why.length}/600`} />
        {err && <p className="ferr" role="alert">{err}</p>}
        <button type="button" className="btn solid wide" onClick={submit}>Submit application</button>
      </div>
    </Screen>
  );
}

function MentorCard({ m }) {
  const { me, go } = useApp();
  const pct = mentorMatch(m, me.interests);
  return (
    <article className="card mentor">
      <button type="button" className="mn-head" onClick={() => go("profile", { id: m.id })}>
        <Avatar person={m} size={58} />
        <span>
          <b>{m.name}</b>
          <small>{m.headline}</small>
          <em>{m.capacity}</em>
        </span>
        {pct != null && pct > 0 && <span className="mn-match">{pct}%<i>match</i></span>}
      </button>
      <div className="pills-wrap tight">{m.expertise.map((e) => <Pill key={e} variant="chip-dark">{e}</Pill>)}</div>
      <MentorActions m={m} />
    </article>
  );
}

/** request / pending / accepted / waitlist controls, reused on profile pages */
export function MentorActions({ m }) {
  const { db, A, act, go, toast } = useApp();
  const req = db.mentorRequests.find((r) => r.mentorId === m.id);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const prompts = ["I'm breaking into the industry", "I'd love career advice", "I want feedback on my work", "I'm making a career change"];

  const send = () => { A.requestMentor(m.id, msg.trim() || "Hi! I'd love to connect and learn from your experience."); setOpen(false); setMsg(""); };

  return (
    <>
      <div className="mn-actions">
        {!req && <button type="button" className="btn solid sm grow" onClick={() => setOpen(true)}>Request mentorship</button>}
        {req?.status === "pending" && (<>
          <span className="status pending grow">Request pending…</span>
          <button type="button" className="inline-link" onClick={() => { act("cancelMentorRequest", { mentorId: m.id }); toast("Request canceled"); }}>Cancel</button>
        </>)}
        {req?.status === "accepted" && <button type="button" className="btn solid sm grow" onClick={() => go("chat", { userId: m.id })}><MessageCircle size={16} /> Message {m.name.split(" ")[0]}</button>}
        {req?.status === "waitlisted" && <span className="status waitlist grow">On the waitlist</span>}
        {req?.status === "declined" && <span className="status waitlist grow">Not available right now</span>}
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Request ${m.name.split(" ")[0]} as a mentor`} tall>
        <p className="sheet-text">Introduce yourself and what you'd like help with. A clear, specific note gets the best response.</p>
        <div className="pills-wrap tight">{prompts.map((p) => <Pill key={p} variant="chip-dark" onClick={() => setMsg((x) => (x ? `${x} ${p}.` : `${p}.`))}>{p}</Pill>)}</div>
        <Field textarea rows={5} value={msg} onChange={setMsg} maxLength={400} placeholder="Hi! I'm… and I'd love your advice on…" hint={`${msg.length}/400`} />
        <button type="button" className="btn solid wide" onClick={send}><Send size={16} /> Send request</button>
      </Sheet>
    </>
  );
}
