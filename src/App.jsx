import { useEffect, useState } from "react";
import { AppProvider, useApp } from "./store";
import { Confetti, NavBar, Toasts } from "./ui";
import { AuthScreen, Forgot, Onboarding, Splash, Welcome } from "./screens/Auth";
import Home from "./screens/Home";
import Goals, { GoalSupport, NewGoal } from "./screens/Goals";
import Jobs, { Apply, Applied, JobDetail, PostJob } from "./screens/Jobs";
import Tips, { Article, Discussion } from "./screens/Tips";
import Connect, { Chat } from "./screens/Connect";
import { EditProfile, Notifications, Profile, Settings } from "./screens/Profile";

const ROUTES = {
  home: () => <Home />,
  goals: () => <Goals />,
  tips: () => <Tips />,
  jobs: () => <Jobs />,
  connect: () => <Connect />,
  newGoal: (p) => <NewGoal term={p.term} />,
  goalSupport: (p) => <GoalSupport goalId={p.goalId} />,
  job: (p) => <JobDetail id={p.id} />,
  apply: (p) => <Apply id={p.id} />,
  applied: (p) => <Applied id={p.id} />,
  postJob: () => <PostJob />,
  tracker: () => <Jobs view="tracker" pushed />,
  article: (p) => <Article id={p.id} />,
  discussion: (p) => <Discussion id={p.id} />,
  chat: (p) => <Chat userId={p.userId} />,
  profile: (p) => <Profile id={p.id} />,
  editProfile: () => <EditProfile />,
  settings: () => <Settings />,
  notifications: () => <Notifications />,
};

function Shell() {
  const { db, act, top, nav, tab, unreadMessages, confettiKey, toast } = useApp();
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState("welcome");
  const signedIn = db.session.signedIn;

  useEffect(() => { const t = setTimeout(() => setBooted(true), 1400); return () => clearTimeout(t); }, []);
  useEffect(() => { if (!signedIn) setView("welcome"); }, [signedIn]);

  let content;
  let showNav = false;
  if (!booted) content = <Splash />;
  else if (!signedIn) {
    if (view === "welcome") content = <Welcome onSignIn={() => setView("signin")} onSignUp={() => setView("signup")} onDemo={() => { act("loadDemo"); toast("Welcome to the demo, Emma!"); }} />;
    else if (view === "forgot") content = <Forgot onBack={() => setView("signin")} onDone={() => setView("signin")} />;
    else content = <AuthScreen key={view} mode={view} setMode={setView} onForgot={() => setView("forgot")} onBack={() => setView("welcome")} />;
  } else if (!db.me.onboarded) content = <Onboarding />;
  else {
    const render = ROUTES[top.name] || ROUTES.home;
    content = <div className="route" key={`${nav.stack.length}:${top.name}:${JSON.stringify(top.params)}`}>{render(top.params)}</div>;
    showNav = true;
  }

  return (
    <div className="stage">
      <div className="device">
        {content}
        {showNav && <NavBar active={nav.tab} onTab={tab} unread={unreadMessages} />}
        <div id="overlay-root" />
        <Toasts />
        <Confetti k={confettiKey} />
      </div>
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
