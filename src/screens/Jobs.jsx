import { useState } from "react";
import { BellRing, Briefcase, Check, ClipboardList, Megaphone, Sparkles } from "lucide-react";
import { useApp } from "../store";
import { JOB_INTEREST_ROLES } from "../data/seed";
import { Pill, Screen } from "../ui";
import { FeedbackSheet } from "./Feedback";

const COMING = [
  { icon: Sparkles, title: "Real openings, made for you", text: "Roles with teams, leagues, agencies, and brands that want to hire women in sports, matched to your interests." },
  { icon: ClipboardList, title: "Apply with your HGP profile", text: "One profile, one tap. Your goals, portfolio, and story travel with you." },
  { icon: Briefcase, title: "Track every application", text: "Applied, interviewing, offer: all in one place, with notes." },
];

/** The Jobs tab is "coming soon": we collect interest (and which roles) so we launch it with real jobs. */
export default function Jobs() {
  const { db, act, toast } = useApp();
  const joined = db.jobsInterest;
  const [picked, setPicked] = useState(joined?.roles || []);
  const [editing, setEditing] = useState(false);
  const [hiring, setHiring] = useState(false);
  const toggle = (r) => setPicked((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]));

  const join = () => {
    act("saveJobsInterest", { roles: picked });
    setEditing(false);
    toast(joined ? "Updated. We'll let you know." : "You're on the list. We'll let you know!", "win");
  };
  const leave = () => { act("clearJobsInterest"); setPicked([]); setEditing(false); toast("Removed from the jobs list"); };

  const showForm = !joined || editing;

  return (
    <Screen title="Jobs">
      <section className="card pad soon">
        <span className="soon-ic"><Briefcase size={30} /></span>
        <p className="soon-tag">COMING SOON</p>
        <h2>The women's sports job board</h2>
        <p className="body-p">We're building a place to find and apply for jobs in women's sports. We won't launch it until it has real, vetted openings on it, so it's worth your time.</p>
      </section>

      <section className="card pad">
        <h3 className="sec-h">What's coming</h3>
        {COMING.map(({ icon: Icon, title, text }) => (
          <div key={title} className="soon-row">
            <span><Icon size={20} /></span>
            <div><b>{title}</b><p>{text}</p></div>
          </div>
        ))}
      </section>

      <section className="card pad">
        {joined && !editing ? (
          <>
            <div className="soon-on"><Check size={18} strokeWidth={3} /> You're on the list</div>
            <p className="body-p">We'll notify you when jobs open up{joined.roles.length ? " in:" : "."}</p>
            {joined.roles.length > 0 && <div className="pills-wrap tight">{joined.roles.map((r) => <Pill key={r} variant="solid">{r}</Pill>)}</div>}
            <div className="row-btns">
              <button type="button" className="btn ghost-dark" onClick={() => { setPicked(joined.roles); setEditing(true); }}>Edit roles</button>
              <button type="button" className="btn ghost-dark" onClick={leave}>Remove me</button>
            </div>
          </>
        ) : (
          <>
            <h3 className="sec-h"><BellRing size={17} /> Get notified</h3>
            <p className="body-p">Which kinds of roles do you want to see first? Pick any that apply.</p>
            <div className="pills-wrap tight">
              {JOB_INTEREST_ROLES.map((r) => (
                <Pill key={r} variant="chip-dark" active={picked.includes(r)} onClick={() => toggle(r)}>{picked.includes(r) && <Check size={13} strokeWidth={3.5} />} {r}</Pill>
              ))}
            </div>
            <button type="button" className="btn solid wide" onClick={join}>{joined ? "Save changes" : "Notify me"}</button>
          </>
        )}
      </section>

      <section className="card pad soon-hire">
        <Megaphone size={22} />
        <div>
          <b>Hiring, or know someone who is?</b>
          <p>Tell us about a team, league, or company that should be on the board at launch.</p>
          <button type="button" className="inline-link" onClick={() => setHiring(true)}>Tell us</button>
        </div>
      </section>
      <FeedbackSheet open={hiring} onClose={() => setHiring(false)} initialKind="other" initialText="Hiring lead: " title="Tell us about an employer" />
    </Screen>
  );
}
