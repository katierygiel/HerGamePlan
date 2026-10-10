import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { useApp } from "../store";
import { FEEDBACK_KINDS } from "../data/seed";
import { Field, Pill, Sheet } from "../ui";

/** "Send feedback" sheet: goes straight to the admin inbox */
export function FeedbackSheet({ open, onClose, initialKind = "idea", initialText = "", title = "Send feedback" }) {
  const { act, toast } = useApp();
  const [kind, setKind] = useState(initialKind);
  const [text, setText] = useState(initialText);
  useEffect(() => { if (open) { setKind(initialKind); setText(initialText); } }, [open, initialKind, initialText]);

  const send = () => {
    if (!text.trim()) return;
    act("sendFeedback", { kind, text: text.trim() });
    toast("Thank you! We read every message.");
    setText("");
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={title} tall>
      <p className="sheet-text">Tell us what's working, what's confusing, or what you wish this app did. It goes straight to the team.</p>
      <div className="pills-wrap tight">
        {FEEDBACK_KINDS.map((k) => <Pill key={k.id} variant="chip-dark" active={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</Pill>)}
      </div>
      <Field textarea rows={5} value={text} onChange={setText} maxLength={1000} placeholder="Type here…" hint={`${text.length}/1000`} />
      <button type="button" className="btn solid wide" disabled={!text.trim()} onClick={send}><Send size={16} /> Send</button>
    </Sheet>
  );
}
