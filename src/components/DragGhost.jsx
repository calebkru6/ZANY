// ════════════════════════════════════════════════════════════════════
// components/DragGhost.jsx — Semi-transparent card that follows the
// pointer during drag operations.
// ════════════════════════════════════════════════════════════════════

import { hueOf, emojiOf } from "../game/gameLogic";

export function DragGhost({ card, x, y }) {
  const hue    = hueOf(card);
  const energy = card.energy ?? card.clout;
  const power  = card.clout;
  return (
    <div className="drag-ghost" style={{ left: x, top: y, "--ch": hue, background: `hsl(${hue},16%,8%)` }}>
      <div className="card-art" style={{ position: "absolute", inset: 0, borderRadius: 9 }}>
        {card.imageUrl
          ? <img src={card.imageUrl} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "2.5rem", opacity: 0.4 }}>{emojiOf(hue)}</span>}
      </div>
      <div className="card-vignette" />
      <div className="card-energy" style={{ position: "absolute", top: 5, left: 5, width: 22, height: 22, fontSize: "0.75rem", background: "#1d8ed4" }}>{energy}</div>
      <div className="card-power"  style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, fontSize: "0.75rem", background: "#e74624", bottom: "auto", left: "auto" }}>{power}</div>
    </div>
  );
}

export default DragGhost;
