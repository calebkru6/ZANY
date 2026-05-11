// ════════════════════════════════════════════════════════════════════
// screens/CardEditorScreen.jsx — Create / edit a card
// ════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { uid } from "../game/gameLogic";
import { CardView } from "../components/CardView";

export function CardEditorScreen({ card, onSave, onBack }) {
  const [form, setForm] = useState({
    name:        card?.name        || "",
    energy:      card?.energy      || 3,
    clout:       card?.clout       || 3,
    snapName:    card?.snapName    || "",
    abilityText: card?.abilityText || "",
    flavor:      card?.flavor      || "",
    imageUrl:    card?.imageUrl    || null,
  });
  const [err, setErr] = useState("");

  const set      = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleImg = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => set("imageUrl", ev.target.result);
    r.readAsDataURL(f);
  };
  const handleSave = () => {
    if (!form.name.trim()) { setErr("A name is required."); return; }
    setErr("");
    onSave({ id: card?.id || uid(), ...form, name: form.name.trim(), clout: Number(form.clout) });
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <h2>{card ? "Edit Card" : "New Card"}</h2>
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
      </div>
      <div className="editor-layout">
        <div><CardView card={{ ...form, id: card?.id || "preview" }} /></div>
        <div className="editor-form">
          {err && <div className="form-err">{err}</div>}
          <label>Name
            <input value={form.name} onChange={e => set("name", e.target.value)} maxLength={30} />
          </label>
          <label>Clout (power 1–6)
            <div className="clout-row">
              {[1,2,3,4,5,6].map(n => (
                <button key={n} className={`clout-btn${form.clout===n?" active":""}`} onClick={() => set("clout",n)}>{n}</button>
              ))}
            </div>
          </label>
          <label>Ability
            <input type="text" placeholder="Snap reference (e.g. Black Panther)" value={form.snapName} onChange={e => set("snapName", e.target.value)} />
            <textarea placeholder="Ability text (e.g. On Reveal: Double this card's Power.)" value={form.abilityText} onChange={e => set("abilityText", e.target.value)} rows={2} />
          </label>
          <label>Flavor Text
            <input value={form.flavor} onChange={e => set("flavor", e.target.value)} maxLength={80} />
          </label>
          <label>Card Art (optional)
            <input type="file" accept="image/*" onChange={handleImg} />
          </label>
          {form.imageUrl && (
            <button className="btn btn-sm btn-danger" style={{alignSelf:"flex-start"}} onClick={() => set("imageUrl", null)}>
              Remove Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardEditorScreen;
