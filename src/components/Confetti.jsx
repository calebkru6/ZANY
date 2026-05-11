// ════════════════════════════════════════════════════════════════════
// components/Confetti.jsx — Celebratory confetti burst shown on victory.
// ════════════════════════════════════════════════════════════════════

export function Confetti() {
  const COLORS = ["#ffe066", "#b4ff4f", "#5fd4ff", "#ff5fba", "#ff7043", "#a78bfa"];
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left:  Math.random() * 100,
    delay: Math.random() * 1.2,
    dur:   1.6 + Math.random() * 0.8,
    color: COLORS[i % COLORS.length],
    rotate: Math.random() * 360,
    size:  6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-wrap">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left:              `${p.left}%`,
          top:               0,
          width:             p.size,
          height:            p.size * 1.5,
          background:        p.color,
          animationDelay:    `${p.delay}s`,
          animationDuration: `${p.dur}s`,
          transform:         `rotate(${p.rotate}deg)`,
        }} />
      ))}
    </div>
  );
}

export default Confetti;
