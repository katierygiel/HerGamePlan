import { useState } from "react";
import { Bell, Flame, MessageCircle, Play, Plus, Minus, Heart, Target } from "lucide-react";
import { useApp } from "../store";
import { VIDEO } from "../data/seed";
import { Avatar, IconBtn, Ring, Screen } from "../ui";
import { ArticleCard, VideoModal } from "./Tips";
import { ringText } from "./Goals";
import { timeAgo } from "../util";

function GoalMini({ g, term }) {
  const { A, go } = useApp();
  const label = term === "short" ? "Short term:" : "Long term:";
  if (!g) {
    return (
      <div className="gm">
        <h4>{label}</h4>
        <p>No goal yet</p>
        <button type="button" className="gm-add" onClick={() => go("newGoal", { term })}><Plus size={14} /> Add one</button>
      </div>
    );
  }
  return (
    <div className="gm">
      <h4>{label}</h4>
      <p>{g.title}</p>
      <div className="gm-ring">
        <button type="button" className="pm" aria-label={`One fewer step done: ${g.title}`} onClick={() => A.adjustGoal(g.id, -1)}><Minus size={14} strokeWidth={3} /></button>
        <Ring tone="dark" size={66} stroke={7} {...ringText(g)} />
        <button type="button" className="pm" aria-label={`One more step done: ${g.title}`} onClick={() => A.adjustGoal(g.id, 1)}><Plus size={14} strokeWidth={3} /></button>
      </div>
      <button type="button" className="vd" onClick={() => (g.isPublic ? go("goalSupport", { goalId: g.id }) : go("goals"))}>
        {g.isPublic ? `view discussion (${g.comments.length})` : "private goal"}
      </button>
    </div>
  );
}

export default function Home() {
  const { db, me, go, tab, streak, unreadNotifs, unreadMessages, person } = useApp();
  const [video, setVideo] = useState(false);

  const pick = (t) => db.goals.filter((g) => g.term === t).sort((a, b) => Number(!!a.completedAt) - Number(!!b.completedAt) || b.ts - a.ts)[0];
  const activeGoals = db.goals.filter((g) => !g.completedAt).length;
  const post = db.posts.find((p) => !db.blocked.includes(p.authorId));
  const postAuthor = post ? person(post.authorId) : null;
  const postAuthorFallback = person("me");

  return (
    <Screen
      title={`Welcome, ${me.firstName || "there"}`}
      left={<IconBtn icon={Bell} label="Notifications" badge={unreadNotifs} onClick={() => go("notifications")} />}
      right={<button type="button" className="hdr-avatar" aria-label="My profile" onClick={() => go("profile", { id: "me" })}><Avatar person={person("me")} size={36} /></button>}
    >
      <div className="chips-row quick">
        <button type="button" className="qchip" onClick={() => tab("goals")}><Flame size={15} /> {streak > 0 ? `${streak}-day streak` : "Start a streak"}</button>
        <button type="button" className="qchip" onClick={() => tab("goals")}><Target size={15} /> {activeGoals} active {activeGoals === 1 ? "goal" : "goals"}</button>
        <button type="button" className="qchip" onClick={() => tab("connect")}><MessageCircle size={15} /> {unreadMessages > 0 ? `${unreadMessages} unread` : "Inbox clear"}</button>
      </div>

      <section className="card goals-card">
        <h2>My goals:</h2>
        <div className="gm-row">
          <GoalMini g={pick("short")} term="short" />
          <GoalMini g={pick("long")} term="long" />
        </div>
      </section>

      <button type="button" className="card vcard" onClick={() => setVideo(true)} aria-label="Watch the video of the week">
        <span className="vc-photo" style={{ backgroundImage: `url(${VIDEO.photo})` }} />
        <span className="vc-fade" />
        <span className="vc-play"><Play size={20} fill="#fff" /></span>
        <span className="vc-title">VIDEO<br />OF<br />THE<br />WEEK</span>
        <span className="vc-by"><small>{VIDEO.series}</small>Concept sample</span>
      </button>

      <h2 className="h-xl">Suggested for you…</h2>
      {post && (
        <>
          <h3 className="h-sub"><u>From the community:</u></h3>
          <button type="button" className="card comm" onClick={() => tab("connect")}>
            <Avatar person={postAuthor} size={40} />
            <span><b>{postAuthor.name}</b><small>{timeAgo(post.ts)}</small><em>{post.text}</em><i><Heart size={13} /> {post.likes.length} · <MessageCircle size={13} /> {post.comments.length}</i></span>
          </button>
          <button type="button" className="more" onClick={() => tab("connect")}>view more…</button>
        </>
      )}

      {!post && (
        <>
          <h3 className="h-sub"><u>From the community:</u></h3>
          <button type="button" className="card comm" onClick={() => tab("connect")}>
            <Avatar person={postAuthorFallback} size={40} />
            <span><b>Be the first to post</b><em>Share a win, ask a question, or say hi to the other playmakers.</em></span>
          </button>
        </>
      )}

      <h3 className="h-sub"><u>Tips and tricks:</u></h3>
      {db.articles.slice(0, 2).map((a) => <ArticleCard key={a.id} a={a} />)}
      <button type="button" className="more" onClick={() => tab("tips")}>view more…</button>
      <VideoModal open={video} onClose={() => setVideo(false)} />
    </Screen>
  );
}
