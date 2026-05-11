// ════════════════════════════════════════════════════════════════════
// screens/HomeScreen.jsx
// ════════════════════════════════════════════════════════════════════

export function HomeScreen({ onPlay, onCollection }) {
  return (
    <div className="screen home-screen">
      <div className="home-logo">
        <h1>ZANY</h1>
        <p className="home-sub">interdimensional card battles</p>
      </div>
      <div className="home-actions">
        <button className="btn btn-primary btn-big" onClick={onPlay}>▶ Play</button>
        <button className="btn btn-secondary" onClick={onCollection}>🃏 My Cards</button>
      </div>
    </div>
  );
}

export default HomeScreen;
