// ════════════════════════════════════════════════════════════════════
// components/effects/MoveEffect.jsx — Visual overlay for Snap-triggered
// card moves: flashing borders on source/dest zones + dashed arrow.
// ════════════════════════════════════════════════════════════════════

export function MoveEffect({ event, zoneRefs }) {
  const fromRect = zoneRefs[event.fromZone]?.current?.getBoundingClientRect();
  const toRect   = zoneRefs[event.toZone]?.current?.getBoundingClientRect();
  if (!fromRect || !toRect) return null;

  const yFrac = event.side === "player" ? 0.78 : 0.22;
  const fx = fromRect.left + fromRect.width  / 2;
  const fy = fromRect.top  + fromRect.height * yFrac;
  const tx = toRect.left   + toRect.width    / 2;
  const ty = toRect.top    + toRect.height   * yFrac;

  return (
    <div className="move-fx-layer" key={event._id}>
      <div className="move-flash move-flash-src" style={{
        left: fromRect.left, top: fromRect.top,
        width: fromRect.width, height: fromRect.height,
      }} />
      <div className="move-flash move-flash-dst" style={{
        left: toRect.left, top: toRect.top,
        width: toRect.width, height: toRect.height,
      }} />
      <svg className="move-arrow-svg" viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`} preserveAspectRatio="none">
        <defs>
          <marker id={`mfx-arrow-${event._id}`} markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#5fd4ff" />
          </marker>
        </defs>
        <line x1={fx} y1={fy} x2={tx} y2={ty}
              stroke="#5fd4ff" strokeWidth="3.5"
              strokeDasharray="8 5" strokeLinecap="round"
              markerEnd={`url(#mfx-arrow-${event._id})`} />
      </svg>
      <div className="move-label" style={{
        left: (fx + tx) / 2 - 40,
        top:  (fy + ty) / 2 - 16,
      }}>MOVED</div>
    </div>
  );
}

export default MoveEffect;
