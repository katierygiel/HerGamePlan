import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { findGoal, load, ops, save, uid } from "./api/local";
import { firstOf, pick, streakOf } from "./util";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

/* Demo-mode "community" voices. In a real backend these are other humans. */
const MSG_REPLIES = [
  "Thanks for reaching out! Happy to chat. What's top of mind for you right now?",
  "Love this. Let's find a time this week. Does Thursday afternoon work?",
  "Great question. Short answer: yes, go for it. I can share what worked for me.",
  "Appreciate you sending this over. I'll take a look and get back to you soon.",
  "That's exactly the kind of initiative people notice. Keep going!",
];
const POST_COMMENTS = [
  "Love this. Thanks for sharing with the community!",
  "So relatable. Rooting for you!",
  "This is exactly why I love this network. Keep it up!",
];
const GOAL_COMMENTS = [
  "You've got this. Every step counts!",
  "Love seeing your progress. Keep going!",
  "Proud of you for putting this out there.",
];

export function AppProvider({ children }) {
  const [db, setDb] = useState(load);
  const dbRef = useRef(db);
  dbRef.current = db;

  const [nav, setNav] = useState({ tab: "home", stack: [] });
  const navRef = useRef(nav);
  navRef.current = nav;

  const [toasts, setToasts] = useState([]);
  const [typing, setTyping] = useState({});
  const [confettiKey, setConfettiKey] = useState(0);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { save(db); }, [db]);

  const act = useCallback((op, payload = {}) => {
    const fn = ops[op];
    if (!fn) { console.error("Unknown op:", op); return dbRef.current; }
    const next = fn(dbRef.current, payload);
    dbRef.current = next;
    setDb(next);
    return next;
  }, []);

  const later = useCallback((ms, fn) => { timers.current.push(setTimeout(fn, ms)); }, []);

  const toast = useCallback((msg, tone = "ok") => {
    const id = uid("t");
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const burst = useCallback(() => setConfettiKey((k) => k + 1), []);

  /* ---- navigation ---- */
  const go = useCallback((name, params = {}) => setNav((n) => ({ ...n, stack: [...n.stack, { name, params }] })), []);
  const back = useCallback(() => setNav((n) => ({ ...n, stack: n.stack.slice(0, -1) })), []);
  const replace = useCallback((name, params = {}) => setNav((n) => ({ ...n, stack: [...n.stack.slice(0, -1), { name, params }] })), []);
  const tab = useCallback((t) => setNav({ tab: t, stack: [] }), []);
  const top = nav.stack.length ? nav.stack[nav.stack.length - 1] : { name: nav.tab, params: {} };

  /* ---- people ---- */
  const person = useCallback((id) => {
    const d = dbRef.current;
    if (id === "me") {
      const m = d.me;
      return { ...m, id: "me", name: `${m.firstName} ${m.lastName}`.trim() || "You" };
    }
    return d.people.find((p) => p.id === id) || { id, name: "Member", headline: "", goals: [] };
  }, []);

  const pushNote = useCallback((text, to, kind) => {
    act("notify", { text, to, kind });
    if (dbRef.current.settings.notifications) toast(text, "note");
  }, [act, toast]);

  /* ---- higher-level actions (state change + side effects) ---- */
  const A = useMemo(() => {
    const checkComplete = (goalId, before, after) => {
      if (after?.completedAt && !before?.completedAt) { burst(); toast("Goal complete! Nice work.", "win"); }
    };
    const scheduleGoalEngagement = (goalId) => {
      later(7000, () => {
        const g = dbRef.current.goals.find((x) => x.id === goalId);
        if (!g || !g.isPublic) return;
        act("cheerGoal", { id: goalId, by: "u_olivia" });
        act("commentGoal", { id: goalId, by: "u_olivia", text: pick(GOAL_COMMENTS) });
        pushNote(`Olivia Carter cheered on your goal “${g.title}”`, { name: "goalSupport", params: { goalId } }, "cheer");
      });
    };

    return {
      toggleStep(goalId, stepId) {
        const before = findGoal(dbRef.current, goalId)?.goal;
        const next = act("toggleStep", { id: goalId, stepId });
        checkComplete(goalId, before, findGoal(next, goalId)?.goal);
      },
      adjustGoal(goalId, delta) {
        const before = findGoal(dbRef.current, goalId)?.goal;
        const next = act("adjustGoal", { id: goalId, delta });
        checkComplete(goalId, before, findGoal(next, goalId)?.goal);
      },
      addGoal(data) {
        const id = uid("g");
        act("addGoal", { ...data, id });
        toast("Goal added. Let's go!", "win");
        if (data.isPublic) scheduleGoalEngagement(id);
        return id;
      },
      setGoalPublic(goalId, isPublic) {
        act("updateGoal", { id: goalId, patch: { isPublic } });
        toast(isPublic ? "Goal is public. Others can cheer you on." : "Goal is private again.");
        if (isPublic) scheduleGoalEngagement(goalId);
      },
      send(userId, text) {
        act("sendMessage", { userId, text });
        setTyping((t) => ({ ...t, [userId]: true }));
        later(1800 + Math.random() * 1600, () => {
          act("sendMessage", { userId, text: pick(MSG_REPLIES), by: userId });
          setTyping((t) => ({ ...t, [userId]: false }));
          const cur = navRef.current;
          const t = cur.stack[cur.stack.length - 1];
          if (t && t.name === "chat" && t.params.userId === userId) act("markRead", { userId });
          else pushNote(`${person(userId).name} sent you a message`, { name: "chat", params: { userId } }, "message");
        });
      },
      requestMentor(mentorId, message) {
        act("requestMentor", { id: uid("mr"), mentorId, message });
        toast("Request sent");
        later(5500, () => {
          const d = dbRef.current;
          if (!d.mentorRequests.some((r) => r.mentorId === mentorId && r.status === "pending")) return;
          const m = person(mentorId);
          if (m.capacity === "Waitlist") {
            act("respondMentor", { mentorId, status: "waitlisted" });
            pushNote(`You're on ${firstOf(m.name)}'s waitlist. She'll reach out when a spot opens.`, { name: "profile", params: { id: mentorId } }, "mentor");
            return;
          }
          act("respondMentor", { mentorId, status: "accepted" });
          act("sendMessage", { userId: mentorId, by: mentorId, text: `Hi, it's ${firstOf(m.name)}! Thanks for reaching out. I'd love to mentor you. What's the first thing you'd like to tackle together?` });
          pushNote(`${m.name} accepted your mentorship request`, { name: "chat", params: { userId: mentorId } }, "mentor");
        });
      },
      apply(jobId, form, saveToProfile) {
        const id = uid("ap");
        act("applyToJob", { id, jobId, form, saveToProfile });
        later(9000, () => {
          const a = dbRef.current.applications.find((x) => x.id === id);
          if (a) pushNote(`${a.jobSnap.company} viewed your application`, { name: "tracker" }, "application");
        });
        return id;
      },
      createPost(post) {
        const id = uid("p");
        act("createPost", { post: { ...post, id } });
        toast("Posted to the community");
        later(5000, () => {
          if (!dbRef.current.posts.some((p) => p.id === id)) return;
          ["u_maria", "u_nina", "u_isabella"].slice(0, 2 + Math.floor(Math.random() * 2)).forEach((by) => act("likePost", { id, by }));
          act("commentPost", { id, by: "u_olivia", text: pick(POST_COMMENTS) });
          pushNote("3 people reacted to your post", { name: "connect" }, "like");
        });
      },
      signOut() { act("signOut"); setNav({ tab: "home", stack: [] }); },
    };
  }, [act, later, toast, burst, pushNote, person]);

  const value = {
    db, me: db.me, act, A, person, nav, top, go, back, replace, tab, toast, toasts, typing,
    confettiKey, burst,
    unreadMessages: db.conversations.reduce((n, c) => n + (c.unread || 0), 0),
    unreadNotifs: db.notifications.filter((n) => !n.read).length,
    streak: streakOf(db.activity),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
