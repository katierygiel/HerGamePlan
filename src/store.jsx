import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { findGoal, ops, uid } from "./api/local";
import { authApi, hydrate, markActive, remote, subscribeLive, supabase } from "./api/supa";
import { streakOf } from "./util";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  /* status: booting → out | in | recovery (arrived from a password-reset email) */
  const [status, setStatus] = useState("booting");
  const [loadError, setLoadError] = useState("");
  const [db, setDb] = useState(null);
  const dbRef = useRef(null);
  const uidRef = useRef(null);

  const [nav, setNav] = useState({ tab: "home", stack: [] });
  const navRef = useRef(nav);
  navRef.current = nav;

  const [toasts, setToasts] = useState([]);
  const [confettiKey, setConfettiKey] = useState(0);

  const toast = useCallback((msg, tone = "ok") => {
    const id = uid();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const burst = useCallback(() => setConfettiKey((k) => k + 1), []);

  const setBoth = useCallback((next) => { dbRef.current = next; setDb(next); }, []);

  /* ---------------- loading + live refresh ---------------- */
  const pending = useRef(0);
  const dirty = useRef(false);
  const refreshTimer = useRef(null);
  const queue = useRef(Promise.resolve());

  const refresh = useCallback(async (quiet = true) => {
    const id = uidRef.current;
    if (!id) return;
    if (pending.current > 0) { dirty.current = true; return; }
    try {
      const fresh = await hydrate(id);
      if (pending.current > 0) { dirty.current = true; return; }
      const prev = dbRef.current;
      if (prev && quiet) {
        const seen = new Set(prev.notifications.map((n) => n.id));
        const incoming = fresh.notifications.filter((n) => !seen.has(n.id) && !n.read);
        if (incoming.length && fresh.settings.notifications && fresh.me.onboarded) toast(incoming[0].text, "note");
      }
      setBoth(fresh);
    } catch (e) {
      console.warn("refresh failed", e);
    }
  }, [setBoth, toast]);

  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => refresh(true), 450);
  }, [refresh]);

  const startSession = useCallback(async (userId) => {
    uidRef.current = userId;
    try {
      const fresh = await hydrate(userId);
      setBoth(fresh);
      setLoadError("");
      setStatus((s) => (s === "recovery" ? s : "in"));
      markActive(userId).catch(() => {});
    } catch (e) {
      console.error(e);
      setLoadError(e.message || "We couldn't load your account.");
      setStatus("error");
    }
  }, [setBoth]);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) startSession(data.session.user.id);
      else setStatus((s) => (s === "booting" ? "out" : s));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") { setStatus("recovery"); if (session) startSession(session.user.id); return; }
      if (event === "SIGNED_IN" && session && uidRef.current !== session.user.id) { setTimeout(() => startSession(session.user.id), 0); return; }
      if (event === "SIGNED_OUT") {
        uidRef.current = null;
        setBoth(null);
        setNav({ tab: "home", stack: [] });
        setStatus("out");
      }
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [startSession, setBoth]);

  /* realtime: any change in a table we care about triggers a (debounced) refresh */
  useEffect(() => {
    if (status !== "in") return undefined;
    const off = subscribeLive(scheduleRefresh);
    const onVisible = () => { if (document.visibilityState === "visible") scheduleRefresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", scheduleRefresh);
    return () => { off(); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("online", scheduleRefresh); };
  }, [status, scheduleRefresh]);

  /* ---------------- actions ---------------- */
  const act = useCallback((op, payload = {}) => {
    const fn = ops[op];
    if (!fn) { console.error("Unknown op:", op); return dbRef.current; }
    const prev = dbRef.current;
    const next = fn(prev, payload);
    setBoth(next);
    const save = remote[op];
    if (save) {
      pending.current += 1;
      const ctx = { uid: uidRef.current };
      queue.current = queue.current
        .then(() => save(payload, prev, next, ctx))
        .catch((e) => {
          console.error(`${op} failed`, e);
          toast(/row-level|permission|violates/i.test(e?.message || "") ? "That action isn't allowed." : "Couldn't save that. Check your connection.", "note");
          dirty.current = true;
        })
        .finally(() => {
          pending.current -= 1;
          if (pending.current === 0 && dirty.current) { dirty.current = false; scheduleRefresh(); }
        });
    }
    return next;
  }, [setBoth, toast, scheduleRefresh]);

  /* ---------------- navigation (with the browser / iPhone back gesture) ---------------- */
  const go = useCallback((name, params = {}) => {
    const len = navRef.current.stack.length + 1;
    try { window.history.pushState({ hgp: len }, ""); } catch (e) { /* noop */ }
    setNav((n) => ({ ...n, stack: [...n.stack, { name, params }] }));
  }, []);
  const back = useCallback(() => {
    if (navRef.current.stack.length === 0) return;
    if ((window.history.state?.hgp || 0) > 0) window.history.back();
    else setNav((n) => ({ ...n, stack: n.stack.slice(0, -1) }));
  }, []);
  const replace = useCallback((name, params = {}) => setNav((n) => ({ ...n, stack: [...n.stack.slice(0, -1), { name, params }] })), []);
  const tab = useCallback((t) => {
    const k = navRef.current.stack.length;
    setNav({ tab: t, stack: [] });
    // drop the history entries of the screens we just left so the back gesture stays in step
    if (k > 0 && window.history.state?.hgp === k) { try { window.history.go(-k); } catch (e) { /* noop */ } }
  }, []);

  useEffect(() => {
    try { window.history.replaceState({ hgp: 0 }, ""); } catch (e) { /* noop */ }
    const onPop = (e) => {
      const depth = e.state?.hgp ?? 0;
      setNav((n) => (depth < n.stack.length ? { ...n, stack: n.stack.slice(0, depth) } : n));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const top = nav.stack.length ? nav.stack[nav.stack.length - 1] : { name: nav.tab, params: {} };

  /* ---------------- people ---------------- */
  const person = useCallback((id) => {
    const d = dbRef.current;
    if (!d) return { id, name: "Member", headline: "", goals: [] };
    if (id === "me") {
      const m = d.me;
      return { ...m, id: "me", name: `${m.firstName} ${m.lastName}`.trim() || "You" };
    }
    return d.people.find((p) => p.id === id) || { id, name: "Member", headline: "", goals: [] };
  }, []);

  /* ---------------- higher-level actions (state change + side effects) ---------------- */
  const A = useMemo(() => {
    const checkComplete = (before, after) => {
      if (after?.completedAt && !before?.completedAt) { burst(); toast("Goal complete! Nice work.", "win"); }
    };
    return {
      toggleStep(goalId, stepId) {
        const before = findGoal(dbRef.current, goalId)?.goal;
        const next = act("toggleStep", { id: goalId, stepId });
        checkComplete(before, findGoal(next, goalId)?.goal);
      },
      adjustGoal(goalId, delta) {
        const before = findGoal(dbRef.current, goalId)?.goal;
        const next = act("adjustGoal", { id: goalId, delta });
        checkComplete(before, findGoal(next, goalId)?.goal);
      },
      addGoal(data) {
        const id = uid();
        act("addGoal", { ...data, id });
        toast("Goal added. Let's go!", "win");
        return id;
      },
      setGoalPublic(goalId, isPublic) {
        act("updateGoal", { id: goalId, patch: { isPublic } });
        toast(isPublic ? "Goal is public. Others can cheer you on." : "Goal is private again.");
      },
      send(userId, text) { act("sendMessage", { userId, text }); },
      requestMentor(mentorId, message) {
        act("requestMentor", { id: uid(), mentorId, message });
        toast("Request sent");
      },
      createPost(post) {
        act("createPost", { post: { ...post, id: uid() } });
        toast("Posted to the community");
      },
      async signOut() { await authApi.signOut(); },
    };
  }, [act, toast, burst]);

  const value = {
    status, loadError, retryLoad: () => (uidRef.current ? startSession(uidRef.current) : window.location.reload()),
    setStatus, db, me: db?.me, act, A, person, nav, top, go, back, replace, tab, toast, toasts, confettiKey, burst, refresh,
    unreadMessages: db ? db.conversations.reduce((n, c) => n + (c.unread || 0), 0) : 0,
    unreadNotifs: db ? db.notifications.filter((n) => !n.read).length : 0,
    streak: db ? streakOf(db.activity) : 0,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
