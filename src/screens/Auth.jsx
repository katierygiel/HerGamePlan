import { useRef, useState } from "react";
import { Camera, Check, Eye, EyeOff, ChevronRight } from "lucide-react";
import { useApp } from "../store";
import { DEMO_EMAIL, DEMO_PASSWORD, INTEREST_OPTIONS, ROLES } from "../data/seed";
import { Field, Logo, Pill, Screen, Sheet, Wave, Avatar, SearchBar } from "../ui";
import { isEmail, resizeImage, sha256 } from "../util";

export function Splash() {
  return (
    <div className="splash">
      <Logo kind="lockup" width={190} className="splash-logo" />
    </div>
  );
}

export function Welcome({ onSignIn, onSignUp, onDemo }) {
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
        <button type="button" className="linkish" onClick={onDemo}>Explore the demo <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

function LegalSheet({ open, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title="Terms & Privacy" tall>
      <p className="sheet-text"><b>Placeholder text.</b> Replace with lawyer-reviewed Terms of Service and a Privacy Policy before launch. Apple requires a privacy policy for any app with accounts.</p>
      <h4 className="sheet-h4">Community standards</h4>
      <p className="sheet-text">Be supportive. No harassment, discrimination, or spam. Job posts must be real opportunities. You can report or block any member at any time.</p>
      <h4 className="sheet-h4">Your data</h4>
      <p className="sheet-text">In this demo, everything is stored only in your browser. In production, describe what you collect, why, who you share it with, and how members can export or delete their data.</p>
    </Sheet>
  );
}

export function AuthScreen({ mode, setMode, onForgot, onBack }) {
  const { db, act, toast } = useApp();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", password: "", agree: false });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [legal, setLegal] = useState(false);
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
    if (signup && !f.agree) er.agree = "Please agree to continue";
    if (Object.keys(er).length) { setErrors(er); return; }

    setBusy(true);
    const email = f.email.trim().toLowerCase();
    const acct = db.accounts.find((a) => a.email === email);
    if (signup) {
      if (acct) { setErrors({ email: "An account with this email already exists. Try signing in." }); setBusy(false); return; }
      act("signUp", { firstName: f.firstName.trim(), lastName: f.lastName.trim(), email, hash: await sha256(f.password) });
      toast(`Welcome, ${f.firstName.trim()}!`);
    } else if (email === DEMO_EMAIL && f.password === DEMO_PASSWORD) {
      act("loadDemo");
      toast("Signed in to the demo account");
    } else if (acct && acct.hash === (await sha256(f.password))) {
      act("signIn", { email });
    } else {
      setErrors({ form: "Email or password is incorrect." });
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  const anyError = Object.values(errors).some(Boolean);

  return (
    <section className="screen auth light-auth">
      <header className="auth-top">
        <button type="button" className="auth-back" onClick={onBack} aria-label="Back">←</button>
        <Logo kind="lockup" width={150} />
      </header>
      <Wave fill="var(--blitz)" />
      <form className="auth-body" onSubmit={submit} noValidate>
        {anyError && <div className="banner" role="alert">{errors.form || "Please fill out all fields in order"}</div>}
        <div className="tabs-lite on-white" role="tablist">
          <button type="button" role="tab" aria-selected={!signup} className={!signup ? "on" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button type="button" role="tab" aria-selected={signup} className={signup ? "on" : ""} onClick={() => setMode("signup")}>Sign up</button>
        </div>
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
        {!signup && (
          <button type="button" className="demo-hint" onClick={() => { setF((s) => ({ ...s, email: DEMO_EMAIL, password: DEMO_PASSWORD })); setErrors({}); }}>
            Try the demo account: <b>{DEMO_EMAIL}</b>
          </button>
        )}
      </form>
      <LegalSheet open={legal} onClose={() => setLegal(false)} />
    </section>
  );
}

/* ---------------- forgot password (email → code → new password) ---------------- */
function CodeInput({ value, onChange, length = 5 }) {
  const refs = useRef([]);
  const at = (i) => (value[i] && value[i] !== " " ? value[i] : "");
  const set = (i, ch) => {
    const arr = value.padEnd(length, " ").split("");
    arr[i] = ch || " ";
    onChange(arr.join(""));
    if (ch && i < length - 1) refs.current[i + 1]?.focus();
  };
  return (
    <div className="code" onPaste={(e) => { const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length); if (t) { e.preventDefault(); onChange(t.padEnd(length, " ")); refs.current[Math.min(t.length, length - 1)]?.focus(); } }}>
      {Array.from({ length }, (_, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`} value={at(i)}
          onChange={(e) => set(i, e.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={(e) => { if (e.key === "Backspace" && !at(i) && i > 0) refs.current[i - 1]?.focus(); }} />
      ))}
    </div>
  );
}

export function Forgot({ onDone, onBack }) {
  const { db, act, toast } = useApp();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const send = () => {
    if (!isEmail(email)) { setErr("Enter a valid email address"); return; }
    setSent(String(10000 + Math.floor(Math.random() * 90000)));
    setErr(""); setCode(""); setStep("code");
  };
  const verify = () => {
    if (code.replace(/ /g, "") !== sent) { setErr("That code doesn't match. Check it and try again."); return; }
    setErr(""); setStep("new");
  };
  const save = async () => {
    if (pw.length < 8) { setErr("Use at least 8 characters"); return; }
    const hash = await sha256(pw);
    const e = email.trim().toLowerCase();
    if (db.accounts.some((a) => a.email === e)) act("resetPassword", { email: e, hash });
    toast("Password updated. Sign in with your new password.");
    onDone();
  };

  return (
    <section className="screen auth light-auth">
      <header className="auth-top">
        <button type="button" className="auth-back" onClick={onBack} aria-label="Back">←</button>
        <Logo kind="lockup" width={150} />
      </header>
      <Wave fill="var(--blitz)" />
      <div className="auth-body">
        <h2 className="auth-h">Forgot password</h2>
        {step === "email" && (<>
          <p className="auth-p">Enter your email and we'll send a temporary sign-in code.</p>
          <Field label="Email" type="email" value={email} onChange={(v) => { setEmail(v); setErr(""); }} error={err} autoComplete="email" />
          <button type="button" className="btn solid wide" onClick={send}>Send code</button>
        </>)}
        {step === "code" && (<>
          <p className="auth-p">Enter the 5-digit code sent to <b>{email}</b>. It may take up to 15 minutes to arrive.</p>
          <div className="demo-code">Demo mode: no email is sent. Your code is <b>{sent}</b></div>
          <CodeInput value={code} onChange={(v) => { setCode(v); setErr(""); }} />
          {err && <p className="ferr center">{err}</p>}
          <button type="button" className="btn solid wide" disabled={code.replace(/ /g, "").length < 5} onClick={verify}>Continue</button>
          <p className="alt">Didn't get a code? <button type="button" className="inline-link" onClick={send}>Request new code</button></p>
        </>)}
        {step === "new" && (<>
          <p className="auth-p">Choose a new password for your account.</p>
          <Field label="New password" type="password" value={pw} onChange={(v) => { setPw(v); setErr(""); }} error={err} hint="At least 8 characters" autoComplete="new-password" />
          <button type="button" className="btn solid wide" onClick={save}>Save password</button>
        </>)}
        <p className="alt"><button type="button" className="inline-link" onClick={onBack}>Back to sign in</button></p>
      </div>
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
