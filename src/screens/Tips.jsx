import { useEffect, useRef, useState } from "react";
import { Bookmark, MessageCircle, Pause, Play } from "lucide-react";
import { useApp } from "../store";
import { VIDEO } from "../data/seed";
import { Comment, Composer, Empty, Logo, Pill, Screen, Sheet } from "../ui";
import { plural } from "../util";

/* ------------------------------ video player ------------------------------ */
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function VideoModal({ open, onClose }) {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const tick = useRef(null);

  useEffect(() => {
    if (!open) { setPlaying(false); return undefined; }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!playing) return undefined;
    tick.current = setInterval(() => setT((x) => { if (x + 1 >= VIDEO.length) { setPlaying(false); return VIDEO.length; } return x + 1; }), 1000);
    return () => clearInterval(tick.current);
  }, [playing]);

  const chapter = [...VIDEO.chapters].reverse().find(([s]) => t >= s) || VIDEO.chapters[0];

  return (
    <Sheet open={open} onClose={onClose} title={VIDEO.series} tall>
      <div className="player" style={{ backgroundImage: `url(${VIDEO.photo})` }}>
        <div className="player-shade" />
        <p className="player-title">{VIDEO.title}</p>
        <button type="button" className="player-play" aria-label={playing ? "Pause" : "Play"} onClick={() => { if (t >= VIDEO.length) setT(0); setPlaying((p) => !p); }}>
          {playing ? <Pause size={30} fill="#fff" /> : <Play size={30} fill="#fff" />}
        </button>
        {playing && <div className="eq" aria-hidden="true"><i /><i /><i /><i /></div>}
        <p className="player-cap">{chapter[1]}</p>
      </div>
      <div className="scrub">
        <input type="range" min={0} max={VIDEO.length} value={t} aria-label="Seek" onChange={(e) => setT(Number(e.target.value))} style={{ "--p": `${(t / VIDEO.length) * 100}%` }} />
        <div><span>{fmt(t)}</span><span>{fmt(VIDEO.length)}</span></div>
      </div>
      <h4 className="sheet-h4">Chapters</h4>
      <ul className="chapters">
        {VIDEO.chapters.map(([s, label]) => (
          <li key={s}><button type="button" className={chapter[0] === s ? "on" : ""} onClick={() => { setT(s); setPlaying(true); }}><span>{fmt(s)}</span>{label}</button></li>
        ))}
      </ul>
      <p className="sheet-text small"><b>Concept sample.</b> This preview shows how the weekly video will look. Real episodes are coming.</p>
    </Sheet>
  );
}

/* ------------------------------ article card ------------------------------ */
export function ArticleCard({ a }) {
  const { db, go, act, toast } = useApp();
  const saved = db.bookmarks.includes(a.id);
  return (
    <article className="card artcard" onClick={() => go("article", { id: a.id })}>
      <Pill variant="chip-dark" className="cat">{a.cat}</Pill>{a.isSample && <Pill variant="tag" className="sample">Concept sample</Pill>}
      <h3>{a.title}</h3>
      <p>{a.excerpt}</p>
      <div className="art-meta">
        <span className="by"><Logo kind="icon" tone="purple" width={22} />{a.author}</span>
        <span className="mm"><MessageCircle size={14} /> {a.comments.length}</span>
        <span className="mm">{a.read} min</span>
        <button type="button" className={`bm ${saved ? "on" : ""}`} aria-pressed={saved} aria-label={saved ? "Remove bookmark" : "Bookmark article"}
          onClick={(e) => { e.stopPropagation(); act("toggleBookmark", { id: a.id }); toast(saved ? "Bookmark removed" : "Saved to your bookmarks"); }}>
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}

/* ------------------------------- tips tab ------------------------------- */
export default function Tips() {
  const { db, go } = useApp();
  const [cat, setCat] = useState("All");
  const [video, setVideo] = useState(false);
  const cats = ["All", ...Array.from(new Set(db.articles.map((a) => a.cat))), "Saved"];
  const list = db.articles.filter((a) => (cat === "All" ? true : cat === "Saved" ? db.bookmarks.includes(a.id) : a.cat === cat));

  return (
    <Screen title="Tips and tricks">
      <h2 className="h-lg">Video of the week:</h2>
      <div className="vow">
        <button type="button" className="vow-thumb" onClick={() => setVideo(true)} aria-label="Play video of the week">
          <span className="vow-photo" style={{ backgroundImage: `url(${VIDEO.photo})` }} />
          <span className="vow-cap">SPORTS REPORTER<br />DAY IN MY LIFE</span>
          <span className="vow-play"><Play size={22} fill="#fff" /></span>
          <span className="vow-bar"><i /></span>
        </button>
        <div className="vow-info">
          <p className="up">{VIDEO.series}</p>
          <p className="up">{VIDEO.role}</p>
          <p className="up sample-flag">Concept sample</p>
          <img src={VIDEO.photo} alt="" className="vow-face" />
        </div>
      </div>
      <p className="vow-blurb">{VIDEO.blurb}</p>

      <h2 className="h-lg">Highlighted articles:</h2>
      <div className="chips-row" role="tablist" aria-label="Article categories">
        {cats.map((c) => <Pill key={c} variant="chip" active={cat === c} onClick={() => setCat(c)}>{c}{c === "Saved" && db.bookmarks.length > 0 ? ` · ${db.bookmarks.length}` : ""}</Pill>)}
      </div>
      {list.length === 0
        ? <Empty icon={Bookmark} title="Nothing here yet" text={cat === "Saved" ? "Tap the bookmark on an article to save it for later." : "No articles in this category yet."} />
        : list.map((a) => <ArticleCard key={a.id} a={a} />)}
      <VideoModal open={video} onClose={() => setVideo(false)} />
    </Screen>
  );
}

/* ------------------------------- reader ------------------------------- */
export function Article({ id }) {
  const { db, back, go, act, toast } = useApp();
  const a = db.articles.find((x) => x.id === id);
  if (!a) return <Screen title="Article" onBack={back}><Empty title="Article not found" /></Screen>;
  const saved = db.bookmarks.includes(a.id);
  return (
    <Screen variant="light" title={a.title} sub={a.role ? `${a.author} | ${a.role}` : a.author} onBack={back} className="reader">
      {a.photo && <img className="art-photo" src={a.photo} alt="" />}
      <div className="prose">
        {a.blocks.map((b, i) => (
          <div key={i}>
            {b.h && <h3>{b.h}</h3>}
            {b.p.split("\n\n").map((para, j) => <p key={j}>{para}</p>)}
          </div>
        ))}
      </div>
      <div className="reader-actions">
        <button type="button" className={`btn ${saved ? "solid" : "ghost-dark"}`} aria-pressed={saved} onClick={() => { act("toggleBookmark", { id: a.id }); toast(saved ? "Bookmark removed" : "Saved to your bookmarks"); }}>
          <Bookmark size={17} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
        </button>
        <button type="button" className="btn solid" onClick={() => go("discussion", { id: a.id })}><MessageCircle size={17} /> Open discussion · {a.comments.length}</button>
      </div>
      {a.isSample && (
        <div className="authorbox static">
          <Logo kind="icon" tone="purple" width={40} />
          <span><b>Concept sample</b><small>This article shows the format. It wasn't written by a real professional.</small></span>
        </div>
      )}
    </Screen>
  );
}

export function Discussion({ id }) {
  const { db, back, go, act } = useApp();
  const a = db.articles.find((x) => x.id === id);
  if (!a) return <Screen title="Discussion" onBack={back}><Empty title="Article not found" /></Screen>;
  return (
    <Screen title="Discussion" sub={a.title} onBack={back}
      footer={<Composer onSend={(text) => act("commentArticle", { id: a.id, text })} placeholder="Share your thoughts or ask a question…" />}>
      <p className="lead">{plural(a.comments.length, "comment")}. Share feedback, ask a question, or add your own experience.</p>
      <div className="thread">
        {a.comments.length === 0 && <Empty icon={MessageCircle} title="Start the conversation" text="Be the first to share a thought on this article." />}
        {a.comments.map((c) => <Comment key={c.id} c={c} onPerson={(pid) => pid !== "me" && go("profile", { id: pid })} />)}
      </div>
    </Screen>
  );
}
