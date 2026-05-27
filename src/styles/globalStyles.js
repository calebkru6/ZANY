// ════════════════════════════════════════════════════════════════════
// styles/globalStyles.js — All ZANY global CSS injected at app start.
// Imported and injected via useEffect in App.jsx.
// ════════════════════════════════════════════════════════════════════

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Space+Mono:wght@700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #080810; --bg2: #10101e; --bg3: #181828;
    --border: rgba(255,255,255,0.07);
    --neon: #b4ff4f; --hot: #ff5fba; --ice: #5fd4ff;
    --text: #dde0f5; --muted: #5a5a80;
    --r: 14px;
    --f-display: 'Bangers', 'Impact', sans-serif;
    --f-head: 'Inter', system-ui, sans-serif;
    --f-mono: 'Orbitron', 'SF Mono', monospace;
  }
  html, body { height: 100%; }
  body { background: #02020a; color: var(--text); font-family: var(--f-head); overflow-x: hidden; display:flex; justify-content:center; }
  #root { height: 100%; display:flex; justify-content:center; width:100%; }
  .screen {
    height: 100vh;
    height: 100dvh;
    display: flex; flex-direction: column;
    overflow: hidden;
    max-width: 430px;
    width: 100%;
    position: relative;
  }
  .screen-header { display:flex; align-items:center; gap:12px; padding:12px 18px; border-bottom:1px solid var(--border); background:var(--bg2); }
  .screen-header h2 { flex:1; font-size:1.2rem; font-weight:600; }
  .btn { font-family:var(--f-head); font-weight:600; font-size:1rem; border:none; border-radius:10px; padding:8px 16px; cursor:pointer; user-select:none; transition:transform 0.1s, filter 0.15s; }
  .btn:active { transform:scale(0.93); }
  .btn-primary   { background:var(--neon); color:#060608; }
  .btn-primary:hover { filter:brightness(1.1); }
  .btn-secondary { background:var(--bg3); color:var(--text); border:1px solid var(--border); }
  .btn-secondary:hover { border-color:rgba(255,255,255,0.18); }
  .btn-ghost     { background:transparent; color:var(--muted); }
  .btn-ghost:hover { color:var(--text); }
  .btn-danger    { background:rgba(255,55,75,0.16); color:#ff6868; }
  .btn-danger:hover { background:rgba(255,55,75,0.26); }
  .btn-sm  { padding:5px 10px; font-size:0.82rem; border-radius:7px; }
  .btn-big { padding:14px 44px; font-size:1.3rem; border-radius:14px; }

  .home-screen { align-items:center; justify-content:center; gap:52px; background:radial-gradient(ellipse at 50% 55%, #16082e 0%, var(--bg) 68%); }
  .home-logo { text-align:center; }
  .home-logo h1 { font-size:clamp(5.5rem,22vw,11rem); font-weight:700; line-height:0.9; color:var(--neon); letter-spacing:-0.03em; text-shadow:0 0 50px rgba(180,255,79,0.45),0 0 120px rgba(180,255,79,0.18); animation:logo-float 3.2s ease-in-out infinite; }
  @keyframes logo-float { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-10px) rotate(1deg);text-shadow:0 0 70px rgba(180,255,79,0.65),0 0 160px rgba(180,255,79,0.25)} }
  .home-sub { font-size:0.95rem; color:var(--muted); margin-top:10px; letter-spacing:0.07em; text-transform:lowercase; }
  .home-actions { display:flex; flex-direction:column; align-items:center; gap:14px; }

  .collection-toolbar { display:flex; flex-direction:column; gap:8px; padding:10px 14px; background:var(--bg2); border-bottom:1px solid var(--border); }
  .collection-toolbar-row { display:flex; gap:6px; align-items:center; }
  .search-input { background:var(--bg3); border:1.5px solid var(--border); color:var(--text); border-radius:9px; padding:7px 12px; font-family:var(--f-head); font-size:0.9rem; outline:none; flex:1; transition:border-color 0.18s; }
  .search-input:focus { border-color:var(--neon); }
  .filter-tabs { display:flex; gap:5px; flex-wrap:nowrap; overflow-x:auto; }
  .filter-tab { background:var(--bg3); border:1.5px solid var(--border); color:var(--muted); border-radius:8px; padding:4px 10px; font-size:0.75rem; cursor:pointer; font-family:var(--f-head); white-space:nowrap; transition:all 0.14s; flex-shrink:0; }
  .filter-tab.active { border-color:var(--neon); color:var(--neon); background:rgba(180,255,79,0.08); }
  .card-grid {
    display:grid; grid-template-columns:repeat(4,1fr); gap:6px;
    padding:10px; flex: 1; min-height: 0;
    overflow-y: auto; overflow-x: hidden;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    width: 100%; box-sizing: border-box;
  }
  .screen { overflow-x: hidden; }
  .card-grid-item { position:relative; aspect-ratio:63.5/88.9; cursor:pointer; }
  .coll-card { width:100%; height:100%; border-radius:10px; overflow:hidden; position:relative;
    border:1.5px solid rgba(255,255,255,0.1);
    box-shadow:0 3px 10px rgba(0,0,0,0.6);
    transition:transform 0.18s, box-shadow 0.18s; background:#0a0a14; }
  .coll-card:hover { transform:scale(1.05); box-shadow:0 6px 20px rgba(0,0,0,0.8); z-index:5; }
  .coll-card:active { transform:scale(0.96); }
  .coll-card-art { width:100%; height:100%; object-fit:cover; display:block; }
  .coll-card-emoji { width:100%; height:100%; display:flex; align-items:center; justify-content:center;
    font-size:2.2rem; opacity:0.45; background:linear-gradient(155deg, hsl(var(--ch),22%,15%), hsl(var(--ch),16%,10%)); }
  .coll-card-overlay { position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,0) 38%, rgba(0,0,0,0.78) 100%); pointer-events:none; }
  .coll-card-name { position:absolute; bottom:4px; left:0; right:0; text-align:center;
    font-family:var(--f-display); font-weight:400; font-size:0.6rem; letter-spacing:0.03em; color:#fff;
    text-shadow:0 1px 4px rgba(0,0,0,0.9); padding:0 4px; line-height:1.05;
    white-space:normal; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
    overflow:hidden; word-break:break-word; pointer-events:none; }
  .coll-card-energy, .coll-card-badge {
    position:absolute; top:4px; width:18px; height:18px; border-radius:50%;
    color:#fff; font-family:var(--f-mono); font-weight:700; font-size:0.72rem;
    display:flex; align-items:center; justify-content:center;
    z-index:2; pointer-events:none;
  }
  .coll-card-energy { left:4px;  background:#1d8ed4; }
  .coll-card-badge  { right:4px; background:#e74624; bottom:auto; }
  .coll-card.coll-selected { border-color:var(--neon); box-shadow:0 0 0 2px var(--neon), 0 0 18px rgba(180,255,79,0.4); }
  .coll-preview-backdrop {
    position:fixed; inset:0; z-index:300;
    background:rgba(0,0,0,0.85);
    backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:20px; animation: backdrop-fade 0.18s ease-out;
  }
  @keyframes backdrop-fade { from{opacity:0} to{opacity:1} }
  .coll-preview-stage { display:flex; flex-direction:column; align-items:center; gap:18px; animation: preview-rise 0.24s cubic-bezier(.22,1,.36,1); }
  @keyframes preview-rise { from { transform:translateY(20px) scale(0.9); opacity:0; } to { transform:translateY(0) scale(1); opacity:1; } }
  .coll-preview-card.card-view { width: min(320px, 70vw); height: auto; aspect-ratio: 1 / 1.4; }
  .coll-preview-card .card-energy, .coll-preview-card .card-power { width: 38px; height: 38px; font-size: 1.4rem; top: 8px; }
  .coll-preview-card .card-energy { left: 8px; }
  .coll-preview-card .card-power  { right: 8px; }
  .coll-preview-card .card-name-text { font-size: 1.3rem !important; line-height: 1.05 !important; }
  .coll-preview-actions { display:flex; gap:10px; }
  .coll-preview-info { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px 18px; width: min(320px, 80vw); display: flex; flex-direction: column; gap: 8px; }
  .coll-preview-name { font-family: var(--f-display); font-size: 1.15rem; color: #fff; font-weight: 400; letter-spacing: 0.03em; }
  .coll-preview-ability { font-size: 0.8rem; line-height: 1.5; color: var(--neon); font-style: normal; font-weight: 500; }
  .coll-preview-flavor { font-size: 0.72rem; color: rgba(255,255,255,0.45); font-style: italic; line-height: 1.4; }
  .coll-preview-stats { display: flex; gap: 12px; margin-top: 2px; font-family: var(--f-mono); font-size: 0.7rem; font-weight: 700; }
  .coll-stat-energy { color: #1d8ed4; }
  .coll-stat-power  { color: #e74624; }
  .coll-tray { position:fixed; bottom:0; left:0; right:0; z-index:200; background:var(--bg2); border-top:1px solid var(--border); padding:14px 20px 24px; display:flex; gap:10px; justify-content:center; align-items:center; animation:tray-up 0.22s cubic-bezier(.22,1,.36,1); }
  @keyframes tray-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .coll-tray-name { flex:1; font-size:1rem; font-weight:700; text-align:left; }
  .empty-state { color:var(--muted); font-size:0.9rem; padding:48px; text-align:center; grid-column:1/-1; }
  .collection-count { font-size:0.72rem; color:var(--muted); font-family:var(--f-mono); padding:5px 14px; background:var(--bg2); border-bottom:1px solid var(--border); }

  .editor-layout { display:flex; gap:32px; padding:24px; flex-wrap:wrap; justify-content:center; }
  .editor-form { display:flex; flex-direction:column; gap:18px; min-width:270px; max-width:380px; flex:1; }
  .editor-form label { display:flex; flex-direction:column; gap:7px; font-size:0.75rem; color:var(--muted); font-family:var(--f-mono); text-transform:uppercase; letter-spacing:0.07em; }
  .editor-form input, .editor-form select { background:var(--bg3); border:1.5px solid var(--border); color:var(--text); border-radius:9px; padding:9px 12px; font-family:var(--f-head); font-size:1rem; outline:none; transition:border-color 0.18s; }
  .editor-form input:focus, .editor-form select:focus { border-color:var(--neon); }
  .editor-form input[type="file"] { padding:6px 8px; }
  .clout-row { display:flex; gap:8px; flex-wrap:wrap; }
  .clout-btn { width:42px; height:42px; border-radius:9px; border:2px solid var(--border); background:var(--bg3); color:var(--muted); font-family:var(--f-mono); font-size:1.05rem; cursor:pointer; transition:all 0.14s; }
  .clout-btn:hover { border-color:rgba(180,255,79,0.5); color:var(--neon); }
  .clout-btn.active { border-color:var(--neon); color:var(--neon); background:rgba(180,255,79,0.1); }
  .form-err { color:#ff7878; font-size:0.82rem; }

  .card-view {
    width:130px; aspect-ratio: 1 / 1.4; height:auto;
    position:relative; flex-shrink:0; border-radius:12px;
    overflow:visible; background:transparent;
    box-shadow:0 6px 20px rgba(0,0,0,0.65);
    transition:transform 0.2s cubic-bezier(.22,1,.36,1), box-shadow 0.2s;
    cursor:default;
  }
  .card-flip { position:absolute; inset:0; transform-style:preserve-3d; transition: transform 0.55s cubic-bezier(.34,1.34,.5,1); transform: rotateY(180deg); border-radius:inherit; }
  .card-flip.is-revealed { transform: rotateY(0deg); }
  .card-face { position:absolute; inset:0; border-radius:inherit; backface-visibility:hidden; -webkit-backface-visibility:hidden; }
  .card-front { transform: rotateY(0deg); }
  .card-back  { transform: rotateY(180deg); }
  .card-back-graphic { position:absolute; inset:0; border-radius:inherit; background: radial-gradient(ellipse at 50% 30%, #2d1670 0%, #120426 70%), linear-gradient(180deg, #1a0540 0%, #0a0218 100%); overflow:hidden; box-shadow: inset 0 0 0 1px hsl(280, 70%, 65%), inset 0 0 0 2px hsl(280, 50%, 30%), inset 0 0 0 3px rgba(0, 0, 0, 0.6); }
  .card-back-frame { position:absolute; inset:8%; border:1.5px solid rgba(180, 130, 255, 0.4); border-radius:6px; display:flex; align-items:center; justify-content:center; background: repeating-linear-gradient(45deg, rgba(180,130,255,0.04) 0 2px, transparent 2px 8px); }
  .card-back-logo { font-family:var(--f-display); font-size:3rem; color:rgba(220, 180, 255, 0.85); text-shadow: 0 0 8px rgba(180, 130, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8); line-height:1; z-index:2; }
  .card-back-glyph { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:5rem; color:rgba(180, 130, 255, 0.06); z-index:1; }
  .card-back-graphic.card-back-mini .card-back-logo, .card-back-mini .card-back-logo { font-size:1.6rem; }
  .card-back-graphic.card-back-mini .card-back-glyph, .card-back-mini .card-back-glyph { font-size:2.5rem; }
  .card-clip { position:absolute; inset:0; border-radius:inherit; overflow:hidden; background:#080810; box-shadow: inset 0 0 0 1px hsl(var(--ch), 80%, 72%), inset 0 0 0 2px hsl(var(--ch), 55%, 42%), inset 0 0 0 3px hsl(var(--ch), 35%, 22%), inset 0 0 0 4px rgba(0, 0, 0, 0.55); }
  .card-art { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:hsl(var(--ch),16%,8%); }
  .card-art img { width:100%; height:100%; object-fit:cover; display:block; }
  .card-emoji   { font-size:4rem; opacity:0.38; user-select:none; }
  .card-vignette { position:absolute; inset:0; pointer-events:none; background: radial-gradient(ellipse 60% 30% at 12% 10%, rgba(0,0,0,0.55) 0%, transparent 100%), radial-gradient(ellipse 60% 30% at 88% 90%, rgba(0,0,0,0.55) 0%, transparent 100%); }
  .card-energy, .card-power { position:absolute; top:3px; z-index:5; width:18px; height:18px; border-radius:50%; color:#fff; font-family:var(--f-mono); font-weight:700; font-size:0.78rem; display:flex; align-items:center; justify-content:center; line-height:1; }
  .card-energy { left:3px;  background:#1d8ed4; }
  .card-power  { right:3px; background:#e74624; }
  .card-nameplate { position:absolute; bottom:0; left:0; right:0; z-index:2; height:30%; background:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.55) 100%); display:flex; align-items:flex-end; justify-content:center; padding:0 6px 6px; pointer-events:none; }
  .card-name-text { font-family:var(--f-display); font-weight:400; font-size:0.66rem; line-height:1.05; color:#fff; text-align:center; text-shadow: 0 1px 0 rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.8); letter-spacing:0.02em; max-width:100%; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; word-break:break-word; padding-bottom:1px; }
  .card-view:not(.card-mini):hover { transform:translateY(-8px) scale(1.05); box-shadow:0 18px 36px rgba(0,0,0,0.75); z-index:20; }
  .card-view.card-selected { outline:2.5px solid var(--neon); box-shadow:0 0 28px rgba(180,255,79,0.5), 0 14px 32px rgba(0,0,0,0.8) !important; z-index:20; }
  .card-view.card-playing  { animation:card-launch 0.46s cubic-bezier(.36,.07,.19,.97); }
  @keyframes card-launch { 0%{transform:translateY(0) scale(1);} 28%{transform:translateY(-44px) rotate(-10deg) scale(1.12);} 60%{transform:translateY(12px) rotate(4deg) scale(0.94);} 80%{transform:translateY(-5px) rotate(-1deg) scale(1.02);} 100%{transform:translateY(0) scale(1);} }
  .card-land { animation:land 0.36s cubic-bezier(.22,1,.36,1); }
  @keyframes land { from { transform:translateY(-36px) scale(1.1); opacity:0; } to { transform:translateY(0) scale(1); opacity:1; } }
  .zone-card-wrap { position:relative; width:100%; max-width:64px; line-height:0; justify-self:center; }
  .card-unplay-btn { position:absolute; top:-7px; right:-7px; z-index:6; width:22px; height:22px; border-radius:50%; background:linear-gradient(135deg,#ff5050,#c40020); color:#fff; border:1.5px solid #fff; font-family:var(--f-head); font-weight:700; font-size:0.72rem; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; line-height:1; box-shadow:0 2px 8px rgba(0,0,0,0.7); pointer-events:auto; touch-action:manipulation; transition:transform 0.12s, filter 0.12s; animation:unplay-pulse 1.2s ease-in-out infinite; }
  .card-unplay-btn:hover  { filter:brightness(1.15); }
  .card-unplay-btn:active { transform:scale(0.85); }
  @keyframes unplay-pulse { 0%,100% { box-shadow:0 2px 8px rgba(0,0,0,0.7), 0 0 0 0 rgba(255,80,80,0.7); } 50% { box-shadow:0 2px 8px rgba(0,0,0,0.7), 0 0 0 6px rgba(255,80,80,0); } }
  .zone-slot-cell { position:relative; width:100%; max-width:64px; justify-self:center; line-height:0; }
  @keyframes power-delta-rise { 0%{opacity:0;transform:translate(-50%,0%) scale(0.6);} 20%{opacity:1;transform:translate(-50%,-40%) scale(1.25);} 65%{opacity:1;transform:translate(-50%,-85%) scale(1.05);} 100%{opacity:0;transform:translate(-50%,-130%) scale(1);} }
  .power-delta-label { position:absolute; left:50%; top:50%; z-index:35; font-family:var(--f-display); font-size:1.6rem; font-weight:400; letter-spacing:0.02em; pointer-events:none; line-height:1; animation: power-delta-rise 1.0s cubic-bezier(.22,.61,.36,1) forwards; }
  .move-fx-layer { position:fixed; inset:0; z-index:80; pointer-events:none; }
  .move-flash { position:fixed; border-radius:14px; pointer-events:none; animation: move-flash-pulse 1.0s ease-out forwards; }
  .move-flash-src { border:3px solid #ff5e8a; box-shadow: 0 0 28px rgba(255,94,138,0.55), inset 0 0 28px rgba(255,94,138,0.4); }
  .move-flash-dst { border:3px solid #5fd4ff; box-shadow: 0 0 28px rgba(95,212,255,0.6), inset 0 0 28px rgba(95,212,255,0.45); }
  @keyframes move-flash-pulse { 0%{opacity:0;transform:scale(0.95);} 20%{opacity:1;transform:scale(1);} 80%{opacity:1;} 100%{opacity:0;transform:scale(1.02);} }
  .move-arrow-svg { position:fixed; inset:0; width:100%; height:100%; pointer-events:none; animation: move-arrow-fade 1.0s ease-out forwards; }
  @keyframes move-arrow-fade { 0%{opacity:0;} 25%{opacity:1;} 80%{opacity:1;} 100%{opacity:0;} }
  .move-label { position:fixed; z-index:90; width:80px; text-align:center; font-family:var(--f-display); font-size:0.95rem; color:#5fd4ff; text-shadow: 0 0 10px rgba(95,212,255,0.85), 0 2px 4px rgba(0,0,0,0.95); letter-spacing:0.08em; pointer-events:none; animation: move-label-rise 1.0s ease-out forwards; }
  @keyframes move-label-rise { 0%{opacity:0;transform:translateY(0) scale(0.8);} 25%{opacity:1;transform:translateY(-8px) scale(1.1);} 75%{opacity:1;transform:translateY(-18px) scale(1);} 100%{opacity:0;transform:translateY(-28px) scale(0.95);} }
  @keyframes reveal-burst-ring { 0%{transform:scale(0.85);opacity:0;} 20%{opacity:1;} 100%{transform:scale(1.9);opacity:0;} }
  .reveal-burst { position:absolute; inset:-3px; z-index:25; border-radius:9px; border:2.5px solid #fff; pointer-events:none; animation: reveal-burst-ring 0.78s cubic-bezier(.22,.61,.36,1) forwards; }
  @keyframes reveal-burst-flash { 0%{opacity:0;transform:scale(0.5);} 25%{opacity:0.95;transform:scale(1);} 100%{opacity:0;transform:scale(1.4);} }
  .reveal-burst-inner { position:absolute; inset:0; z-index:24; border-radius:8px; pointer-events:none; animation: reveal-burst-flash 0.78s ease-out forwards; }
  @keyframes reveal-label-float { 0%{transform:translate(-50%,0%) scale(0.6);opacity:0;} 20%{transform:translate(-50%,-45%) scale(1.15);opacity:1;} 65%{transform:translate(-50%,-90%) scale(1.0);opacity:1;} 100%{transform:translate(-50%,-130%) scale(0.95);opacity:0;} }
  .reveal-label { position:absolute; left:50%; bottom:100%; z-index:30; font-family:var(--f-display); font-size:0.95rem; letter-spacing:0.05em; white-space:nowrap; pointer-events:none; line-height:1; animation: reveal-label-float 1.0s cubic-bezier(.22,.61,.36,1) forwards; }
  @keyframes card-land-pop { 0%{transform:scale(0.7) rotate(-8deg);opacity:0;} 45%{transform:scale(1.12) rotate(2deg);opacity:1;} 70%{transform:scale(0.96) rotate(-1deg);} 100%{transform:scale(1) rotate(0deg);} }
  .card-view.card-land { animation: card-land-pop 0.42s cubic-bezier(.34,1.56,.64,1) both; }
  .card-view.card-uncommitted { cursor:grab; touch-action:none; -webkit-touch-callout:none; -webkit-user-select:none; box-shadow:0 0 0 1.5px rgba(180,255,79,0.6), 0 4px 14px rgba(180,255,79,0.2); animation:uncommitted-pulse 1.8s ease-in-out infinite; }
  .card-view.card-uncommitted:active { cursor:grabbing; }
  @keyframes uncommitted-pulse { 0%,100%{box-shadow:0 0 0 1.5px rgba(180,255,79,0.5),0 4px 12px rgba(180,255,79,0.15);} 50%{box-shadow:0 0 0 2px rgba(180,255,79,0.9),0 4px 18px rgba(180,255,79,0.35);} }
  .card-mini { width:100%; height:100%; border-radius:6px; }
  .card-mini .card-energy { width:13px; height:13px; font-size:0.52rem; top:2px; left:2px; }
  .card-mini .card-power  { width:13px; height:13px; font-size:0.52rem; top:2px; right:2px; bottom:auto; left:auto; }
  .card-mini .card-emoji  { font-size:1.8rem; }
  .card-mini:hover { transform:translateY(-3px) scale(1.06)!important; box-shadow:0 8px 18px rgba(0,0,0,0.7)!important; }

  .game-screen { background: radial-gradient(ellipse at 50% 25%, #0d1e38 0%, #05050f 70%); display: flex; flex-direction: column; overflow: hidden; touch-action: none; user-select: none; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
  .debug-status { position:absolute; top:2px; left:50%; transform:translateX(-50%); z-index:1000; background:rgba(255,255,255,0.92); color:#000; font-family:var(--f-mono); font-size:0.66rem; font-weight:700; padding:3px 12px; border-radius:10px; pointer-events:none; max-width:90vw; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition:background 0.12s; }
  .debug-status.debug-hit { background:rgba(180,255,79,0.95); box-shadow:0 0 16px rgba(180,255,79,0.6); }
  .game-top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 8px 10px 6px; flex-shrink: 0; height: 70px; background: linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.0) 100%); position: relative; z-index: 10; }
  .player-pill { display: flex; align-items: center; gap: 6px; padding: 4px 8px 4px 4px; border-radius: 22px; border: 2px solid transparent; transition: border-color 0.3s, box-shadow 0.3s, background 0.3s; min-width: 0; overflow: hidden; justify-self: start; }
  .player-pill:last-child { justify-self: end; }
  .player-pill.has-priority { border-color: #ffd84d; background: rgba(255, 216, 77, 0.08); box-shadow: 0 0 14px rgba(255, 216, 77, 0.45), 0 0 28px rgba(255, 200, 30, 0.2); animation: priority-pulse 2.2s ease-in-out infinite; }
  @keyframes priority-pulse { 0%,100%{box-shadow:0 0 12px rgba(255,216,77,0.4),0 0 22px rgba(255,200,30,0.18);} 50%{box-shadow:0 0 20px rgba(255,216,77,0.7),0 0 38px rgba(255,200,30,0.35);} }
  .player-pill.has-priority .player-name { color: #ffe9a0; text-shadow: 0 0 8px rgba(255, 200, 50, 0.6); }
  .player-name-block { display:flex; flex-direction:column; gap:2px; min-width:0; overflow:hidden; }
  .hand-count { font-family:var(--f-mono); font-size:0.58rem; color:rgba(255,255,255,0.5); letter-spacing:0.04em; white-space:nowrap; }
  .player-avatar { width:36px; height:36px; border-radius:50%; background:var(--bg3); border:2px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:1.15rem; flex-shrink:0; }
  .player-name { font-size:0.75rem; font-weight:700; color:var(--text); letter-spacing:0.05em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .energy-crystal { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .crystal-gem { width: 30px; height: 30px; background: linear-gradient(135deg,#7040f0,#a070ff); border-radius: 5px; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(130,80,255,0.6), 0 2px 6px rgba(0,0,0,0.5); }
  .crystal-gem span { transform: rotate(-45deg); font-family: var(--f-mono); font-weight: 700; font-size: 0.85rem; color: #fff; }
  .turn-label { text-align: center; flex-shrink: 0; font-size: 0.48rem; color: var(--muted); font-family: var(--f-mono); letter-spacing: 0.1em; padding: 3px 0 2px; }
  .zones-row { display:flex; gap:5px; padding:4px 8px; flex:1; min-height:0; align-items:stretch; }
  .zone { flex:1; display:flex; flex-direction:column; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.03); transition:border-color 0.18s, box-shadow 0.18s; position:relative; }
  .zone.has-bg-image { background-size:cover; background-position:center; }
  .zone.has-bg-image::before { content:""; position:absolute; inset:0; background:rgba(0,0,0,0.55); pointer-events:none; }
  .zone.drag-over { border-color:var(--neon); box-shadow:0 0 0 2px var(--neon), 0 0 30px rgba(180,255,79,0.45); }
  .zone.drag-blocked { border-color:#ff4040; box-shadow:0 0 0 2px #ff4040, 0 0 30px rgba(255,64,64,0.4); }
  .zone-slot { flex:1; min-height:0; display:grid; grid-template-columns: 1fr 1fr; grid-auto-rows: calc(50% - 1px); gap:2px; padding:3px; overflow:hidden; align-content:end; }
  .zone-slot.ai-slot { border-bottom:1px solid rgba(255,255,255,0.05); align-content:end; }
  .zone-slot.player-slot { align-content:start; }
  .zone-slot .zone-empty { grid-column:1/-1; text-align:center; align-self:center; }
  .zone-empty { color:rgba(255,255,255,0.12); font-size:0.9rem; }
  .zone-slot-cell { position:relative; overflow:hidden; border-radius:6px; min-height:0; min-width:0; }
  .zone-bar { flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; padding:4px 4px; border-top:1px solid rgba(255,255,255,0.07); border-bottom:1px solid rgba(255,255,255,0.07); background:rgba(0,0,0,0.5); transition:background 0.3s; }
  .zone-bar.winning-player { background:rgba(180,255,79,0.1); }
  .zone-bar.winning-ai     { background:rgba(255,95,186,0.1); }
  .zone-score-hex { width:24px; height:24px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-family:var(--f-mono); font-weight:700; font-size:0.78rem; background:rgba(255,255,255,0.08); transition: background 0.3s, transform 0.3s, color 0.3s; }
  .zone-score-hex.leading-player { background:rgba(180,255,79,0.3); color:var(--neon); transform:scale(1.08); box-shadow:0 0 12px rgba(180,255,79,0.4); }
  .zone-score-hex.leading-ai     { background:rgba(255,95,186,0.3); color:var(--hot); transform:scale(1.08); box-shadow:0 0 12px rgba(255,95,186,0.4); }
  @keyframes score-pulse { 0%{transform:scale(1);} 40%{transform:scale(1.4);filter:brightness(1.5);} 100%{transform:scale(1.08);filter:brightness(1);} }
  .zone-score-hex.score-changed { animation: score-pulse 0.5s cubic-bezier(.34,1.56,.64,1) both; }
  .zone-center-info { display:flex; flex-direction:column; align-items:center; gap:1px; flex:1; min-width:0; }
  .zone-name    { font-family:var(--f-display); font-size:0.68rem; font-weight:400; letter-spacing:0.04em; color:#fff; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; }
  .zone-ability { font-size:0.42rem; color:rgba(255,255,255,0.45); text-align:center; line-height:1.25; width:100%; }
  .zone-cloak-badge { font-family:var(--f-mono); font-size:0.38rem; font-weight:700; letter-spacing:0.08em; color:var(--ice); background:rgba(95,212,255,0.15); border:1px solid rgba(95,212,255,0.4); border-radius:4px; padding:1px 4px; text-align:center; animation:cloak-pulse 1.2s ease-in-out infinite; }
  @keyframes cloak-pulse { 0%,100%{opacity:0.7;box-shadow:0 0 4px rgba(95,212,255,0.2);} 50%{opacity:1;box-shadow:0 0 10px rgba(95,212,255,0.5);} }
  .game-bottom { display:flex; align-items:center; justify-content:space-between; padding:6px 14px; flex-shrink:0; height:56px; background:rgba(0,0,0,0.5); border-top:1px solid rgba(255,255,255,0.06); }
  .retreat-btn { background:rgba(180,40,40,0.25); border:1.5px solid rgba(220,60,60,0.45); color:#ff9090; border-radius:22px; padding:8px 18px; font-family:var(--f-display); font-size:0.95rem; font-weight:400; letter-spacing:0.08em; cursor:pointer; transition:background 0.15s; box-shadow:0 2px 8px rgba(180,40,40,0.18); }
  .retreat-btn:active { background:rgba(200,40,40,0.4); }
  .end-turn-btn { background:linear-gradient(135deg,#4a9eff,#1a6fd4); color:#fff; border:none; border-radius:22px; padding:8px 18px; font-family:var(--f-display); font-size:0.95rem; font-weight:400; letter-spacing:0.08em; cursor:pointer; box-shadow:0 0 18px rgba(74,158,255,0.4); transition:filter 0.15s,transform 0.1s; }
  .end-turn-btn.reveal-mode { background:linear-gradient(135deg,#b4ff4f,#78c800); color:#050508; box-shadow:0 0 18px rgba(180,255,79,0.4); }
  .end-turn-btn.ready { background:linear-gradient(135deg,#b4ff4f,#78c800); color:#050508; box-shadow:0 0 22px rgba(180,255,79,0.5); animation:end-turn-pulse 1.4s ease-in-out infinite; }
  .card-tiltable { transform-style:preserve-3d; transition:transform 0.42s cubic-bezier(.22,1,.36,1), box-shadow 0.25s; will-change:transform; --shine-x:50%; --shine-y:50%; }
  .card-tiltable:hover { transition:transform 60ms linear, box-shadow 0.25s; }
  .popup-shine, .coll-shine { position:absolute; inset:0; z-index:4; pointer-events:none; border-radius:inherit; background:radial-gradient(circle at var(--shine-x,50%) var(--shine-y,50%), rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 18%, rgba(255,255,255,0) 45%); opacity:0; transition:opacity 0.18s; mix-blend-mode:screen; }
  .card-tiltable:hover .popup-shine, .card-tiltable:hover .coll-shine { opacity:1; }
  .card-tiltable:hover { box-shadow: 0 24px 40px rgba(0,0,0,0.7), 0 0 32px hsl(var(--ch),60%,40%,0.28); }
  @keyframes end-turn-pulse { 0%,100%{box-shadow:0 0 22px rgba(180,255,79,0.5);} 50%{box-shadow:0 0 38px rgba(180,255,79,0.85);} }
  .end-turn-btn:active { transform:scale(0.93); }
  .end-turn-btn:disabled { opacity:0.28; }
  .turn-counter { font-size:0.55rem; opacity:0.7; font-family:var(--f-mono); text-align:center; margin-top:1px; }
  .status-hint { font-size:0.7rem; color:rgba(255,255,255,0.6); font-family:var(--f-display); letter-spacing:0.06em; text-align:center; }
  .hand-area { position:relative; flex-shrink:0; min-height:130px; background:rgba(0,0,0,0.65); display:flex; align-items:flex-end; justify-content:center; padding:6px 8px 8px; overflow:visible; touch-action:none; }
  .hand-cards { display:flex; align-items:flex-end; gap:4px; position:relative; justify-content:center; width:100%; }
  .hand-slot { position:relative; flex-shrink:0; width:var(--slot-w,82px); }
  .hand-slot .card-view { position:relative; width:100%; aspect-ratio: 1 / 1.4; height:auto; border-radius:10px; transform-origin:bottom center; transition:transform 0.2s cubic-bezier(.22,1,.36,1), box-shadow 0.2s, opacity 0.15s; cursor:grab; touch-action:none; -webkit-user-select:none; -webkit-touch-callout:none; }
  .hand-slot .card-view:active { cursor:grabbing; }
  .hand-slot .card-view .card-emoji  { font-size:2.4rem; }
  .hand-slot .card-view .card-energy { width:16px; height:16px; font-size:0.64rem; top:3px; left:3px; }
  .hand-slot .card-view .card-power  { width:16px; height:16px; font-size:0.64rem; top:3px; right:3px; bottom:auto; left:auto; }
  .hand-slot .card-view .card-nameplate { height:36%; padding:0 3px 5px; align-items:flex-end; }
  .hand-slot .card-view .card-name-text { font-size:0.48rem; letter-spacing:0.01em; line-height:1.05; white-space:normal; overflow:hidden; text-overflow:clip; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; word-break:break-word; }
  .hand-slot .card-view.card-selected { transform:translateY(-22px) scale(1.08) !important; box-shadow:0 0 0 2px var(--neon), 0 0 20px rgba(180,255,79,0.45), 0 14px 28px rgba(0,0,0,0.8) !important; z-index:60 !important; }
  .drag-ghost { position:fixed; pointer-events:none; z-index:999; width:76px; height:107px; border-radius:9px; overflow:hidden; opacity:0.88; transform:translate(-50%,-50%) scale(1.12) rotate(-4deg); box-shadow:0 16px 40px rgba(0,0,0,0.85); }
  .card-popup-backdrop { position:fixed; inset:0; z-index:200; background:transparent; pointer-events:none; }
  .card-popup { position:fixed; bottom:160px; left:50%; transform:translateX(-50%); z-index:201; width:220px; aspect-ratio:1 / 1.4; border-radius:14px; box-shadow: 0 20px 50px rgba(0,0,0,0.9), 0 0 30px hsl(var(--ch),60%,40%,.3), inset 0 0 0 1px hsl(var(--ch),80%,72%), inset 0 0 0 2px hsl(var(--ch),55%,42%), inset 0 0 0 3px hsl(var(--ch),35%,22%), inset 0 0 0 4px rgba(0,0,0,0.55); background:#080810; overflow:visible; animation:popup-rise 0.2s cubic-bezier(.22,1,.36,1); pointer-events:none; }
  @keyframes popup-rise { from{transform:translateX(-50%) translateY(16px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
  .popup-art { position:absolute; top:0; left:0; right:0; bottom:0; overflow:hidden; border-radius:13px; }
  .popup-close { position:absolute; top:-12px; right:-12px; z-index:6; width:30px; height:30px; border-radius:50%; background:#1a1a26; color:#fff; border:2px solid rgba(255,255,255,0.5); font-family:var(--f-head); font-weight:700; font-size:0.85rem; display:flex; align-items:center; justify-content:center; cursor:pointer; pointer-events:auto; box-shadow:0 4px 10px rgba(0,0,0,0.85); transition:background 0.15s, transform 0.1s; }
  .popup-close:hover  { background:rgba(255,80,80,0.8); }
  .popup-close:active { transform:scale(0.9); }
  .popup-art img { width:100%; height:100%; object-fit:cover; }
  .popup-art-emoji { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:4rem; opacity:0.45; background:hsl(var(--ch),18%,7%); }
  .popup-badge { position:absolute; z-index:4; width:24px; height:24px; border-radius:50%; font-family:var(--f-mono); font-weight:700; font-size:0.95rem; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.9); }
  .popup-badge.energy-badge { top:8px; left:8px; background:#1d8ed4; color:#fff; }
  .popup-badge.power-badge  { top:8px; right:8px; background:#e74624; color:#fff; }
  .popup-body { position:absolute; left:0; right:0; bottom:0; z-index:3; padding:60px 12px 14px; display:flex; flex-direction:column; gap:4px; border-radius:0 0 13px 13px; background:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.7) 100%); pointer-events:none; }
  .popup-name { font-family:var(--f-display); font-size:1.45rem; font-weight:400; letter-spacing:0.02em; color:#fff; flex:1; line-height:1.04; text-shadow: 0 1px 0 rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.8); white-space:normal; word-break:break-word; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .popup-name-row { display:flex; align-items:center; gap:8px; }
  .popup-info-btn { pointer-events:auto; width:24px; height:24px; border-radius:50%; border:1.5px solid rgba(255,255,255,0.25); background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.65); font-family:Georgia, serif; font-style:italic; font-weight:700; font-size:0.85rem; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.15s; flex-shrink:0; padding:0; line-height:1; }
  .popup-info-btn:hover { background:rgba(255,255,255,0.12); color:#fff; }
  .popup-info-btn.active { background:hsl(var(--ch),60%,40%); border-color:hsl(var(--ch),70%,55%); color:#fff; }
  .popup-ability { font-size:0.74rem; color:#fff; line-height:1.35; text-shadow:0 1px 4px rgba(0,0,0,0.9); }
  .popup-snap-credit { color: rgba(255,220,100,0.82); font-style:italic; font-size:0.66rem; text-shadow:0 1px 3px rgba(0,0,0,0.85); }
  .popup-flavor { font-size:0.7rem; color:rgba(255,255,255,0.78); font-style:italic; line-height:1.35; border-top:1px solid rgba(255,255,255,0.15); padding-top:5px; text-shadow:0 1px 3px rgba(0,0,0,0.9); }
  .popup-hint    { font-size:0.62rem; color:rgba(180,255,79,0.7); font-family:var(--f-mono); text-align:center; }
  .popup-action-btn { pointer-events:auto; background:linear-gradient(135deg,#ff8c5a,#d44a2c); color:#fff; border:none; border-radius:10px; padding:8px 14px; font-family:var(--f-head); font-weight:700; font-size:0.78rem; letter-spacing:0.05em; cursor:pointer; box-shadow:0 0 14px rgba(255,140,90,0.4); transition:filter 0.15s, transform 0.1s; align-self:center; margin-top:4px; }
  .popup-action-btn:hover  { filter:brightness(1.1); }
  .popup-action-btn:active { transform:scale(0.95); }
  .result-overlay { position:absolute; inset:0; z-index:300; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); animation:fade-in 0.3s; }
  @keyframes fade-in { from{opacity:0} to{opacity:1} }
  .result-card { background:var(--bg2); border:1.5px solid var(--border); border-radius:20px; padding:36px 40px; text-align:center; display:flex; flex-direction:column; gap:16px; }
  .result-title { font-size:2rem; font-weight:700; }
  .result-sub { font-size:0.85rem; color:var(--muted); }
  .result-actions { display:flex; gap:10px; justify-content:center; }
  .zone-winner-glow { box-shadow: 0 0 0 3px #ffe066, 0 0 28px rgba(255,224,102,0.7), 0 0 60px rgba(255,224,102,0.3) !important; animation: winner-pulse 1.2s ease-in-out infinite; }
  @keyframes winner-pulse { 0%,100%{box-shadow:0 0 0 3px #ffe066,0 0 28px rgba(255,224,102,0.7),0 0 60px rgba(255,224,102,0.3);} 50%{box-shadow:0 0 0 3px #ffe066,0 0 48px rgba(255,224,102,0.95),0 0 90px rgba(255,224,102,0.55);} }
  .zone.destroy-flash-zone::after { content:''; position:absolute; inset:0; border-radius:12px; pointer-events:none; z-index:50; animation: zone-destroy-flash 0.65s ease-out forwards; }
  @keyframes zone-destroy-flash { 0%{box-shadow:inset 0 0 0 3px rgba(255,55,55,1),inset 0 0 32px rgba(255,40,40,0.5);opacity:1;} 60%{opacity:0.5;} 100%{box-shadow:inset 0 0 0 0px rgba(255,55,55,0),inset 0 0 0 rgba(255,40,40,0);opacity:0;} }
  .confetti-wrap { position:absolute; inset:0; z-index:290; pointer-events:none; overflow:hidden; }
  .confetti-piece { position:absolute; width:8px; height:12px; border-radius:2px; opacity:0; animation: confetti-fall 2.2s ease-in forwards; }
  @keyframes confetti-fall { 0%{opacity:1;transform:translateY(-20px) rotate(0deg);} 80%{opacity:1;} 100%{opacity:0;transform:translateY(100vh) rotate(720deg);} }
  .ongoing-shimmer::after { content:''; position:absolute; inset:-2px; border-radius:inherit; border:2px solid transparent; background:linear-gradient(135deg,#b4ff4f,#5fd4ff,#ff5fba,#b4ff4f) border-box; -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite: destination-out; mask-composite: exclude; animation: ongoing-shimmer-spin 2.4s linear infinite; pointer-events:none; z-index:20; }
  @keyframes ongoing-shimmer-spin { 0%{filter:hue-rotate(0deg) brightness(1);} 50%{filter:hue-rotate(180deg) brightness(1.3);} 100%{filter:hue-rotate(360deg) brightness(1);} }
  .destroy-flash { position:absolute; inset:-4px; z-index:40; border-radius:inherit; pointer-events:none; animation: destroy-burst 0.6s ease-out forwards; }
  @keyframes destroy-burst { 0%{box-shadow:0 0 0 0 rgba(255,60,60,0);background:rgba(255,60,60,0.6);opacity:1;transform:scale(1);} 40%{box-shadow:0 0 0 18px rgba(255,60,60,0.4);background:rgba(255,100,40,0.3);opacity:1;transform:scale(1.15);} 100%{box-shadow:0 0 0 32px rgba(255,60,60,0);background:transparent;opacity:0;transform:scale(1.4);} }
  .destroy-label { position:absolute; left:50%; top:50%; z-index:45; transform:translate(-50%,-50%); font-family:var(--f-display); font-size:1.1rem; color:#ff4444; text-shadow:0 0 12px rgba(255,60,60,0.9),0 2px 4px rgba(0,0,0,0.9); pointer-events:none; animation: destroy-label-pop 0.7s cubic-bezier(.22,.61,.36,1) forwards; }
  @keyframes destroy-label-pop { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.4);} 30%{opacity:1;transform:translate(-50%,-70%) scale(1.3);} 70%{opacity:1;transform:translate(-50%,-90%) scale(1.0);} 100%{opacity:0;transform:translate(-50%,-120%) scale(0.9);} }
  @keyframes pop { from{transform:scaleY(0);opacity:0} to{transform:scaleY(1);opacity:1} }
  .deck-info-row { display:flex; gap:5px; align-items:center; justify-content:center; padding:3px 8px 0; flex-shrink:0; }
  .deck-pill { display:flex; align-items:center; gap:4px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:4px 10px; font-family:var(--f-mono); font-size:0.62rem; font-weight:700; color:rgba(255,255,255,0.65); cursor:pointer; transition:background 0.14s, border-color 0.14s, color 0.14s; letter-spacing:0.04em; touch-action:manipulation; user-select:none; }
  .deck-pill:active { transform:scale(0.92); }
  .deck-pill.deck-pill-deck    { border-color:rgba(95,212,255,0.4); }
  .deck-pill.deck-pill-discard { border-color:rgba(255,160,60,0.4); }
  .deck-pill.deck-pill-destroy { border-color:rgba(255,90,90,0.4);  }
  .deck-pill:hover { background:rgba(255,255,255,0.13); color:#fff; }
  .deck-pill .pill-icon  { font-size:0.75rem; line-height:1; }
  .deck-pill .pill-count { background:rgba(255,255,255,0.15); border-radius:10px; padding:1px 5px; font-size:0.58rem; }
  .deck-pill.deck-pill-deck    .pill-count { background:rgba(95,212,255,0.25);  color:#5fd4ff; }
  .deck-pill.deck-pill-discard .pill-count { background:rgba(255,160,60,0.25);  color:#ffa03c; }
  .deck-pill.deck-pill-destroy .pill-count { background:rgba(255,90,90,0.25);   color:#ff7070; }
  .deck-panel-backdrop { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); display:flex; align-items:flex-end; animation:backdrop-in 0.18s ease-out; }
  @keyframes backdrop-in { from{opacity:0} to{opacity:1} }
  .deck-panel { width:100%; max-height:72vh; background:var(--bg2); border-top:1px solid rgba(255,255,255,0.1); border-radius:18px 18px 0 0; display:flex; flex-direction:column; animation:panel-slide-up 0.26s cubic-bezier(.22,1,.36,1); overflow:hidden; }
  @keyframes panel-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .deck-panel-header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px 10px; flex-shrink:0; border-bottom:1px solid rgba(255,255,255,0.07); }
  .deck-panel-title { font-family:var(--f-display); font-size:1.1rem; font-weight:400; letter-spacing:0.06em; color:#fff; }
  .deck-panel-count { font-family:var(--f-mono); font-size:0.7rem; color:var(--muted); }
  .deck-panel-close { background:rgba(255,255,255,0.08); border:none; border-radius:50%; width:28px; height:28px; color:var(--muted); font-size:1rem; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background 0.12s; }
  .deck-panel-close:active { background:rgba(255,255,255,0.18); }
  .deck-panel-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:12px; overflow-y:auto; -webkit-overflow-scrolling:touch; flex:1; min-height:0; }
  .deck-panel-empty { grid-column:1/-1; text-align:center; color:var(--muted); font-size:0.85rem; padding:32px; }
  .deck-panel-card-wrap { position:relative; aspect-ratio:1/1.4; cursor:pointer; }
  .shuffle-overlay { position:absolute; inset:0; z-index:400; display:flex; flex-direction:column; align-items:center; justify-content:center; background:radial-gradient(ellipse at 50% 55%, #16082e 0%, #05050f 70%); gap:24px; pointer-events:none; }
  .shuffle-title { font-family:var(--f-display); font-size:1.8rem; color:var(--neon); letter-spacing:0.12em; opacity:0; animation: shuffle-title-in 0.5s 0.1s ease-out forwards; }
  @keyframes shuffle-title-in { from{opacity:0;transform:translateY(-12px);} to{opacity:1;transform:translateY(0);} }
  .shuffle-deck-area { position:relative; width:120px; height:168px; }
  .shuffle-card { position:absolute; inset:0; border-radius:12px; background:radial-gradient(ellipse at 50% 30%, #2d1670 0%, #120426 70%); box-shadow:inset 0 0 0 1px hsl(280,70%,65%), 0 8px 24px rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; font-family:var(--f-display); font-size:2.2rem; color:rgba(220,180,255,0.7); }
  .shuffle-card-1 { transform:rotate(-6deg) translateX(-28px); }
  .shuffle-card-2 { transform:rotate(-3deg) translateX(-14px); }
  .shuffle-card-3 { transform:rotate(0deg); }
  .shuffle-card-4 { transform:rotate(3deg) translateX(14px); }
  .shuffle-card-5 { transform:rotate(6deg) translateX(28px); }
  .shuffle-anim .shuffle-card-1 { animation:deal-card 0.35s 0.3s  cubic-bezier(.34,1.56,.64,1) both; }
  .shuffle-anim .shuffle-card-2 { animation:deal-card 0.35s 0.5s  cubic-bezier(.34,1.56,.64,1) both; }
  .shuffle-anim .shuffle-card-3 { animation:deal-card 0.35s 0.7s  cubic-bezier(.34,1.56,.64,1) both; }
  .shuffle-anim .shuffle-card-4 { animation:deal-card 0.35s 0.9s  cubic-bezier(.34,1.56,.64,1) both; }
  .shuffle-card-fan { animation:fan-in 0.6s 0.05s cubic-bezier(.22,1,.36,1) both; }
  @keyframes fan-in { from{transform:scale(0.7) translateY(40px);opacity:0;} to{transform:scale(1) translateY(0);opacity:1;} }
  @keyframes deal-card { 0%{transform:translate(0,0) rotate(0deg) scale(1);opacity:1;} 60%{transform:translate(0,-90px) scale(1.15);opacity:1;} 100%{transform:translate(0,220px) scale(0.85);opacity:0;} }
  .shuffle-sub   { font-size:0.75rem; color:var(--muted); font-family:var(--f-mono); letter-spacing:0.1em; opacity:0; animation:shuffle-title-in 0.4s 0.4s ease-out forwards; }
  .shuffle-count { font-family:var(--f-mono); font-size:0.7rem; color:rgba(95,212,255,0.8); opacity:0; animation:shuffle-title-in 0.4s 0.6s ease-out forwards; }
  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-track { background:var(--bg); }
  ::-webkit-scrollbar-thumb { background:var(--bg3); border-radius:3px; }
  .deck-select-screen { align-items:center; justify-content:flex-start; gap:0; padding-top:0; background:radial-gradient(ellipse at 50% 30%,#0d1e38 0%,#05050f 70%); }
  .deck-select-header { width:100%; display:flex; align-items:center; gap:12px; padding:14px 18px; border-bottom:1px solid var(--border); background:var(--bg2); flex-shrink:0; }
  .deck-select-title { flex:1; font-size:1.1rem; font-weight:700; }
  .deck-list { width:100%; padding:16px; display:flex; flex-direction:column; gap:12px; overflow-y:auto; flex:1; }
  .deck-card { background:var(--bg2); border:1.5px solid var(--border); border-radius:16px; padding:16px 18px; display:flex; align-items:center; gap:14px; cursor:pointer; transition:border-color 0.18s, box-shadow 0.18s; position:relative; }
  .deck-card:active { transform:scale(0.98); }
  .deck-card.deck-selected { border-color:var(--neon); box-shadow:0 0 0 2px var(--neon),0 0 20px rgba(180,255,79,0.25); }
  .deck-card-icon { font-size:2rem; width:48px; text-align:center; flex-shrink:0; }
  .deck-card-info { flex:1; min-width:0; }
  .deck-card-name { font-size:1rem; font-weight:700; color:var(--text); margin-bottom:3px; }
  .deck-card-sub  { font-size:0.72rem; color:var(--muted); font-family:var(--f-mono); }
  .deck-card-actions { display:flex; gap:6px; }
  .deck-random-btn { background:linear-gradient(135deg,#7040f0,#a070ff); border:none; color:#fff; border-radius:12px; padding:10px 18px; font-family:var(--f-display); font-size:1rem; cursor:pointer; display:flex; align-items:center; gap:8px; }
  .deck-play-bar { width:100%; padding:14px 16px; background:var(--bg2); border-top:1px solid var(--border); flex-shrink:0; }
  .deck-builder-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; padding:10px; flex:1; min-height:0; overflow-y:auto; overflow-x:hidden; }
  .deck-builder-slot { position:relative; aspect-ratio:63.5/88.9; cursor:pointer; }
  .deck-builder-slot .coll-card { transition:transform 0.15s, box-shadow 0.15s; }
  .deck-builder-slot .coll-card.in-deck { border-color:var(--neon); box-shadow:0 0 0 2px var(--neon); }
  .deck-count-badge { position:absolute; top:-5px; right:-5px; z-index:10; background:var(--neon); color:#050508; width:18px; height:18px; border-radius:50%; font-size:0.6rem; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .deck-builder-bar { display:flex; align-items:center; gap:10px; padding:10px 14px; background:var(--bg2); border-top:1px solid var(--border); flex-shrink:0; }
  .deck-bar-count { font-family:var(--f-mono); font-size:0.8rem; color:var(--muted); flex:1; }
`;

export default GLOBAL_CSS;
