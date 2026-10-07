import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Briefcase, Check, Home, Lightbulb, MessageCircle, Search, Send, Target, Trophy, X, Info } from "lucide-react";
import { useApp } from "./store";
import { initialsOf, timeAgo } from "./util";
import iconWhite from "./assets/logo-icon-white.png";
import iconPurple from "./assets/logo-icon-purple.png";
import lockWhite from "./assets/logo-lockup-white.png";
import lockPurple from "./assets/logo-lockup-purple.png";

/* ------------------------------ brand ------------------------------ */
export function Logo({ kind = "icon", tone = "white", width = 120, className = "" }) {
  const src = kind === "lockup" ? (tone === "white" ? lockWhite : lockPurple) : tone === "white" ? iconWhite : iconPurple;
  return <img className={`logo ${className}`} src={src} width={width} alt="Her Game Plan" draggable={false} />;
}

export const Wave = ({ fill = "#fff" }) => (
  <svg className="wave" viewBox="0 0 400 34" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0,0H400V10C340,32 285,6 215,14C150,22 95,34 0,14Z" style={{ fill }} />
  </svg>
);

/* ------------------------------ layout ------------------------------ */
export function IconBtn({ icon: Icon, label, onClick, badge = 0, tone = "dark", size = 22, className = "" }) {
  return (
    <button type="button" className={`ibtn ${tone} ${className}`} aria-label={label} onClick={onClick}>
      <Icon size={size} strokeWidth={2.1} />
      {badge > 0 && <span className="badge">{badge > 9 ? "9+" : badge}</span>}
    </button>
  );
}

/** Branded screen: heavy title on a white header, wave, then the purple body. variant="light" flips it. */
export function Screen({ title, sub, onBack, left, right, variant = "purple", children, footer, className = "" }) {
  return (
    <section className={`screen ${variant} ${className}`}>
      <header className="hdr">
        {(onBack || left) && (
          <div className="hl">{onBack ? <IconBtn icon={ArrowLeft} label="Back" onClick={onBack} tone={variant === "light" ? "light" : "dark"} /> : left}</div>
        )}
        <h1>{title}</h1>
        {sub && <p className="hsub">{sub}</p>}
        {right && <div className="hr">{right}</div>}
      </header>
      <Wave fill={variant === "light" ? "var(--blitz)" : "#fff"} />
      <div className="body">{children}</div>
      {footer}
    </section>
  );
}

const TABS = [
  { id: "home", icon: Home, label: "Home" },
  { id: "goals", icon: Target, label: "Goals" },
  { id: "tips", icon: Lightbulb, label: "Tips" },
  { id: "jobs", icon: Briefcase, label: "Jobs" },
  { id: "connect", icon: MessageCircle, label: "Connect" },
];
export function NavBar({ active, onTab, unread = 0 }) {
  return (
    <nav className="nav" aria-label="Main">
      {TABS.map(({ id, icon: Icon, label }) => (
        <button key={id} type="button" className={active === id ? "on" : ""} aria-label={label} aria-current={active === id ? "page" : undefined} onClick={() => onTab(id)}>
          <Icon size={30} strokeWidth={1.7} />
          {id === "connect" && unread > 0 && <span className="dot" />}
        </button>
      ))}
    </nav>
  );
}

/* ------------------------------ atoms ------------------------------ */
const AV = ["#233044", "#4F8A63", "#8046AD", "#4A1F6B", "#5B6B82"];
export function Avatar({ person, size = 40, className = "" }) {
  const name = person?.name || "";
  if (person?.photo) return <img className={`avatar ${className}`} src={person.photo} alt={name} style={{ width: size, height: size }} />;
  const bg = AV[(name.charCodeAt(0) + name.length) % AV.length];
  return <span className={`avatar ${className}`} style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }} role="img" aria-label={name}>{initialsOf(name)}</span>;
}

export function Pill({ children, variant = "solid", onClick, active, className = "", title }) {
  const T = onClick ? "button" : "span";
  return <T className={`pill ${variant} ${active ? "active" : ""} ${className}`} onClick={onClick} type={onClick ? "button" : undefined} title={title}>{children}</T>;
}

export function Ring({ value, max, size = 96, tone = "light", label, sub, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const light = tone === "light";
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={light ? "rgba(255,255,255,.28)" : "#D8D3DE"} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - pct * c} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ stroke: light ? "#fff" : "#662D91", transition: "stroke-dashoffset .45s cubic-bezier(.3,.7,.2,1)" }} />
      </svg>
      <div className="ring-c" style={{ color: light ? "#fff" : "#000" }}>
        <b style={{ fontSize: size * 0.27 }}>{label}</b>
        {sub && <small style={{ fontSize: Math.max(8, size * 0.095) }}>{sub}</small>}
      </div>
    </div>
  );
}

export function Segmented({ options, value, onChange, className = "" }) {
  return (
    <div className={`seg ${className}`} role="tablist">
      {options.map((o) => (
        <button key={o.id} type="button" role="tab" aria-selected={value === o.id} className={value === o.id ? "on" : ""} onClick={() => onChange(o.id)}>
          {o.label}{o.count > 0 && <i>{o.count}</i>}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon: Icon = Info, title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-i"><Icon size={26} /></div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search", right }) {
  return (
    <div className="searchbar">
      <Search size={18} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && <button type="button" aria-label="Clear" onClick={() => onChange("")}><X size={16} /></button>}
      {right}
    </div>
  );
}

export function Field({ label, value, onChange, type = "text", placeholder, error, textarea, rows = 3, maxLength, hint, autoComplete, inputMode }) {
  const id = useId();
  const common = { id, value, onChange: (e) => onChange(e.target.value), placeholder, maxLength, autoComplete, inputMode, "aria-invalid": !!error };
  return (
    <div className={`field ${error ? "err" : ""}`}>
      {label && <label htmlFor={id}>{label}</label>}
      {textarea ? <textarea rows={rows} {...common} /> : <input type={type} {...common} />}
      {error && <p className="ferr" role="alert">{error}</p>}
      {hint && !error && <p className="fhint">{hint}</p>}
    </div>
  );
}

/* ------------------------------ overlays ------------------------------ */
export function Sheet({ open, onClose, title, children, tall }) {
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  const node = (
    <div className="sheet-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${tall ? "tall" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="grab" />
        <div className="sheet-h">
          <h2>{title}</h2>
          <button type="button" className="x" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="sheet-b">{children}</div>
      </div>
    </div>
  );
  return createPortal(node, document.getElementById("overlay-root") || document.body);
}

export function Confirm({ open, title, text, confirmLabel = "Confirm", danger, onConfirm, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {text && <p className="sheet-text">{text}</p>}
      <div className="row-btns">
        <button type="button" className="btn ghost-dark" onClick={onClose}>Cancel</button>
        <button type="button" className={`btn ${danger ? "danger" : "solid"}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      </div>
    </Sheet>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          {t.tone === "win" ? <Trophy size={18} /> : t.tone === "note" ? <MessageCircle size={18} /> : <Check size={18} />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

const CONF = ["#ffffff", "#A9CBB0", "#C9A6E8", "#F4D35E", "#8046AD"];
export function Confetti({ k }) {
  const pieces = useMemo(() => Array.from({ length: 56 }, (_, i) => {
    const a = Math.random() * Math.PI * 2;
    const v = 120 + Math.random() * 230;
    return { i, dx: Math.cos(a) * v, dy: Math.sin(a) * v - 140, rot: Math.random() * 720 - 360, bg: CONF[i % CONF.length], d: Math.random() * 0.15, w: 6 + Math.random() * 6 };
  }), [k]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!k) return null;
  return (
    <div className="confetti" key={k} aria-hidden="true">
      {pieces.map((p) => (
        <span key={p.i} style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--rot": `${p.rot}deg`, background: p.bg, width: p.w, height: p.w * 0.55, animationDelay: `${p.d}s` }} />
      ))}
    </div>
  );
}

/* ------------------------------ comments ------------------------------ */
export function Composer({ onSend, placeholder = "Write a message…", maxLength = 500, className = "" }) {
  const [t, setT] = useState("");
  const send = () => { const v = t.trim(); if (!v) return; onSend(v); setT(""); };
  return (
    <form className={`composer ${className}`} onSubmit={(e) => { e.preventDefault(); send(); }}>
      <input value={t} onChange={(e) => setT(e.target.value)} placeholder={placeholder} maxLength={maxLength} aria-label={placeholder} />
      <button type="submit" aria-label="Send" disabled={!t.trim()}><Send size={18} /></button>
    </form>
  );
}

export function Comment({ c, onPerson }) {
  const { person, db } = useApp();
  if (db.blocked.includes(c.authorId)) return null;
  const p = person(c.authorId);
  return (
    <div className="cmt">
      <button type="button" className="av" onClick={() => onPerson?.(p.id)} aria-label={`View ${p.name}`}><Avatar person={p} size={36} /></button>
      <div>
        <div className="cmt-h"><b>{p.name}</b><span>{timeAgo(c.ts)}</span></div>
        <p>{c.text}</p>
      </div>
    </div>
  );
}

export function useBriefLoading(ms = 450) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), ms); return () => clearTimeout(t); }, [ms]);
  return loading;
}
export const Skeleton = ({ h = 90, n = 1 }) => (
  <>{Array.from({ length: n }, (_, i) => <div key={i} className="skel" style={{ height: h }} />)}</>
);
