// ════════════════════════════════════════════════════════════════════
// components/ShuffleOverlay.jsx — Animated card-deal overlay shown at
// game start before the first turn begins.
// ════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

export function ShuffleOverlay({ deckSize, onDone }) {
  const [phase, setPhase] = useState("fan"); // fan → deal → done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("deal"), 700);
    const t2 = setTimeout(() => { onDone(); }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="shuffle-overlay">
      <div className="shuffle-title">DEALING CARDS</div>
      <div className={`shuffle-deck-area shuffle-card-fan${phase === "deal" ? " shuffle-anim" : ""}`}>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className={`shuffle-card shuffle-card-${n}`}>🂠</div>
        ))}
      </div>
      <div className="shuffle-sub">SHUFFLING YOUR DECK</div>
      <div className="shuffle-count">{deckSize} CARDS · 6 TURNS</div>
    </div>
  );
}

export default ShuffleOverlay;
