import { useState } from "react";
import { Check, ChevronRight, Flame, Globe2, Heart, Lock, MessageCircle, Minus, Pencil, Plus, Trash2, Trophy, X } from "lucide-react";
import { useApp } from "../store";
import { findGoal } from "../api/local";
import { Avatar, Comment, Composer, Confirm, Empty, Field, IconBtn, Pill, Ring, Screen, Segmented, Sheet } from "../ui";
import { ToggleRow } from "../controls";
import { plural, timeAgo } from "../util";

export const goalStats = (g) => ({ done: g.steps.filter((s) => s.done).length, total: g.steps.length });

/** short-term goals read "1/2"; long-term goals read "3 tasks left", like the prototype */
export function ringText(g) {
  const { done, total } = goalStats(g);
  if (total === 0) return { label: "0", sub: "STEPS" };
  if (done === total) return { label: "✓", sub: "DONE" };
  return g.term === "short" ? { label: `${done}/${total}` } : { label: String(total - done), sub: "TASKS LEFT" };
}

let lastSeg = "short";

export default function Goals() {
  const { db, go, A, act, streak, person } = useApp();
  const [seg, setSegState] = useState(lastSeg);
  const [selId, setSelId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [stepText, setStepText] = useState("");
  const setSeg = (s) => { lastSeg = s; setSegState(s); setSelId(null); };

  const byTerm = (t) => db.goals.filter((g) => g.term === t).sort((a, b) => Number(!!a.completedAt) - Number(!!b.completedAt) || b.ts - a.ts);
  const goals = byTerm(seg);
  const g = goals.find((x) => x.id === selId) || goals[0];

  const community = db.people
    .filter((p) => !db.blocked.includes(p.id))
    .flatMap((p) => p.goals.filter((x) => x.isPublic).map((x) => ({ g: x, owner: p })));

  const addStep = (e) => {
    e.preventDefault();
    const label = stepText.trim();
    if (!label || !g) return;
    act("addStep", { id: g.id, label });
    setStepText("");
  };

  return (
    <Screen title="Reach your goals!" right={<IconBtn icon={Plus} label="New goal" onClick={() => go("newGoal", { term: seg === "community" ? "short" : seg })} />}>
      <Segmented
        value={seg} onChange={setSeg}
        options={[
          { id: "short", label: "Short term" },
          { id: "long", label: "Long term" },
          { id: "community", label: "Community" },
        ]}
      />

      {seg !== "community" && (
        <>
          <div className="streak"><Flame size={16} /> {streak > 0 ? `${streak}-day streak` : "Complete a step today to start a streak"}</div>

          {!g ? (
            <Empty
              icon={Trophy}
              title={seg === "short" ? "No short-term goals yet" : "No long-term goals yet"}
              text={seg === "short" ? "Small wins add up. Try something you can finish this week." : "Big goals need a plan. Break it into steps and track your progress."}
              action={<button type="button" className="btn white" onClick={() => go("newGoal", { term: seg })}>Create a goal</button>}
            />
          ) : (
            <div className="goal">
              {goals.length > 1 && (
                <div className="goal-pick" role="tablist" aria-label="Your goals">
                  {goals.map((x) => (
                    <button key={x.id} type="button" role="tab" aria-selected={x.id === g.id} className={x.id === g.id ? "on" : ""} onClick={() => setSelId(x.id)}>
                      {x.completedAt && <Check size={12} strokeWidth={3.5} />} {x.title}
                    </button>
                  ))}
                </div>
              )}

              <h2 className="goal-title">{g.title}</h2>
              <div className="goal-tools">
                <button type="button" onClick={() => setEditing(g)}><Pencil size={14} /> Edit</button>
                <button type="button" onClick={() => setDeleting(g)}><Trash2 size={14} /> Delete</button>
              </div>

              {g.completedAt && <div className="done-banner"><Trophy size={16} /> Completed {timeAgo(g.completedAt)}. Amazing work!</div>}

              <div className="ring-row">
                <button type="button" className="rbtn" aria-label="Mark one fewer step done" onClick={() => A.adjustGoal(g.id, -1)}><Minus size={20} strokeWidth={3} /></button>
                <Ring value={goalStats(g).done} max={goalStats(g).total} size={132} stroke={9} {...ringText(g)} />
                <button type="button" className="rbtn" aria-label="Mark one more step done" onClick={() => A.adjustGoal(g.id, 1)}><Plus size={20} strokeWidth={3} /></button>
              </div>

              <ul className="steps">
                {g.steps.map((s) => (
                  <li key={s.id}>
                    <button type="button" className={`ck ${s.done ? "on" : ""}`} aria-pressed={s.done} aria-label={`${s.done ? "Uncheck" : "Check"} ${s.label}`} onClick={() => A.toggleStep(g.id, s.id)}>
                      {s.done && <Check size={14} strokeWidth={3.5} />}
                    </button>
                    <span className={s.done ? "done" : ""} onClick={() => A.toggleStep(g.id, s.id)}>{s.label}</span>
                    <button type="button" className="rm" aria-label={`Remove ${s.label}`} onClick={() => act("removeStep", { id: g.id, stepId: s.id })}><X size={15} /></button>
                  </li>
                ))}
              </ul>
              <form className="addstep" onSubmit={addStep}>
                <input value={stepText} onChange={(e) => setStepText(e.target.value)} placeholder="Add another step" maxLength={80} aria-label="Add another step" />
                {stepText.trim() && <button type="submit" aria-label="Add step"><Plus size={18} /></button>}
              </form>

              <div className="glass">
                <ToggleRow
                  title={g.isPublic ? "Public goal" : "Private goal"}
                  text={g.isPublic ? "Others can cheer you on and comment." : "Only you can see this. Switch to public to open discussion."}
                  checked={g.isPublic} onChange={(v) => A.setGoalPublic(g.id, v)}
                />
                {g.isPublic && (
                  <button type="button" className="glass-link" onClick={() => go("goalSupport", { goalId: g.id })}>
                    <span><Heart size={15} /> {plural(g.cheers.length, "cheer")} · <MessageCircle size={15} /> {plural(g.comments.length, "comment")}</span>
                    <b>View discussion <ChevronRight size={15} /></b>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {seg === "community" && (
        <div className="stack-gap">
          <p className="lead">Cheer on other women working toward their goals. A little encouragement goes a long way.</p>
          {community.length === 0 && <Empty title="No public goals yet" text="When members share goals, they'll show up here." />}
          {community.map(({ g: cg, owner }) => {
            const { done, total } = goalStats(cg);
            const cheered = cg.cheers.includes("me");
            return (
              <article key={cg.id} className="card goalcard">
                <button type="button" className="gc-head" onClick={() => go("profile", { id: owner.id })}>
                  <Avatar person={owner} size={38} />
                  <span><b>{owner.name}</b><small>{owner.headline}</small></span>
                </button>
                <div className="gc-main">
                  <div>
                    <Pill variant="chip-dark">{cg.term === "short" ? "Short term" : "Long term"}</Pill>
                    <h3>{cg.title}</h3>
                    <p>{done} of {total} steps done</p>
                  </div>
                  <Ring value={done} max={total} size={64} stroke={6} tone="dark" label={`${Math.round((done / Math.max(total, 1)) * 100)}%`} />
                </div>
                <div className="gc-actions">
                  <button type="button" className={cheered ? "on" : ""} aria-pressed={cheered} onClick={() => act("cheerGoal", { id: cg.id })}>
                    <Heart size={17} fill={cheered ? "currentColor" : "none"} /> {cheered ? "Cheering" : "Cheer"} · {cg.cheers.length}
                  </button>
                  <button type="button" onClick={() => go("goalSupport", { goalId: cg.id })}><MessageCircle size={17} /> {cg.comments.length} · Discuss</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <EditGoal goal={editing} onClose={() => setEditing(null)} />
      <Confirm open={!!deleting} title="Delete this goal?" text={deleting ? `“${deleting.title}” and its progress will be removed.` : ""} confirmLabel="Delete goal" danger
        onConfirm={() => { act("deleteGoal", { id: deleting.id }); setSelId(null); }} onClose={() => setDeleting(null)} />
    </Screen>
  );
}

function EditGoal({ goal, onClose }) {
  const { act, toast } = useApp();
  const [title, setTitle] = useState("");
  const [prev, setPrev] = useState(null);
  if (goal && prev !== goal.id) { setPrev(goal.id); setTitle(goal.title); }
  if (!goal && prev) setPrev(null);
  return (
    <Sheet open={!!goal} onClose={onClose} title="Edit goal">
      <Field label="Goal" value={title} onChange={setTitle} maxLength={70} />
      <button type="button" className="btn solid wide" disabled={!title.trim()} onClick={() => { act("updateGoal", { id: goal.id, patch: { title: title.trim() } }); toast("Goal updated"); onClose(); }}>Save</button>
    </Sheet>
  );
}

/* ------------------------------- new goal ------------------------------- */
const IDEAS = ["Apply to 3 jobs this week", "Update my portfolio", "Message two mentors", "Share a win in the community"];

export function NewGoal({ term: initial = "short" }) {
  const { A, back } = useApp();
  const [term, setTerm] = useState(initial);
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState([]);
  const [st, setSt] = useState("");
  const [pub, setPub] = useState(false);
  const [err, setErr] = useState("");

  const addStep = () => { const v = st.trim(); if (!v) return; setSteps((s) => [...s, v]); setSt(""); };
  const create = () => {
    if (!title.trim()) { setErr("Give your goal a name"); return; }
    const pending = st.trim();
    A.addGoal({ term, title: title.trim(), steps: pending ? [...steps, pending] : steps, isPublic: pub });
    back();
  };

  return (
    <Screen title="New goal" onBack={back}>
      <div className="card pad">
        <Segmented value={term} onChange={setTerm} className="on-white" options={[{ id: "short", label: "Short term" }, { id: "long", label: "Long term" }]} />
        <Field label="What do you want to achieve?" value={title} onChange={(v) => { setTitle(v); setErr(""); }} error={err} placeholder="e.g. Apply to 2 jobs today" maxLength={70} />
        {!title && (
          <div className="pills-wrap tight">
            {IDEAS.map((i) => <Pill key={i} variant="chip-dark" onClick={() => setTitle(i)}>{i}</Pill>)}
          </div>
        )}
        <div className="field">
          <label htmlFor="newstep">Steps (optional)</label>
          <div className="inline-add">
            <input id="newstep" value={st} onChange={(e) => setSt(e.target.value)} placeholder="Add a step" maxLength={80}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStep(); } }} />
            <button type="button" className="btn solid sm" onClick={addStep} disabled={!st.trim()}>Add</button>
          </div>
          {steps.length > 0 && (
            <ul className="chips-list">
              {steps.map((s, i) => (
                <li key={i}>{s}<button type="button" aria-label={`Remove ${s}`} onClick={() => setSteps(steps.filter((_, j) => j !== i))}><X size={14} /></button></li>
              ))}
            </ul>
          )}
        </div>
        <ToggleRow title="Make this goal public" text="Others can cheer you on and comment. You can change this any time." checked={pub} onChange={setPub} />
        <button type="button" className="btn solid wide" onClick={create}>Create goal</button>
      </div>
    </Screen>
  );
}

/* ------------------------------ goal support ------------------------------ */
export function GoalSupport({ goalId }) {
  const { db, person, act, back, go } = useApp();
  const found = findGoal(db, goalId);
  if (!found) return <Screen title="Goal support" onBack={back}><Empty title="Goal not found" text="It may have been deleted or made private." /></Screen>;
  const { goal: g, ownerId } = found;
  const owner = person(ownerId);
  const mine = ownerId === "me";
  const cheered = g.cheers.includes("me");
  const { done, total } = goalStats(g);
  const cheerers = g.cheers.filter((id) => !db.blocked.includes(id)).map(person);

  return (
    <Screen title="Goal support" sub={mine ? "Your goal" : `${owner.name}'s goal`} onBack={back}
      footer={<Composer onSend={(text) => act("commentGoal", { id: g.id, text })} placeholder={mine ? "Reply or add an update…" : "Send encouragement…"} />}>
      <article className="card pad">
        <button type="button" className="gc-head" onClick={() => !mine && go("profile", { id: ownerId })}>
          <Avatar person={owner} size={42} />
          <span><b>{owner.name}</b><small>{g.term === "short" ? "Short-term goal" : "Long-term goal"}</small></span>
        </button>
        <div className="gc-main">
          <div><h3 className="lg">{g.title}</h3><p>{done} of {total} steps done</p></div>
          <Ring value={done} max={total} size={74} stroke={7} tone="dark" label={`${Math.round((done / Math.max(total, 1)) * 100)}%`} />
        </div>
        <ul className="steps ro">
          {g.steps.map((s) => (
            <li key={s.id}><span className={`ck ${s.done ? "on" : ""}`}>{s.done && <Check size={13} strokeWidth={3.5} />}</span><span className={s.done ? "done" : ""}>{s.label}</span></li>
          ))}
        </ul>
        {g.completedAt && <div className="done-banner dark"><Trophy size={16} /> Goal complete!</div>}
      </article>

      <div className="cheer-row">
        <div className="faces">
          {cheerers.slice(0, 5).map((p) => <Avatar key={p.id} person={p} size={30} className="face" />)}
          <span>{cheerers.length === 0 ? "No cheers yet" : plural(cheerers.length, "cheer")}</span>
        </div>
        {!mine && (
          <button type="button" className={`btn ${cheered ? "white" : "ghost"} sm`} aria-pressed={cheered} onClick={() => act("cheerGoal", { id: g.id })}>
            <Heart size={15} fill={cheered ? "currentColor" : "none"} /> {cheered ? "Cheering" : "Cheer"}
          </button>
        )}
      </div>

      <h3 className="sec-sm">{plural(g.comments.length, "comment")}</h3>
      <div className="thread">
        {g.comments.length === 0 && <p className="lead">No comments yet. {mine ? "Share an update to get the conversation going." : "Be the first to cheer her on."}</p>}
        {g.comments.map((c) => <Comment key={c.id} c={c} onPerson={(id) => id !== "me" && go("profile", { id })} />)}
      </div>
    </Screen>
  );
}
