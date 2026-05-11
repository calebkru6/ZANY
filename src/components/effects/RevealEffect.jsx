// ════════════════════════════════════════════════════════════════════
// components/effects/RevealEffect.jsx — Burst ring + floating label
// shown when a card's On Reveal ability fires.
// ════════════════════════════════════════════════════════════════════

import SNAP_HANDLERS from "../../game/snapHandlers";

export function RevealEffect({ snapName }) {
  const handler = snapName && SNAP_HANDLERS[snapName];
  let color = "#ffe066", glow = "rgba(255,224,102,0.7)", label = (snapName || "REVEAL").toUpperCase();
  if (snapName && handler) {
    const lc = snapName.toLowerCase();
    if (["aero","magneto","cannonball","nocturne","jeff","makkari"].some(n => lc.includes(n))) {
      color = "#5fd4ff"; glow = "rgba(95,212,255,0.7)";
    } else if (["cassandra","darkhawk","alioth","echo"].some(n => lc.includes(n))) {
      color = "#ff5e8a"; glow = "rgba(255,94,138,0.7)";
    } else if (["panther","silver","ant","gilgamesh","elsa","adam","nebula"].some(n => lc.includes(n))) {
      color = "#7eff5e"; glow = "rgba(126,255,94,0.7)";
    }
  }
  return (
    <>
      <div className="reveal-burst" style={{ borderColor: color, boxShadow: `0 0 24px ${glow}, inset 0 0 16px ${glow}` }} />
      <div className="reveal-burst-inner" style={{ background: `radial-gradient(circle, ${color}55 0%, transparent 70%)` }} />
      <div className="reveal-label" style={{ color, textShadow: `0 0 10px ${glow}, 0 2px 4px rgba(0,0,0,0.9)` }}>
        {label}
      </div>
    </>
  );
}

export default RevealEffect;
