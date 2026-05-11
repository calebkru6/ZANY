// ════════════════════════════════════════════════════════════════════
// components/effects/PowerDeltaLabel.jsx — Floating +N / -N label
// that rises and fades when a card's power changes mid-reveal.
// ════════════════════════════════════════════════════════════════════

export function PowerDeltaLabel({ delta }) {
  const positive = delta > 0;
  const color = positive ? "#7eff5e" : "#ff5e8a";
  const glow  = positive ? "rgba(126,255,94,0.85)" : "rgba(255,94,138,0.85)";
  const sign  = positive ? "+" : "";
  return (
    <div className="power-delta-label" style={{
      color,
      textShadow: `0 0 10px ${glow}, 0 2px 4px rgba(0,0,0,0.95)`,
    }}>
      {sign}{delta}
    </div>
  );
}

export default PowerDeltaLabel;
