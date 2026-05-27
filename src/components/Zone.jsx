// ════════════════════════════════════════════════════════════════════
// components/Zone.jsx — Game zone with AI/player card slots + score bar
// ════════════════════════════════════════════════════════════════════

import { zonePower, klawBonusForZone } from "../game/gameLogic";
import { CardView } from "./CardView";
import { RevealEffect } from "./effects/RevealEffect";
import { PowerDeltaLabel } from "./effects/PowerDeltaLabel";

export function Zone({ zone, zoneRef, zoneIdx, state, dragOver, dragBlocked, scoreChanged, revealedIds, revealFx, powerFx, onSelectCard, playedThisTurnIds, onDragPlayerCard, onUnplayCard, draggingCardId, winnerGlow, currentTurn, destroyFlash }) {
  const pp = zonePower(zone.pCards, state, true,  zoneIdx) + klawBonusForZone(state || { zones: [] }, true,  zoneIdx);
  const ap = zonePower(zone.aCards, state, false, zoneIdx) + klawBonusForZone(state || { zones: [] }, false, zoneIdx);
  const winning = pp > ap ? "player" : ap > pp ? "ai" : "tied";

  const zoneStyle = zone.bgImage
    ? { backgroundImage: `url(${zone.bgImage})` }
    : {
        "--zone-sky":     zone.sky     || "#0d1020",
        "--zone-horizon": zone.horizon || "#16244a",
        "--zone-ground":  zone.ground  || "#040408",
        "--zone-accent":  zone.accent  || "transparent",
      };

  return (
    <div
      ref={zoneRef}
      className={`zone${zone.bgImage ? " has-bg-image" : ""}${dragOver ? " drag-over" : ""}${dragBlocked ? " drag-blocked" : ""}${winnerGlow ? " zone-winner-glow" : ""}${destroyFlash ? " destroy-flash-zone" : ""}`}
      style={zoneStyle}
    >
      {/* AI cards */}
      <div className="zone-slot ai-slot">
        {zone.aCards.length
          ? zone.aCards.map(c => {
              const isRevealed = revealedIds?.has(c.id);
              const showFx     = revealFx && !revealFx.isPlayer && revealFx.cardId === c.id;
              const myDeltas   = (powerFx || []).filter(d => d.cardId === c.id && d.side === "ai");
              return (
                <div key={c.id} className="zone-slot-cell">
                  <CardView card={c} mini landing
                    revealed={isRevealed}
                    onClick={isRevealed && onSelectCard ? () => onSelectCard(c.id) : undefined} />
                  {showFx && <RevealEffect snapName={revealFx.snapName} />}
                  {myDeltas.map(d => <PowerDeltaLabel key={d._id} delta={d.delta} />)}
                </div>
              );
            })
          : <span className="zone-empty">·</span>}
      </div>

      {/* Score bar */}
      <div className={`zone-bar${winning === "player" ? " winning-player" : winning === "ai" ? " winning-ai" : ""}`}>
        <span className={`zone-score-hex${winning === "ai" ? " leading-ai" : ""}${scoreChanged ? " score-changed" : ""}`}>{ap}</span>
        <div className="zone-center-info">
          <span className="zone-name">{zone.name}</span>
          <div className="zone-ability">{zone.ability}</div>
          {zone._cloakTurn === currentTurn - 1 && (
            <div className="zone-cloak-badge">PORTAL OPEN</div>
          )}
        </div>
        <span className={`zone-score-hex${winning === "player" ? " leading-player" : ""}${scoreChanged ? " score-changed" : ""}`}>{pp}</span>
      </div>

      {/* Player cards */}
      <div className="zone-slot player-slot">
        {zone.pCards.length
          ? zone.pCards.map(c => {
              const draggable  = playedThisTurnIds?.has(c.id);
              const isDragged  = draggingCardId === c.id;
              const isRevealed = revealedIds?.has(c.id);
              const showFx     = revealFx && revealFx.isPlayer && revealFx.cardId === c.id;
              const myDeltas   = (powerFx || []).filter(d => d.cardId === c.id && d.side === "player");
              return (
                <div key={c.id} className="zone-slot-cell">
                  <CardView
                    card={c} mini landing
                    revealed={isRevealed}
                    className={draggable ? "card-uncommitted" : ""}
                    style={isDragged ? { opacity: 0.25, transition: "opacity 0.1s" } : undefined}
                    onPointerDown={draggable && onDragPlayerCard ? (e) => onDragPlayerCard(e, c.id) : undefined}
                    onClick={!draggable && onSelectCard ? () => onSelectCard(c.id) : undefined}
                  />
                  {showFx && <RevealEffect snapName={revealFx.snapName} />}
                  {myDeltas.map(d => <PowerDeltaLabel key={d._id} delta={d.delta} />)}
                </div>
              );
            })
          : <span className="zone-empty">·</span>}
      </div>
    </div>
  );
}

export default Zone;
