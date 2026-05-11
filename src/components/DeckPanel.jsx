// ════════════════════════════════════════════════════════════════════
// components/DeckPanel.jsx — Slide-up drawer showing deck / discard /
// destroyed card lists during a game.
// ════════════════════════════════════════════════════════════════════

import { CardView } from "./CardView";

export function DeckPanel({ title, icon, cards, onClose }) {
  return (
    <div className="deck-panel-backdrop" onClick={onClose}>
      <div className="deck-panel" onClick={e => e.stopPropagation()}>
        <div className="deck-panel-header">
          <span className="deck-panel-title">{icon} {title}</span>
          <span className="deck-panel-count">{cards.length} card{cards.length !== 1 ? "s" : ""}</span>
          <button className="deck-panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="deck-panel-grid">
          {cards.length === 0
            ? <div className="deck-panel-empty">Nothing here yet</div>
            : cards.map((card, i) => (
                <div key={card.id || i} className="deck-panel-card-wrap">
                  <CardView card={card} mini revealed showName
                    style={{ width: "100%", height: "100%", borderRadius: "9px" }} />
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

export default DeckPanel;
