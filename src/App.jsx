import { Component, useEffect, useState } from "react";
import { AppProvider, useApp } from "./store";
import { authApi } from "./api/supa";
import { Confetti, Logo, NavBar, Toasts } from "./ui";
import { AuthScreen, Forgot, NewPassword, Onboarding, Splash, Welcome } from "./screens/Auth";
import Home from "./screens/Home";
import Goals, { GoalSupport, NewGoal } from "./screens/Goals";
import Jobs from "./screens/Jobs";
import Tips, { Article, Discussion } from "./screens/Tips";
import Connect, { Chat, MentorApply } from "./screens/Connect";
import { EditProfile, Notifications, Profile, Settings } from "./screens/Profile";
import { Admin } from "./screens/Admin";

const ROUTES = {
  home: () => <Home />,
  goals: () => <Goals />,
  tips: () => <Tips />,
  jobs: () => <Jobs />,
  connect: () => <Connect />,
  newGoal: (p) => <NewGoal term={p.term} />,
  goalSupport: (p) => <GoalSupport goalId={p.goalId} />,
  article: (p) => <Article id={p.id} />,
  discussion: (p) => <Discussion id={p.id} />,
  chat: (p) => <Chat userId={p.userId} />,
  profile: (p) => <Profile id={p.id} />,
  editProfile: () => <EditProfile />,
  settings: () => <Settings />,
  notifications: () => <Notifications />,
  mentorApply: () => <MentorApply />,
  admin: () => <Admin />,
};

function LoadProblem({ message, onRetry }) {
  return (
    <div className="splash problem">
      <Logo kind="icon" width={84} />
      <h2>We couldn't load your account</h2>
      <p>{message || "Check your connection and try again."}</p>
      <button type="button" className="btn white" onClick={onRetry}>Try again</button>
      <button type="button" className="linkish" onClick={() => authApi.signOut()}>Sign out</button>
    </div>
  );
}

function Shell() {
  const { status, setStatus, loadError, retryLoad, db, top, nav, tab, unreadMessages, confettiKey } = useApp();
  const [minSplash, setMinSplash] = useState(false);
  const [view, setView] = useState("welcome");

  useEffect(() => { const t = setTimeout(() => setMinSplash(true), 1100); return () => clearTimeout(t); }, []);
  useEffect(() => { if (status === "out") setView("welcome"); }, [status]);

  let content;
  let showNav = false;
  if (status === "booting" || !minSplash || (status === "in" && !db)) content = <Splash />;
  else if (status === "error") content = <LoadProblem message={loadError} onRetry={retryLoad} />;
  else if (status === "recovery") content = <NewPassword onDone={() => setStatus("in")} />;
  else if (status === "out") {
    if (view === "welcome") content = <Welcome onSignIn={() => setView("signin")} onSignUp={() => setView("signup")} />;
    else if (view === "forgot") content = <Forgot onBack={() => setView("signin")} />;
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

class Boundary extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { console.error(err); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="stage"><div className="device"><div className="splash problem">
        <Logo kind="icon" width={84} />
        <h2>Something went wrong</h2>
        <p>Please reload. If it keeps happening, tell us in Settings → Send feedback.</p>
        <button type="button" className="btn white" onClick={() => window.location.reload()}>Reload</button>
      </div></div></div>
    );
  }
}

export default function App() {
  return <Boundary><AppProvider><Shell /></AppProvider></Boundary>;
}
