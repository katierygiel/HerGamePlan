import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Briefcase, Check, ClipboardList, MapPin, Plus, SlidersHorizontal, Trash2, Upload, X } from "lucide-react";
import { useApp } from "../store";
import { APP_STATUSES, INTEREST_OPTIONS, JOB_TYPES } from "../data/seed";
import { Avatar, Confirm, Empty, Field, IconBtn, Logo, Pill, Screen, SearchBar, Segmented, Sheet, Skeleton, useBriefLoading } from "../ui";
import { Switch, ToggleRow } from "../controls";
import { isEmail, matchPct, plural, timeAgo } from "../util";


const escapeRe = (s) => s.replace(/[.*+?^$|()[\]{}\\]/g, "\\$&");
/** true if `term` begins a word anywhere in `hay` ("motion" matches Motion Design, not Promotion) */
const startsWord = (hay, term) => new RegExp(`(^|[^a-z0-9])${escapeRe(term)}`).test(hay);

/* --------------------------- job card (prototype layout) --------------------------- */
export function JobCard({ job }) {
  const { db, me, go, act, toast, person } = useApp();
  const saved = db.saved.includes(job.id);
  const applied = db.applications.some((a) => a.jobId === job.id);
  const pct = matchPct(job, me.interests);
  const poster = job.postedBy === "me" ? { id: "me", name: "You" } : job.postedBy ? person(job.postedBy) : null;
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

  return (
    <article className="card jobcard" onClick={() => go("job", { id: job.id })}>
      <div className="jc-left">
        {pct != null && <span className="match" title="Based on your interests">{pct}% match</span>}
        {job.hgp ? <Logo kind="lockup" width={84} /> : <div className="mono">{job.company}</div>}
        <h3>{job.title}</h3>
        <div className="jc-btns">
          <button type="button" className={`mini ${applied ? "on" : "white"}`} onClick={stop(() => (applied ? go("tracker") : go("apply", { id: job.id })))}>{applied ? "Applied" : "Apply"}</button>
          <button type="button" className={`mini ${saved ? "on" : "white"}`} aria-pressed={saved} onClick={stop(() => { act("toggleSaveJob", { id: job.id }); toast(saved ? "Removed from saved" : "Job saved"); })}>{saved ? "Saved" : "Save"}</button>
        </div>
      </div>
      <div className="jc-grid">
        <span className="pill solid">{job.company}</span>
        <span className="pill solid">{job.location}</span>
        <span className="pill solid">{timeAgo(job.ts)}</span>
        <span className="pill solid">{job.pay}</span>
        <span className="pill solid">{job.interested} interested</span>
        {poster && poster.id !== "me"
          ? <button type="button" className="pill solid link" onClick={stop(() => go("profile", { id: poster.id }))}><small>Posted by:</small>{poster.name}</button>
          : <span className="pill solid"><small>Posted by:</small>{poster ? "You" : "Anonymous"}</span>}
      </div>
    </article>
  );
}

/* --------------------------------- tab --------------------------------- */
const DEFAULT_FILTERS = { types: [], remote: false, sort: "match" };

export default function Jobs({ view: initialView = "for", pushed = false }) {
  const { db, me, go, back, act } = useApp();
  const [view, setView] = useState(initialView);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showInterests, setShowInterests] = useState(false);
  const loading = useBriefLoading(380);

  const activeFilters = filters.types.length + (filters.remote ? 1 : 0) + (filters.sort !== "match" ? 1 : 0);

  const list = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let jobs = db.jobs.filter((j) => {
      const hay = `${j.title} ${j.company} ${j.location} ${j.tags.join(" ")}`.toLowerCase();
      if (!terms.every((t) => startsWord(hay, t))) return false;
      if (filters.types.length && !filters.types.includes(j.type)) return false;
      if (filters.remote && !j.remote) return false;
      return true;
    });
    jobs = [...jobs].sort((a, b) => (filters.sort === "recent" ? b.ts - a.ts : (matchPct(b, me.interests) || 0) - (matchPct(a, me.interests) || 0) || b.ts - a.ts));
    return jobs;
  }, [db.jobs, q, filters, me.interests]);

  const savedJobs = db.jobs.filter((j) => db.saved.includes(j.id));

  return (
    <Screen title="Your job board" onBack={pushed ? back : undefined} right={<IconBtn icon={Plus} label="Post a job" onClick={() => go("postJob")} />}>
      <h2 className="h-lg">Your interests:</h2>
      <div className="pills-wrap tight">
        {me.interests.map((i) => <Pill key={i} variant="glass">{i}</Pill>)}
        <Pill variant="white" onClick={() => setShowInterests(true)}><Plus size={13} strokeWidth={3} /> {me.interests.length ? "Add more interests" : "Add your interests"}</Pill>
      </div>

      <Segmented value={view} onChange={setView} options={[
        { id: "for", label: "For you" },
        { id: "saved", label: "Saved", count: savedJobs.length },
        { id: "tracker", label: "Tracker", count: db.applications.length },
      ]} />

      {view === "for" && (
        <>
          <SearchBar value={q} onChange={setQ} placeholder="Search roles, teams, skills"
            right={<button type="button" className="filter-btn" aria-label="Filters" onClick={() => setShowFilters(true)}><SlidersHorizontal size={18} />{activeFilters > 0 && <i>{activeFilters}</i>}</button>} />
          <h2 className="h-lg center">Suggested for you…</h2>
          {loading ? <Skeleton h={150} n={3} /> : list.length === 0 ? (
            <Empty icon={Briefcase} title="No jobs match" text="Try different keywords or clear your filters."
              action={<button type="button" className="btn white sm" onClick={() => { setQ(""); setFilters(DEFAULT_FILTERS); }}>Clear search</button>} />
          ) : (
            <>
              <p className="count">{plural(list.length, "job")}</p>
              {list.map((j) => <JobCard key={j.id} job={j} />)}
            </>
          )}
        </>
      )}

      {view === "saved" && (savedJobs.length === 0
        ? <Empty icon={Bookmark} title="Nothing saved yet" text="Tap Save on any job to keep it here." action={<button type="button" className="btn white sm" onClick={() => setView("for")}>Browse jobs</button>} />
        : savedJobs.map((j) => <JobCard key={j.id} job={j} />))}

      {view === "tracker" && <Tracker />}

      <FilterSheet open={showFilters} onClose={() => setShowFilters(false)} filters={filters} setFilters={setFilters} />
      <InterestsSheet open={showInterests} onClose={() => setShowInterests(false)} />
    </Screen>
  );
}

function FilterSheet({ open, onClose, filters, setFilters }) {
  const [f, setF] = useState(filters);
  useEffect(() => { if (open) setF(filters); }, [open, filters]);
  const toggleType = (t) => setF((s) => ({ ...s, types: s.types.includes(t) ? s.types.filter((x) => x !== t) : [...s.types, t] }));
  return (
    <Sheet open={open} onClose={onClose} title="Filter jobs">
      <h4 className="sheet-h4">Job type</h4>
      <div className="pills-wrap tight">{JOB_TYPES.map((t) => <Pill key={t} variant="chip-dark" active={f.types.includes(t)} onClick={() => toggleType(t)}>{t}</Pill>)}</div>
      <ToggleRow title="Remote only" text="Show only roles you can do from anywhere." checked={f.remote} onChange={(v) => setF({ ...f, remote: v })} />
      <h4 className="sheet-h4">Sort by</h4>
      <div className="pills-wrap tight">
        <Pill variant="chip-dark" active={f.sort === "match"} onClick={() => setF({ ...f, sort: "match" })}>Best match</Pill>
        <Pill variant="chip-dark" active={f.sort === "recent"} onClick={() => setF({ ...f, sort: "recent" })}>Newest</Pill>
      </div>
      <div className="row-btns">
        <button type="button" className="btn ghost-dark" onClick={() => setF(DEFAULT_FILTERS)}>Reset</button>
        <button type="button" className="btn solid" onClick={() => { setFilters(f); onClose(); }}>Show results</button>
      </div>
    </Sheet>
  );
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

/* ------------------------------- tracker ------------------------------- */
export function Tracker() {
  const { db, act, go, toast } = useApp();
  const [filter, setFilter] = useState("all");
  const [withdraw, setWithdraw] = useState(null);
  const counts = Object.fromEntries(APP_STATUSES.map((s) => [s.id, db.applications.filter((a) => a.status === s.id).length]));
  const apps = db.applications.filter((a) => filter === "all" || a.status === filter);
  const mine = db.jobs.filter((j) => j.postedBy === "me");
  const [delJob, setDelJob] = useState(null);

  return (
    <>
      <div className="tiles">
        {APP_STATUSES.map((s) => (
          <button key={s.id} type="button" className={filter === s.id ? "on" : ""} onClick={() => setFilter(filter === s.id ? "all" : s.id)} aria-pressed={filter === s.id}>
            <b>{counts[s.id]}</b><span>{s.label}</span>
          </button>
        ))}
      </div>

      {db.applications.length === 0 ? (
        <Empty icon={ClipboardList} title="No applications yet" text="When you apply to a job, track it here from Applied to Offer." />
      ) : apps.length === 0 ? (
        <p className="lead center">Nothing in this stage yet.</p>
      ) : apps.map((a) => <AppCard key={a.id} a={a} onWithdraw={() => setWithdraw(a)} />)}

      {mine.length > 0 && (
        <>
          <h2 className="h-lg">Your job posts</h2>
          {mine.map((j) => (
            <div key={j.id} className="card row-card">
              <button type="button" className="rc-main" onClick={() => go("job", { id: j.id })}><b>{j.title}</b><small>{j.company} · {timeAgo(j.ts)} · {j.interested} interested</small></button>
              <button type="button" className="ibtn light" aria-label={`Delete ${j.title}`} onClick={() => setDelJob(j)}><Trash2 size={18} /></button>
            </div>
          ))}
        </>
      )}

      <Confirm open={!!withdraw} title="Withdraw application?" text={withdraw ? `Remove your application to ${withdraw.jobSnap.title} at ${withdraw.jobSnap.company}.` : ""} confirmLabel="Withdraw" danger
        onConfirm={() => { act("withdrawApplication", { id: withdraw.id }); toast("Application withdrawn"); }} onClose={() => setWithdraw(null)} />
      <Confirm open={!!delJob} title="Delete this job post?" text="It will be removed from the job board for everyone." confirmLabel="Delete post" danger
        onConfirm={() => { act("deleteJob", { id: delJob.id }); toast("Job post deleted"); }} onClose={() => setDelJob(null)} />
    </>
  );
}

function AppCard({ a, onWithdraw }) {
  const { act, go, toast } = useApp();
  const [note, setNote] = useState(a.note || "");
  const exists = useApp().db.jobs.some((j) => j.id === a.jobId);
  return (
    <article className="card pad appcard">
      <div className="ac-top">
        <div><h3>{a.jobSnap.title}</h3><p>{a.jobSnap.company} · Applied {timeAgo(a.ts)}</p></div>
        {exists && <button type="button" className="inline-link" onClick={() => go("job", { id: a.jobId })}>View job</button>}
      </div>
      <div className="stage-row" role="group" aria-label="Application stage">
        {APP_STATUSES.map((s) => (
          <button key={s.id} type="button" className={`stg ${s.id} ${a.status === s.id ? "on" : ""}`} aria-pressed={a.status === s.id}
            onClick={() => { act("setApplicationStatus", { id: a.id, status: s.id }); if (s.id === "offer") toast("Congratulations on the offer!", "win"); }}>{s.label}</button>
        ))}
      </div>
      <Field textarea rows={2} value={note} onChange={setNote} placeholder="Add a note: contacts, next steps, interview dates…" maxLength={300} />
      <div className="ac-foot">
        {note !== (a.note || "") && <button type="button" className="btn solid sm" onClick={() => { act("setApplicationNote", { id: a.id, note }); toast("Note saved"); }}>Save note</button>}
        <button type="button" className="inline-link danger" onClick={onWithdraw}>Withdraw</button>
      </div>
    </article>
  );
}

/* ------------------------------ job detail ------------------------------ */
export function JobDetail({ id }) {
  const { db, me, back, go, act, toast, person } = useApp();
  const job = db.jobs.find((j) => j.id === id);
  const [del, setDel] = useState(false);
  if (!job) return <Screen title="Job details" onBack={back}><Empty icon={Briefcase} title="This job is no longer available" text="It may have been filled or removed." /></Screen>;

  const saved = db.saved.includes(job.id);
  const applied = db.applications.find((a) => a.jobId === job.id);
  const pct = matchPct(job, me.interests);
  const shared = job.tags.filter((t) => me.interests.map((i) => i.toLowerCase()).includes(t.toLowerCase()));
  const mine = job.postedBy === "me";
  const poster = mine ? person("me") : job.postedBy ? person(job.postedBy) : null;

  const message = () => { act("startConversation", { userId: poster.id }); go("chat", { userId: poster.id }); };

  return (
    <Screen title="Job details" onBack={back}
      right={<IconBtn icon={Bookmark} label={saved ? "Remove from saved" : "Save job"} onClick={() => { act("toggleSaveJob", { id: job.id }); toast(saved ? "Removed from saved" : "Job saved"); }} className={saved ? "filled" : ""} />}
      footer={(
        <div className="actionbar">
          {applied
            ? <button type="button" className="btn white wide" onClick={() => go("tracker")}><Check size={18} /> Applied · View in tracker</button>
            : <button type="button" className="btn white wide" onClick={() => go("apply", { id: job.id })}>Apply now</button>}
        </div>
      )}>
      <article className="card pad jd">
        <div className="jd-head">
          {job.hgp ? <div className="jd-logo"><Logo kind="icon" width={48} /></div> : <div className="jd-logo mono-sm">{job.company.slice(0, 2).toUpperCase()}</div>}
          <div><h2>{job.title}</h2><p>{job.company}</p></div>
        </div>
        <div className="pills-wrap tight">
          <Pill variant="solid"><MapPin size={12} /> {job.location}</Pill>
          <Pill variant="solid">{job.type}</Pill>
          <Pill variant="solid">{job.pay}</Pill>
          <Pill variant="solid">{timeAgo(job.ts)}</Pill>
        </div>
        {pct != null && (
          <div className="matchbar">
            <div className="mb-top"><b>{pct}% match</b><span>{shared.length ? `You share: ${shared.join(", ")}` : "Add interests to improve your match"}</span></div>
            <div className="mb-track"><i style={{ width: `${pct}%` }} /></div>
          </div>
        )}
        <h4 className="sec-h">About the role</h4>
        <p className="body-p">{job.desc}</p>
        <h4 className="sec-h">What you'll need</h4>
        <ul className="bullets">{job.reqs.map((r) => <li key={r}>{r}</li>)}</ul>
        <h4 className="sec-h">Skills &amp; interests</h4>
        <div className="pills-wrap tight">{job.tags.map((t) => <Pill key={t} variant="chip-dark">{t}</Pill>)}</div>

        <h4 className="sec-h">Posted by</h4>
        {poster ? (
          <div className="poster">
            <button type="button" className="poster-id" onClick={() => !mine && go("profile", { id: poster.id })}><Avatar person={poster} size={44} /><span><b>{mine ? "You" : poster.name}</b><small>{poster.headline}</small></span></button>
            {!mine && <button type="button" className="btn solid sm" onClick={message}>Message</button>}
          </div>
        ) : <p className="body-p">Posted anonymously. Women supporting women.</p>}
        {mine && <button type="button" className="inline-link danger" onClick={() => setDel(true)}>Delete this post</button>}
      </article>
      <Confirm open={del} title="Delete this job post?" text="It will be removed from the job board." confirmLabel="Delete post" danger onConfirm={() => { act("deleteJob", { id: job.id }); toast("Job post deleted"); back(); }} onClose={() => setDel(false)} />
    </Screen>
  );
}

/* --------------------------------- apply --------------------------------- */
export function Apply({ id }) {
  const { db, me, back, replace, A, toast } = useApp();
  const job = db.jobs.find((j) => j.id === id);
  const [f, setF] = useState({ firstName: me.firstName, lastName: me.lastName, email: me.email, phone: me.phone, city: me.city, state: me.state, headline: me.headline, portfolio: me.portfolio, resume: me.resume, note: "" });
  const [save, setSave] = useState(true);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);
  const up = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  if (!job) return <Screen title="Apply" onBack={back}><Empty title="This job is no longer available" /></Screen>;

  const submit = () => {
    const er = {};
    if (!f.firstName.trim()) er.firstName = "Required";
    if (!f.lastName.trim()) er.lastName = "Required";
    if (!isEmail(f.email)) er.email = "Enter a valid email";
    if (!f.resume.trim() && !f.portfolio.trim()) er.resume = "Add a resume or portfolio link";
    if (Object.keys(er).length) { setErrors(er); toast("Please fix the highlighted fields", "note"); return; }
    A.apply(job.id, f, save);
    replace("applied", { id: job.id });
  };

  return (
    <Screen title="Apply" sub={`${job.title} · ${job.company}`} onBack={back}>
      <h2 className="h-lg">Your pre-saved info:</h2>
      <div className="card pad">
        <div className="apply-photo"><Avatar person={{ name: `${f.firstName} ${f.lastName}`, photo: me.photo }} size={72} /></div>
        <div className="two">
          <Field label="First name" value={f.firstName} onChange={up("firstName")} error={errors.firstName} autoComplete="given-name" />
          <Field label="Last name" value={f.lastName} onChange={up("lastName")} error={errors.lastName} autoComplete="family-name" />
        </div>
        <Field label="Email" type="email" value={f.email} onChange={up("email")} error={errors.email} autoComplete="email" />
        <Field label="Phone number" type="tel" value={f.phone} onChange={up("phone")} autoComplete="tel" />
        <div className="two">
          <Field label="City" value={f.city} onChange={up("city")} />
          <Field label="State" value={f.state} onChange={up("state")} />
        </div>
        <Field label="Headline" value={f.headline} onChange={up("headline")} maxLength={70} />
        <Field label="Portfolio" value={f.portfolio} onChange={up("portfolio")} placeholder="yourname.portfolio.com" inputMode="url" />
        <Field label="Resume" value={f.resume} onChange={up("resume")} error={errors.resume} placeholder="Link or file name" />
        <button type="button" className="upload" onClick={() => fileRef.current?.click()}><Upload size={16} /> Upload a resume file</button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) up("resume")(file.name); }} />
        <Field label="Note to the hiring team (optional)" textarea rows={3} value={f.note} onChange={up("note")} maxLength={500} placeholder="Why are you excited about this role?" />
        <ToggleRow title="Save these details to my profile" text="So next time it's one tap." checked={save} onChange={setSave} />
        <button type="button" className="btn solid wide" onClick={submit}>Submit application</button>
      </div>
    </Screen>
  );
}

export function Applied({ id }) {
  const { db, go, tab, burst, replace } = useApp();
  const job = db.jobs.find((j) => j.id === id);
  useEffect(() => { burst(); }, [burst]);
  return (
    <Screen title="Your job board">
      <div className="submitted">
        <div className="big-check"><Check size={54} strokeWidth={3} /></div>
        <h2>Submitted!</h2>
        {job && <p>Your application to <b>{job.title}</b> at <b>{job.company}</b> is in. We added it to your tracker so you can follow up.</p>}
        <button type="button" className="btn white wide" onClick={() => replace("tracker")}>Track application</button>
        <button type="button" className="btn ghost wide" onClick={() => tab("jobs")}>Back to jobs</button>
        <button type="button" className="linkish center" onClick={() => tab("home")}>Return home</button>
      </div>
    </Screen>
  );
}

/* -------------------------------- post a job -------------------------------- */
export function PostJob() {
  const { back, act, toast, me } = useApp();
  const [f, setF] = useState({ title: "", company: "", location: "", remote: false, type: "Full-time", pay: "", desc: "", reqs: "", tags: [], anonymous: false });
  const [errors, setErrors] = useState({});
  const up = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const toggleTag = (t) => setF((s) => ({ ...s, tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : s.tags.length < 6 ? [...s.tags, t] : s.tags }));

  const post = () => {
    const er = {};
    if (!f.title.trim()) er.title = "Add a job title";
    if (!f.company.trim()) er.company = "Add the company or team";
    if (!f.remote && !f.location.trim()) er.location = "Add a location or mark as remote";
    if (f.desc.trim().length < 20) er.desc = "Describe the role in at least 20 characters";
    if (Object.keys(er).length) { setErrors(er); toast("Please fix the highlighted fields", "note"); return; }
    act("postJob", {
      job: {
        id: `j_${Date.now().toString(36)}`, title: f.title.trim(), company: f.company.trim(), location: f.remote ? "Remote" : f.location.trim(), remote: f.remote,
        type: f.type, pay: f.pay.trim() || "Not listed", tags: f.tags, desc: f.desc.trim(),
        reqs: f.reqs.split("\n").map((r) => r.trim()).filter(Boolean), postedBy: f.anonymous ? null : "me",
      },
    });
    toast("Job posted. Thanks for supporting women in sports!", "win");
    back();
  };

  return (
    <Screen title="Post a job" sub="Open a door for another woman" onBack={back}>
      <div className="card pad">
        <Field label="Job title" value={f.title} onChange={up("title")} error={errors.title} maxLength={70} />
        <Field label="Company or team" value={f.company} onChange={up("company")} error={errors.company} maxLength={70} />
        <ToggleRow title="Remote role" text="Can be done from anywhere." checked={f.remote} onChange={up("remote")} />
        {!f.remote && <Field label="Location" value={f.location} onChange={up("location")} error={errors.location} placeholder="City, ST" />}
        <div className="field">
          <label>Job type</label>
          <div className="pills-wrap tight">{JOB_TYPES.map((t) => <Pill key={t} variant="chip-dark" active={f.type === t} onClick={() => up("type")(t)}>{t}</Pill>)}</div>
        </div>
        <Field label="Pay (optional)" value={f.pay} onChange={up("pay")} placeholder="e.g. $50K–$60K/yr or $22/hr" maxLength={40} />
        <Field label="About the role" textarea rows={4} value={f.desc} onChange={up("desc")} error={errors.desc} maxLength={800} />
        <Field label="Requirements (one per line)" textarea rows={3} value={f.reqs} onChange={up("reqs")} maxLength={500} />
        <div className="field">
          <label>Skills &amp; interests <small>(pick up to 6, used for matching)</small></label>
          <div className="pills-wrap tight">{INTEREST_OPTIONS.map((t) => <Pill key={t} variant="chip-dark" active={f.tags.includes(t)} onClick={() => toggleTag(t)}>{t}</Pill>)}</div>
        </div>
        <ToggleRow title="Post anonymously" text={`Show “Anonymous” instead of ${me.firstName || "your name"}.`} checked={f.anonymous} onChange={up("anonymous")} />
        <button type="button" className="btn solid wide" onClick={post}>Post job</button>
      </div>
    </Screen>
  );
}
