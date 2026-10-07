export function Switch({ checked, onChange, label, id }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} className={`switch ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}>
      <i />
    </button>
  );
}

/** label + description on the left, a control on the right */
export function ToggleRow({ title, text, checked, onChange }) {
  return (
    <div className="trow">
      <div>
        <b>{title}</b>
        {text && <p>{text}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
