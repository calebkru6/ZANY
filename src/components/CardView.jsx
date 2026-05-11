// ════════════════════════════════════════════════════════════════════
// components/CardView.jsx — Card display component + CardBack
// ════════════════════════════════════════════════════════════════════

import { hueOf, emojiOf } from "../game/gameLogic";

export function CardBack({ mini = false }) {
  return (
    <div className={`card-back-graphic${mini ? " card-back-mini" : ""}`}>
      <div className="card-back-frame">
        <div className="card-back-logo">Z</div>
        <div className="card-back-glyph">⬢</div>
      </div>
    </div>
  );
}

export function CardView({ card, mini = false, selected = false, playing = false, landing = false, showName = false, revealed = true, onClick, onPointerDown, className: extraClass = "", style: extraStyle }) {
  const hue    = hueOf(card);
  const energy = card.energy ?? card.clout;
  const power  = card.clout;
  const isOngoing = revealed && card.abilityText && card.abilityText.startsWith("Ongoing:");
  return (
    <div
      className={["card-view", mini?"card-mini":"", selected?"card-selected":"", playing?"card-playing":"", landing?"card-land":"", isOngoing?"ongoing-shimmer":"", extraClass].filter(Boolean).join(" ")}
      style={{ "--ch": hue, cursor: onPointerDown ? "grab" : onClick ? "pointer" : "default", ...extraStyle }}
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      <div className={`card-flip${revealed ? " is-revealed" : ""}`}>
        <div className="card-face card-front">
          <div className="card-clip">
            <div className="card-art">
              {card.imageUrl
                ? <img src={card.imageUrl} alt={card.name} />
                : <span className="card-emoji">{emojiOf(hue)}</span>}
            </div>
            <div className="card-vignette" />
            {showName && card.name && (
              <div className="card-nameplate">
                <div className="card-name-text">{card.name}</div>
              </div>
            )}
          </div>
          <div className="card-energy">{energy}</div>
          <div className="card-power">{power}</div>
        </div>
        <div className="card-face card-back">
          <CardBack mini={mini} />
        </div>
      </div>
    </div>
  );
}

export default CardView;
