import { useCallback, useEffect, useState } from "react";
import { Check, Flag, MessageSquare, Plus, Trash2, UserX } from "lucide-react";
import { useApp } from "../store";
import { admin } from "../api/supa";
import { Confirm, Empty, Field, Pill, Screen, Segmented } from "../ui";
import { timeAgo } from "../util";

const STAT_LABELS = [
  ["members", "Members"], ["new_7d", "New this week"], ["active_7d", "Active this week"], ["goals", "Goals"], ["public_goals", "Public goals"],
  ["posts", "Posts"], ["messages", "Messages"], ["mentors", "Mentors"], ["mentor_requests", "Mentor requests"], ["jobs_interest", "Jobs list signups"],
  ["invite_uses", "Invite code uses"], ["feedback_new", "New feedback"],
];

/** Admin-only dashboard. The database refuses these actions for anyone who isn't an admin. */
export function Admin() {
  const { back, toast, me } = useApp();
  const [seg, setSeg] = useState("overview");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try { setData(await admin.load()); setError(""); } catch (e) { setError(e.message || "Couldn't load admin data"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, msg) => {
    try { await fn(); if (msg) toast(msg); await load(); } catch (e) { toast(e.message || "That didn't work.", "note"); }
  };

  if (!me.isAdmin) return <Screen title="Admin" onBack={back}><Empty title="Admins only" /></Screen>;

  const openReports = data?.reports.filter((r) => r.status === "open") || [];
  const pendingApps = data?.apps.filter((a) => a.status === "pending") || [];
  const newFeedback = data?.feedback.filter((f) => f.status === "new") || [];

  return (
    <Screen title="Admin" sub="Only you can see this" onBack={back}>
      <Segmented value={seg} onChange={setSeg} className="scroll" options={[
        { id: "overview", label: "Overview" },
        { id: "reports", label: "Reports", count: openReports.length },
        { id: "mentors", label: "Mentors", count: pendingApps.length },
        { id: "feedback", label: "Feedback", count: newFeedback.length },
        { id: "content", label: "Content" },
        { id: "members", label: "Members" },
      ]} />
      {error && <div className="banner" role="alert">{error}</div>}
      {!data && !error && <p className="lead">Loading…</p>}

      {data && seg === "overview" && <Overview data={data} run={run} />}

      {data && seg === "reports" && (
        openReports.length === 0 ? <Empty icon={Flag} title="No open reports" text="You're all caught up." /> :
          openReports.map((r) => (
            <article key={r.id} className="card pad adm">
              <header><Pill variant="tag">{r.kind}</Pill><span>{timeAgo(new Date(r.created_at).getTime())}</span></header>
              <p className="adm-line"><b>{r.reporterName}</b> reported {r.subjectName ? <b>{r.subjectName}</b> : "this"}: <i>{r.reason || "no reason given"}</i></p>
              {r.preview && <blockquote>{r.preview}</blockquote>}
              {r.postGone && <p className="small">The post was already removed.</p>}
              <div className="row-btns wrap">
                {r.kind === "post" && !r.postGone && <button type="button" className="btn danger sm" onClick={() => run(() => admin.removePost(r.target_id), "Post removed")}><Trash2 size={14} /> Remove post</button>}
                {r.subjectId && <button type="button" className="btn ghost-dark sm" onClick={() => setConfirm({ title: `Remove ${r.subjectName}?`, text: "This permanently deletes their account and everything they posted.", go: () => run(() => admin.removeMember(r.subjectId), "Member removed") })}><UserX size={14} /> Remove member</button>}
                <button type="button" className="btn solid sm" onClick={() => run(() => admin.resolveReport(r.id), "Marked resolved")}><Check size={14} /> Resolve</button>
              </div>
            </article>
          ))
      )}

      {data && seg === "mentors" && (
        <>
          {pendingApps.length === 0 && <Empty icon={Check} title="No pending applications" text="New mentor applications appear here for your approval." />}
          {pendingApps.map((a) => (
            <article key={a.id} className="card pad adm">
              <header><b>{a.name}</b><span>{timeAgo(new Date(a.created_at).getTime())}</span></header>
              <p className="adm-line"><b>Field:</b> {a.field} · <b>{a.capacity}</b></p>
              <div className="pills-wrap tight">{a.expertise.map((e) => <Pill key={e} variant="chip-dark">{e}</Pill>)}</div>
              <blockquote>{a.why}</blockquote>
              <div className="row-btns">
                <button type="button" className="btn solid sm" onClick={() => run(() => admin.reviewApp(a.id, true), "Mentor approved")}>Approve</button>
                <button type="button" className="btn ghost-dark sm" onClick={() => run(() => admin.reviewApp(a.id, false), "Declined")}>Decline</button>
              </div>
            </article>
          ))}
          {data.apps.filter((a) => a.status !== "pending").length > 0 && <h3 className="sec-sm">Reviewed</h3>}
          {data.apps.filter((a) => a.status !== "pending").map((a) => (
            <div key={a.id} className="card pad adm slim"><b>{a.name}</b><span>{a.field} · {a.status}</span></div>
          ))}
        </>
      )}

      {data && seg === "feedback" && (
        data.feedback.length === 0 ? <Empty icon={MessageSquare} title="No feedback yet" text="Member feedback shows up here." /> :
          data.feedback.map((f) => (
            <article key={f.id} className={`card pad adm ${f.status === "done" ? "dim" : ""}`}>
              <header><Pill variant="tag">{f.kind}</Pill><span>{f.name} · {timeAgo(new Date(f.created_at).getTime())}</span></header>
              <p className="adm-text">{f.text}</p>
              {f.status === "new" && <button type="button" className="btn ghost-dark sm" onClick={() => run(() => admin.doneFeedback(f.id))}><Check size={14} /> Mark done</button>}
            </article>
          ))
      )}

      {data && seg === "content" && <Content data={data} run={run} setConfirm={setConfirm} />}

      {data && seg === "members" && data.members.map((m) => (
        <div key={m.id} className="card pad adm slim">
          <span><b>{`${m.first_name} ${m.last_name}`.trim() || "(no name)"}</b> {m.is_admin && <Pill variant="tag">admin</Pill>} {m.is_mentor && <Pill variant="tag">mentor</Pill>}<small>{m.email} · joined {timeAgo(new Date(m.created_at).getTime())}</small></span>
          {!m.is_admin && <button type="button" className="ibtn light" aria-label={`Remove ${m.first_name}`} onClick={() => setConfirm({ title: `Remove ${m.first_name || "this member"}?`, text: "This permanently deletes their account and everything they posted.", go: () => run(() => admin.removeMember(m.id), "Member removed") })}><UserX size={18} /></button>}
        </div>
      ))}

      <Confirm open={!!confirm} title={confirm?.title || ""} text={confirm?.text} confirmLabel="Remove" danger onConfirm={() => confirm?.go()} onClose={() => setConfirm(null)} />
    </Screen>
  );
}

function Overview({ data, run }) {
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const roles = Object.entries(data.roleCounts).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <div className="stat-grid">
        {STAT_LABELS.map(([k, label]) => <div key={k} className="card stat"><b>{data.stats[k] ?? 0}</b><span>{label}</span></div>)}
      </div>

      <section className="card pad">
        <h3 className="sec-h">Jobs interest by role</h3>
        {roles.length === 0 ? <p className="body-p">No signups yet.</p> : roles.map(([r, n]) => <div key={r} className="kv"><span>{r}</span><b>{n}</b></div>)}
      </section>

      <section className="card pad">
        <h3 className="sec-h">Invite codes</h3>
        {data.codes.map((c) => (
          <div key={c.code} className="kv code-row">
            <span><b>{c.code}</b><small>{c.uses} used{c.note ? ` · ${c.note}` : ""}</small></span>
            <button type="button" className={`btn sm ${c.active ? "ghost-dark" : "solid"}`} onClick={() => run(() => admin.setCodeActive(c.code, !c.active), c.active ? "Code turned off" : "Code turned on")}>{c.active ? "Turn off" : "Turn on"}</button>
          </div>
        ))}
        <Field label="New code" value={code} onChange={(v) => setCode(v.toUpperCase())} placeholder="e.g. TEAMNIGHT" maxLength={24} />
        <Field label="Note (optional)" value={note} onChange={setNote} placeholder="Who is this for?" maxLength={60} />
        <button type="button" className="btn solid wide" disabled={code.trim().length < 4} onClick={() => run(async () => { await admin.addCode(code, note); setCode(""); setNote(""); }, "Code added")}><Plus size={16} /> Add code</button>
      </section>
    </>
  );
}

function Content({ data, run, setConfirm }) {
  const [f, setF] = useState({ title: "", category: "Career", read: 4, excerpt: "", author: "Her Game Plan", role: "", body: "" });
  const up = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const parse = (text) => {
    // blank line = new paragraph; a line starting with "## " starts a new section heading
    const blocks = [];
    text.split(/\n{2,}/).forEach((chunk) => {
      const t = chunk.trim();
      if (!t) return;
      if (t.startsWith("## ")) {
        const [head, ...rest] = t.split("\n");
        blocks.push({ h: head.replace(/^##\s+/, ""), p: rest.join("\n").trim() });
      } else if (blocks.length && !blocks[blocks.length - 1].p) blocks[blocks.length - 1].p = t;
      else blocks.push({ p: t });
    });
    return blocks.map((b) => ({ ...b, p: b.p || "" }));
  };
  const ready = f.title.trim() && f.excerpt.trim() && f.body.trim();
  const publish = () => run(async () => {
    await admin.publishArticle({ ...f, title: f.title.trim(), excerpt: f.excerpt.trim(), read: Number(f.read) || 4, blocks: parse(f.body) });
    setF({ title: "", category: "Career", read: 4, excerpt: "", author: "Her Game Plan", role: "", body: "" });
  }, "Published. It's live in Tips & Tricks.");
  return (
    <>
      <section className="card pad">
        <h3 className="sec-h">Publish a Tips &amp; Tricks article</h3>
        <Field label="Title" value={f.title} onChange={up("title")} maxLength={120} />
        <div className="two">
          <Field label="Category" value={f.category} onChange={up("category")} maxLength={24} />
          <Field label="Read time (min)" value={String(f.read)} onChange={up("read")} inputMode="numeric" maxLength={2} />
        </div>
        <Field label="Short summary" textarea rows={2} value={f.excerpt} onChange={up("excerpt")} maxLength={240} />
        <div className="two">
          <Field label="Author name" value={f.author} onChange={up("author")} maxLength={60} />
          <Field label="Author role" value={f.role} onChange={up("role")} maxLength={80} placeholder="Optional" />
        </div>
        <Field label="Article text" textarea rows={9} value={f.body} onChange={up("body")} hint="Separate paragraphs with a blank line. Start a section with “## Heading”." />
        <button type="button" className="btn solid wide" disabled={!ready} onClick={publish}>Publish</button>
      </section>
      <section className="card pad">
        <h3 className="sec-h">Published articles</h3>
        {data.articles.map((a) => (
          <div key={a.id} className="kv code-row">
            <span><b>{a.title}</b><small>{a.category}{a.is_sample ? " · concept sample" : ""}</small></span>
            <button type="button" className="ibtn light" aria-label={`Delete ${a.title}`} onClick={() => setConfirm({ title: "Delete this article?", text: "It will disappear for everyone.", go: () => run(() => admin.deleteArticle(a.id), "Article deleted") })}><Trash2 size={18} /></button>
          </div>
        ))}
      </section>
    </>
  );
}
