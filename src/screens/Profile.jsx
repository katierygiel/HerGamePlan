import { useRef, useState } from "react";
import { Bell, Camera, ChevronRight, Download, Flag, Ban, Heart, MapPin, MessageCircle, Settings as Cog, Shield, Sparkles, Trash2, UserCheck, UserPlus, Trophy, Users, ExternalLink, FileText, LogOut, X } from "lucide-react";
import { useApp } from "../store";
import { INTEREST_OPTIONS, ROLES } from "../data/seed";
import { deleteMyAccount, exportMyData } from "../api/supa";
import { Avatar, Confirm, Empty, Field, IconBtn, Pill, Ring, Screen, Sheet } from "../ui";
import { ToggleRow } from "../controls";
import { MentorActions, setConnectSeg } from "./Connect";
import { FeedbackSheet } from "./Feedback";
import { LegalBody } from "./Legal";
import { goalStats } from "./Goals";
import { plural, resizeImage, timeAgo } from "../util";

/** open the screen a notification points at */
export function useOpenTarget() {
  const { go, tab } = useApp();
  return (to) => {
    if (!to) return;
    const tabs = ["home", "goals", "tips", "jobs", "connect"];
    if (to.name === "connect" && to.params?.view) setConnectSeg(to.params.view);
    if (tabs.includes(to.name)) tab(to.name);
    else go(to.name, to.params || {});
  };
}

/** the "current interests / suggested for you" pop-up from the prototype */
export function InterestsSheet({ open, onClose }) {
  const { me, act } = useApp();
  const toggle = (i) => act("updateMe", { interests: me.interests.includes(i) ? me.interests.filter((x) => x !== i) : [...me.interests, i] });
  const rest = INTEREST_OPTIONS.filter((i) => !me.interests.includes(i));
  return (
    <Sheet open={open} onClose={onClose} title="Your interests" tall>
      <h4 className="sheet-h4">Your current interests</h4>
      <div className="pills-wrap tight">
        {me.interests.length === 0 && <p className="sheet-text">None yet. Pick a few below.</p>}
        {me.interests.map((i) => <Pill key={i} variant="chip-dark" active onClick={() => toggle(i)}>{i} <X size={13} strokeWidth={3} /></Pill>)}
      </div>
      <h4 className="sheet-h4">Suggested for you…</h4>
      <div className="pills-wrap tight">{rest.map((i) => <Pill key={i} variant="chip-dark" onClick={() => toggle(i)}>{i}</Pill>)}</div>
      <button type="button" className="btn solid wide mt" onClick={onClose}>Done</button>
    </Sheet>
  );
}

/* --------------------------------- profile --------------------------------- */
export function Profile({ id }) {
  const { db, me, person, back, go, act, toast } = useApp();
  const isMe = id === "me" || id === me.id;
  const p = isMe ? person("me") : db.people.find((x) => x.id === id);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  if (!p) return <Screen title="Profile" onBack={back}><Empty icon={Users} title="Profile not found" /></Screen>;

  const connected = db.connections.includes(p.id);
  const goals = (isMe ? db.goals : p.goals).filter((g) => g.isPublic);
  const posts = db.posts.filter((x) => x.authorId === (isMe ? "me" : p.id)).slice(0, 3);
  const loc = [p.city, p.state].filter(Boolean).join(", ");
  const link = (u) => (/^https?:\/\//.test(u) ? u : `https://${u}`);
  const message = () => { act("startConversation", { userId: p.id }); go("chat", { userId: p.id }); };

  return (
    <Screen title={isMe ? "My profile" : "Profile"} onBack={back}
      right={isMe ? <IconBtn icon={Cog} label="Settings" onClick={() => go("settings")} /> : <IconBtn icon={Flag} label="Report or block" onClick={() => setMenu(true)} />}>
      <article className="card pad prof">
        <Avatar person={p} size={96} className="prof-av" />
        <h2>{p.name}</h2>
        {p.headline && <p className="prof-head">{p.headline}</p>}
        <div className="prof-meta">
          {loc && <span><MapPin size={14} /> {loc}</span>}
          {p.role && <Pill variant="chip-dark">{p.role}</Pill>}
          {p.mentor && <Pill variant="solid"><Sparkles size={12} /> Mentor</Pill>}
        </div>
        <div className="stats3">
          <div><b>{(isMe ? db.goals : p.goals).filter((g) => g.completedAt).length}</b><span>Goals done</span></div>
          <div><b>{goals.length}</b><span>Public goals</span></div>
          <div><b>{posts.length}</b><span>Posts</span></div>
        </div>
        {isMe ? (
          <button type="button" className="btn solid wide" onClick={() => go("editProfile")}>Edit profile</button>
        ) : (
          <div className="prof-actions">
            <button type="button" className={`btn ${connected ? "ghost-dark" : "solid"} grow`} aria-pressed={connected}
              onClick={() => { act("toggleConnect", { id: p.id }); toast(connected ? `Removed ${p.name.split(" ")[0]} from your connections` : `You're now connected with ${p.name.split(" ")[0]}`); }}>
              {connected ? <><UserCheck size={17} /> Connected</> : <><UserPlus size={17} /> Connect</>}
            </button>
            <button type="button" className="btn ghost-dark grow" onClick={message}><MessageCircle size={17} /> Message</button>
          </div>
        )}
        {!isMe && p.mentor && (
          <div className="prof-mentor">
            <b>Open to mentoring · {p.capacity}</b>
            <MentorActions m={p} />
          </div>
        )}
      </article>

      {p.bio && <section className="card pad"><h3 className="sec-h">About</h3><p className="body-p">{p.bio}</p></section>}

      {(p.interests?.length > 0 || p.expertise?.length > 0) && (
        <section className="card pad">
          <h3 className="sec-h">{p.mentor ? "Can help with" : "Interests"}</h3>
          <div className="pills-wrap tight">{(p.mentor ? p.expertise : p.interests).map((i) => <Pill key={i} variant="solid">{i}</Pill>)}</div>
        </section>
      )}

      {isMe && (p.portfolio || p.resume) && (
        <section className="card pad">
          <h3 className="sec-h">Portfolio &amp; resume</h3>
          {p.portfolio && <a className="linkrow" href={link(p.portfolio)} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {p.portfolio}</a>}
          {p.resume && <span className="linkrow"><FileText size={16} /> {p.resume}</span>}
        </section>
      )}

      {goals.length > 0 && (
        <section className="card pad">
          <h3 className="sec-h">Public goals</h3>
          {goals.map((g) => {
            const { done, total } = goalStats(g);
            return (
              <button key={g.id} type="button" className="goalrow" onClick={() => go("goalSupport", { goalId: g.id })}>
                <Ring value={done} max={total} size={46} stroke={5} tone="dark" label={`${Math.round((done / Math.max(total, 1)) * 100)}%`} />
                <span><b>{g.title}</b><small><Heart size={12} /> {g.cheers.length} · <MessageCircle size={12} /> {g.comments.length}</small></span>
                <ChevronRight size={18} />
              </button>
            );
          })}
        </section>
      )}

      {posts.length > 0 && (
        <section className="card pad">
          <h3 className="sec-h">Recent posts</h3>
          {posts.map((x) => <div key={x.id} className="mini-post"><p>{x.text}</p><small>{timeAgo(x.ts)} · {plural(x.likes.length, "like")}</small></div>)}
        </section>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title={p.name}>
        <div className="menu-list">
          <button type="button" onClick={() => { setMenu(false); setReporting(true); }}><Flag size={18} /> Report profile</button>
          <button type="button" className="danger" onClick={() => { setMenu(false); setConfirmBlock(true); }}><Ban size={18} /> Block {p.name.split(" ")[0]}</button>
        </div>
      </Sheet>
      <Sheet open={reporting} onClose={() => setReporting(false)} title="Report this profile">
        <div className="menu-list">
          <p className="sheet-text">Why are you reporting this? Reports are private.</p>
          {["Spam or scam", "Harassment or hate", "Fake profile", "Something else"].map((r) => (
            <button key={r} type="button" onClick={() => { act("report", { kind: "profile", id: p.id, reason: r, snapshot: p.name }); setReporting(false); toast("Thanks for reporting. Our team will review it."); }}>{r}</button>
          ))}
        </div>
      </Sheet>
      <Confirm open={confirmBlock} title={`Block ${p.name}?`} text="You won't see their posts or comments. You can unblock them in Settings." confirmLabel="Block" danger
        onConfirm={() => { act("blockUser", { id: p.id }); toast(`${p.name} is blocked`); back(); }} onClose={() => setConfirmBlock(false)} />
    </Screen>
  );
}

/* ------------------------------- edit profile ------------------------------- */
export function EditProfile() {
  const { me, act, back, toast } = useApp();
  const [f, setF] = useState({ firstName: me.firstName, lastName: me.lastName, headline: me.headline, role: me.role, city: me.city, state: me.state, bio: me.bio, portfolio: me.portfolio, resume: me.resume, phone: me.phone, photo: me.photo });
  const [interests, setInterests] = useState(false);
  const [err, setErr] = useState({});
  const fileRef = useRef(null);
  const up = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); setErr((e) => ({ ...e, [k]: undefined })); };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { up("photo")(await resizeImage(file)); } catch (er) { toast(er.message, "note"); }
  };
  const save = () => {
    const er = {};
    if (!f.firstName.trim()) er.firstName = "Required";
    if (!f.lastName.trim()) er.lastName = "Required";
    if (Object.keys(er).length) { setErr(er); return; }
    act("updateMe", { ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim() });
    toast("Profile saved");
    back();
  };

  return (
    <Screen title="Edit profile" onBack={back}>
      <div className="card pad">
        <div className="photo-pick">
          <button type="button" className="photo-btn" onClick={() => fileRef.current?.click()} aria-label="Change profile photo">
            <Avatar person={{ name: `${f.firstName} ${f.lastName}`, photo: f.photo }} size={96} />
            <span className="cam"><Camera size={16} /></span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          {f.photo && <button type="button" className="inline-link danger" onClick={() => up("photo")(null)}>Remove photo</button>}
        </div>
        <div className="two">
          <Field label="First name" value={f.firstName} onChange={up("firstName")} error={err.firstName} />
          <Field label="Last name" value={f.lastName} onChange={up("lastName")} error={err.lastName} />
        </div>
        <Field label="Headline" value={f.headline} onChange={up("headline")} maxLength={70} placeholder="e.g. Sports marketing student" />
        <div className="field">
          <label>Role</label>
          <div className="pills-wrap tight">{ROLES.map((r) => <Pill key={r.id} variant="chip-dark" active={f.role === r.id} onClick={() => up("role")(r.id)}>{r.id}</Pill>)}</div>
        </div>
        <div className="two">
          <Field label="City" value={f.city} onChange={up("city")} />
          <Field label="State" value={f.state} onChange={up("state")} />
        </div>
        <Field label="About you" textarea rows={4} value={f.bio} onChange={up("bio")} maxLength={240} hint={`${f.bio.length}/240`} />
        <Field label="Portfolio" value={f.portfolio} onChange={up("portfolio")} placeholder="yourname.portfolio.com" inputMode="url" />
        <Field label="Resume" value={f.resume} onChange={up("resume")} placeholder="Link or file name" />
        <Field label="Phone (only shared when you apply)" type="tel" value={f.phone} onChange={up("phone")} />
        <button type="button" className="rowbtn" onClick={() => setInterests(true)}>
          <span><b>Interests</b><small>{me.interests.length ? me.interests.join(", ") : "None yet"}</small></span><ChevronRight size={18} />
        </button>
        <button type="button" className="btn solid wide" onClick={save}>Save changes</button>
      </div>
      <InterestsSheet open={interests} onClose={() => setInterests(false)} />
    </Screen>
  );
}

/* ---------------------------------- settings ---------------------------------- */
export function Settings() {
  const { db, me, act, back, A, toast, go } = useApp();
  const [legal, setLegal] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [del, setDel] = useState(false);
  const [exporting, setExporting] = useState(false);
  const blocked = db.blocked.map((id) => db.people.find((p) => p.id === id)).filter(Boolean);

  const doExport = async () => {
    setExporting(true);
    try {
      const data = await exportMyData(me.userId);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = "her-game-plan-my-data.json"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast("Your data was downloaded");
    } catch (e) { toast("Couldn't export your data. Try again.", "note"); }
    setExporting(false);
  };
  const doDelete = async () => {
    try { await deleteMyAccount(); } catch (e) { toast("Couldn't delete your account. Please try again.", "note"); }
  };

  return (
    <Screen title="Settings" onBack={back}>
      <section className="card pad">
        <h3 className="sec-h">Account</h3>
        <div className="kv"><span>Name</span><b>{`${me.firstName} ${me.lastName}`.trim()}</b></div>
        <div className="kv"><span>Email</span><b>{me.email}</b></div>
        <button type="button" className="rowbtn" onClick={() => go("editProfile")}><span><b>Edit profile</b><small>Photo, headline, links, interests</small></span><ChevronRight size={18} /></button>
      </section>

      <section className="card pad">
        <h3 className="sec-h">Mentoring</h3>
        {me.mentor ? (
          <div className="rowbtn static"><span><b>You're an approved mentor</b><small>{me.capacity || "Mentees can request you from the Mentors tab."}</small></span><Sparkles size={18} /></div>
        ) : db.mentorApp?.status === "pending" ? (
          <div className="rowbtn static"><span><b>Application under review</b><small>We'll notify you when you're approved.</small></span></div>
        ) : (
          <button type="button" className="rowbtn" onClick={() => go("mentorApply")}><span><b>Apply to be a mentor</b><small>Share your experience with women starting out</small></span><ChevronRight size={18} /></button>
        )}
      </section>

      <section className="card pad">
        <h3 className="sec-h">Notifications</h3>
        <ToggleRow title="In-app alerts" text="Pop-ups when someone cheers, replies, messages you, or responds to your requests." checked={db.settings.notifications} onChange={(v) => act("setSetting", { key: "notifications", value: v })} />
      </section>

      <section className="card pad">
        <h3 className="sec-h">Blocked members</h3>
        {blocked.length === 0 && <p className="body-p">You haven't blocked anyone.</p>}
        {blocked.map((p) => (
          <div key={p.id} className="person-row static">
            <Avatar person={p} size={38} /><span><b>{p.name}</b><small>{p.headline}</small></span>
            <button type="button" className="btn ghost-dark sm" onClick={() => { act("unblockUser", { id: p.id }); toast(`${p.name} is unblocked`); }}>Unblock</button>
          </div>
        ))}
      </section>

      <section className="card pad">
        <h3 className="sec-h">Help us improve</h3>
        <button type="button" className="rowbtn" onClick={() => setFeedback(true)}><span><b>Send feedback</b><small>Ideas, bugs, or anything on your mind</small></span><ChevronRight size={18} /></button>
      </section>

      {me.isAdmin && (
        <section className="card pad">
          <h3 className="sec-h">Admin</h3>
          <button type="button" className="rowbtn" onClick={() => go("admin")}><span><b>Admin dashboard</b><small>Stats, reports, mentors, feedback, content</small></span><Shield size={18} /></button>
        </section>
      )}

      <section className="card pad">
        <h3 className="sec-h">Privacy &amp; data</h3>
        <button type="button" className="rowbtn" onClick={() => setLegal(true)}><span><b>Terms &amp; Privacy</b><small>Community standards and your data</small></span><ChevronRight size={18} /></button>
        <button type="button" className="rowbtn" onClick={doExport} disabled={exporting}><span><b>{exporting ? "Preparing…" : "Download my data"}</b><small>A copy of everything you've shared</small></span><Download size={18} /></button>
        <button type="button" className="rowbtn danger" onClick={() => setDel(true)}><span><b>Delete my account</b><small>Permanently removes your profile, goals, posts, and messages</small></span><Trash2 size={18} /></button>
        <p className="body-p small">Her Game Plan · The Women Playmakers' Network · early access</p>
      </section>

      <button type="button" className="btn white wide mt" onClick={() => A.signOut()}><LogOut size={17} /> Sign out</button>

      <Confirm open={del} title="Delete your account?" text="This permanently deletes your profile, goals, posts, comments, and messages. It can't be undone." confirmLabel="Delete everything" danger
        onConfirm={doDelete} onClose={() => setDel(false)} />
      <FeedbackSheet open={feedback} onClose={() => setFeedback(false)} />
      <Sheet open={legal} onClose={() => setLegal(false)} title="Terms & Privacy" tall><LegalBody /></Sheet>
    </Screen>
  );
}

/* ------------------------------- notifications ------------------------------- */
const KIND_ICON = { cheer: Heart, message: MessageCircle, comment: MessageCircle, mentor: Users, like: Heart, welcome: Trophy };

export function Notifications() {
  const { db, back, act } = useApp();
  const open = useOpenTarget();
  const list = db.notifications;
  const unread = list.filter((n) => !n.read).length;

  return (
    <Screen title="Notifications" onBack={back} right={unread > 0 ? <button type="button" className="hdr-link" onClick={() => act("readAllNotifications")}>Mark all read</button> : null}>
      {list.length === 0 ? <Empty icon={Bell} title="You're all caught up" text="Cheers, replies, and updates will show up here." /> : list.map((n) => {
        const Icon = KIND_ICON[n.kind] || Bell;
        return (
          <button key={n.id} type="button" className={`card notif ${n.read ? "" : "unread"}`} onClick={() => { act("readNotification", { id: n.id }); open(n.to); }}>
            <span className="n-ic"><Icon size={18} /></span>
            <span className="n-tx"><b>{n.text}</b><small>{timeAgo(n.ts)}</small></span>
            {!n.read && <i className="n-dot" aria-label="Unread" />}
          </button>
        );
      })}
    </Screen>
  );
}
