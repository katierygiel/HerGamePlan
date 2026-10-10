import { useRef, useState } from "react";
import { Camera, Check, Eye, EyeOff, ChevronRight } from "lucide-react";
import { useApp } from "../store";
import { INTEREST_OPTIONS, ROLES } from "../data/seed";
import { authApi, niceError } from "../api/supa";
import { Field, Logo, Pill, Screen, Sheet, Wave, Avatar, SearchBar } from "../ui";
import { isEmail, resizeImage } from "../util";
import { LegalBody } from "./Legal";

export function Splash() {
  return (
    <div className="splash">
      <Logo kind="lockup" width={190} className="splash-logo" />
    </div>
  );
}

export function Welcome({ onSignIn, onSignUp }) {
  return (
    <div className="welcome">
      <div className="welcome-top">
        <h1 className="stack">HER<br />GAME<br />PLAN</h1>
        <div className="tabs-lite">
          <button type="button" onClick={onSignIn}>Sign in</button>
          <button type="button" onClick={onSignUp}>Sign up</button>
        </div>
      </div>
      <Wave fill="#fff" />
      <div className="welcome-bot">
        <Logo kind="icon" width={104} />
        <p className="wtag">Women in Sports Leading The Way:<br />Your Playbook for Success</p>
        <button type="button" className="btn white wide" onClick={onSignUp}>Get started</button>
        <button type="button" className="linkish" onClick={onSignIn}>I already have an account <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

function LegalSheet({ open, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title="Terms & Privacy" tall>
      <LegalBody />
    </Sheet>
  );
}

export function AuthScreen({ mode, setMode, onForgot, onBack }) {
  const { toast } = useApp();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", password: "", invite: "", agree: false });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [legal, setLegal] = useState(false);
  const [confirmSent, setConfirmSent] = useState("");
  const up = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined, form: undefined })); };
  const signup = mode === "signup";

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (signup && !f.firstName.trim()) er.firstName = "Enter your first name";
    if (signup && !f.lastName.trim()) er.lastName = "Enter your last name";
    if (!isEmail(f.email)) er.email = "Enter a valid email address";
    if (!f.password) er.password = "Enter your password";
    else if (signup && f.password.length < 8) er.password = "Use at least 8 characters";
    if (signup && !f.invite.trim()) er.invite = "Enter your invite code";
    if (signup && !f.agree) er.agree = "Please agree to continue";
    if (Object.keys(er).length) { setErrors(er); return; }

    setBusy(true);
    const email = f.email.trim().toLowerCase();
    try {
      if (signup) {
        if (!(await authApi.checkInvite(f.invite))) { setErrors({ invite: "That invite code isn't valid." }); setBusy(false); return; }
        const { needsConfirm } = await authApi.signUp({ firstName: f.firstName.trim(), lastName: f.lastName.trim(), email, password: f.password, inviteCode: f.invite });
        if (needsConfirm) { setConfirmSent(email); setBusy(false); return; }
        toast(`Welcome, ${f.firstName.trim()}!`);
      } else {
        await authApi.signIn({ email, password: f.password });
      }
    } catch (err) {
      setErrors({ form: niceError(err) });
    }
    setBusy(false);
  };

  const anyError = Object.values(errors).some(Boolean);

  if (confirmSent) {
    return (
      <section className="screen auth light-auth">
        <header className="auth-top"><button type="button" className="auth-back" onClick={onBack} aria-label="Back">←</button><Logo kind="lockup" width={150} /></header>
        <Wave fill="var(--blitz)" />
        <div className="auth-body">
          <h2 className="auth-h">Check your email</h2>
          <p className="auth-p">We sent a confirmation link to <b>{confirmSent}</b>. Tap it, then come back and sign in.</p>
          <button type="button" className="btn solid wide" onClick={() => { setConfirmSent(""); setMode("signin"); }}>Back to sign in</button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen auth light-auth">
      <header className="auth-top">
        <button type="button" className="auth-back" onClick={onBack} aria-label="Back">←</button>
        <Logo kind="lockup" width={150} />
      </header>
      <Wave fill="var(--blitz)" />
      <form className="auth-body" onSubmit={submit} noValidate>
        {anyError && <div className="banner" role="alert">{errors.form || "Please check the highlighted fields"}</div>}
        <div className="tabs-lite on-white" role="tablist">
          <button type="button" role="tab" aria-selected={!signup} className={!signup ? "on" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button type="button" role="tab" aria-selected={signup} className={signup ? "on" : ""} onClick={() => setMode("signup")}>Sign up</button>
        </div>
        {signup && <p className="auth-p small">Her Game Plan is invite-only while we test with our first playmakers. Enter the code you were given.</p>}
        {signup && <Field label="Invite code" value={f.invite} onChange={(v) => up("invite")(v.toUpperCase())} error={errors.invite} autoComplete="off" placeholder="e.g. PLAYMAKER26" />}
        {signup && (
          <div className="two">
            <Field label="First name" value={f.firstName} onChange={up("firstName")} error={errors.firstName} autoComplete="given-name" />
            <Field label="Last name" value={f.lastName} onChange={up("lastName")} error={errors.lastName} autoComplete="family-name" />
          </div>
        )}
        <Field label="Email" type="email" value={f.email} onChange={up("email")} error={errors.email} autoComplete="email" placeholder="you@email.com" />
        <div className="pw">
          <Field label="Password" type={show ? "text" : "password"} value={f.password} onChange={up("password")} error={errors.password}
            autoComplete={signup ? "new-password" : "current-password"} hint={signup ? "At least 8 characters" : undefined} />
          <button type="button" className="pw-eye" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {signup && (
          <label className={`check ${errors.agree ? "err" : ""}`}>
            <input type="checkbox" checked={f.agree} onChange={(e) => up("agree")(e.target.checked)} />
            <span className="box">{f.agree && <Check size={13} strokeWidth={3.5} />}</span>
            <span>I agree to the <button type="button" className="inline-link" onClick={() => setLegal(true)}>Terms &amp; Privacy Policy</button></span>
          </label>
        )}
        {errors.agree && <p className="ferr">{errors.agree}</p>}
        <button type="submit" className="btn solid wide" disabled={busy}>{busy ? "One moment…" : signup ? "Create account" : "Sign in"}</button>
        <p className="alt">
          {signup ? <>Already have an account? <button type="button" className="inline-link" onClick={() => setMode("signin")}>Sign in</button></>
            : <><button type="button" className="inline-link" onClick={onForgot}>Forgot password?</button></>}
        </p>
      </form>
      <LegalSheet open={legal} onClose={() => setLegal(false)} />
    </section>
  );
}

/* ---------------- forgot password (we email a reset link) ---------------- */
export function Forgot({ onBack }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e?.preventDefault();
    if (!isEmail(email)) { setErr("Enter a valid email address"); return; }
    setBusy(true);
    try { await authApi.sendReset(email.trim().toLowerCase()); setSent(true); }
    catch (er) { setErr(niceError(er)); }
    setBusy(false);
  };

  return (
    <section className="screen auth light-auth">
      <header className="auth-top">
        <button type="button" className="auth-back" onClick={onBack} aria-label="Back">←</button>
        <Logo kind="lockup" width={150} />
      </header>
      <Wave fill="var(--blitz)" />
      <form className="auth-body" onSubmit={send} noValidate>
        <h2 className="auth-h">Forgot password</h2>
        {!sent ? (<>
          <p className="auth-p">Enter your email and we'll send you a link to choose a new password.</p>
          <Field label="Email" type="email" value={email} onChange={(v) => { setEmail(v); setErr(""); }} error={err} autoComplete="email" />
          <button type="submit" className="btn solid wide" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
        </>) : (<>
          <p className="auth-p">If an account exists for <b>{email}</b>, a reset link is on its way. It can take a few minutes. Check spam if you don't see it.</p>
          <button type="button" className="btn solid wide" onClick={send} disabled={busy}>Send it again</button>
        </>)}
        <p className="alt"><button type="button" className="inline-link" onClick={onBack}>Back to sign in</button></p>
      </form>
    </section>
  );
}

/** shown after tapping the link in the reset email */
export function NewPassword({ onDone }) {
  const { toast } = useApp();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    if (pw.length < 8) { setErr("Use at least 8 characters"); return; }
    setBusy(true);
    try { await authApi.setPassword(pw); toast("Password updated."); onDone(); }
    catch (er) { setErr(niceError(er)); }
    setBusy(false);
  };
  return (
    <section className="screen auth light-auth">
      <header className="auth-top"><span /><Logo kind="lockup" width={150} /></header>
      <Wave fill="var(--blitz)" />
      <form className="auth-body" onSubmit={save} noValidate>
        <h2 className="auth-h">Choose a new password</h2>
        <Field label="New password" type="password" value={pw} onChange={(v) => { setPw(v); setErr(""); }} error={err} hint="At least 8 characters" autoComplete="new-password" />
        <button type="submit" className="btn solid wide" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
      </form>
    </section>
  );
}

/* ---------------- onboarding ---------------- */
export function Onboarding() {
  const { me, act, toast } = useApp();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(me.role || "");
  const [interests, setInterests] = useState(me.interests || []);
  const [q, setQ] = useState("");
  const [p, setP] = useState({ headline: me.headline || "", city: me.city || "", state: me.state || "", bio: me.bio || "", photo: me.photo || null });
  const fileRef = useRef(null);

  const titles = ["What's your role?", "Pick your interests", "Make it yours"];
  const toggleInterest = (i) => setInterests((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const list = INTEREST_OPTIONS.filter((i) => i.toLowerCase().includes(q.toLowerCase()));
  const canNext = step === 0 ? !!role : step === 1 ? interests.length >= 1 : true;

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setP((s) => ({ ...s, photo: null })); const photo = await resizeImage(file); setP((s) => ({ ...s, photo })); }
    catch (er) { toast(er.message, "note"); }
  };

  const next = () => {
    if (step < 2) { setStep(step + 1); return; }
    act("completeOnboarding", { role, interests, ...p });
    toast("You're in. Let's make a game plan!", "win");
  };

  return (
    <Screen title={titles[step]} sub={`Step ${step + 1} of 3`} onBack={step > 0 ? () => setStep(step - 1) : undefined}>
      <div className="dots" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>

      {step === 0 && (
        <div className="role-grid">
          {ROLES.map((r) => (
            <button key={r.id} type="button" className={`role ${role === r.id ? "on" : ""}`} onClick={() => setRole(r.id)} aria-pressed={role === r.id}>
              <b>{r.id}</b><span>{r.blurb}</span>
              {role === r.id && <Check size={18} className="role-ck" strokeWidth={3} />}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (<>
        <p className="lead">We use these to match you with jobs, mentors, and tips. Choose as many as you like.</p>
        <SearchBar value={q} onChange={setQ} placeholder="Search interests" />
        <div className="pills-wrap">
          {list.map((i) => <Pill key={i} variant="chip" active={interests.includes(i)} onClick={() => toggleInterest(i)}>{interests.includes(i) && <Check size={13} strokeWidth={3.5} />} {i}</Pill>)}
          {list.length === 0 && <p className="lead">No matches for “{q}”.</p>}
        </div>
      </>)}

      {step === 2 && (
        <div className="card pad">
          <div className="photo-pick">
            <button type="button" className="photo-btn" onClick={() => fileRef.current?.click()} aria-label="Upload a profile photo">
              <Avatar person={{ name: `${me.firstName} ${me.lastName}`, photo: p.photo }} size={88} />
              <span className="cam"><Camera size={16} /></span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
            <p>{p.photo ? "Looking good!" : "Add a profile photo (optional)"}</p>
          </div>
          <Field label="Headline" value={p.headline} onChange={(v) => setP({ ...p, headline: v })} placeholder="e.g. Sports marketing student" maxLength={70} />
          <div className="two">
            <Field label="City" value={p.city} onChange={(v) => setP({ ...p, city: v })} />
            <Field label="State" value={p.state} onChange={(v) => setP({ ...p, state: v })} maxLength={20} />
          </div>
          <Field label="About you" textarea rows={3} value={p.bio} onChange={(v) => setP({ ...p, bio: v })} maxLength={240} placeholder="A sentence or two. Optional." />
        </div>
      )}

      <button type="button" className="btn white wide mt" disabled={!canNext} onClick={next}>{step < 2 ? "Continue" : "Finish"}</button>
      {step === 2 && <button type="button" className="linkish center" onClick={next}>Skip for now</button>}
    </Screen>
  );
}
