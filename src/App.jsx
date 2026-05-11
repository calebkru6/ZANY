// ════════════════════════════════════════════════════════════════════
// App.jsx — ZANY: Interdimensional Card Battles
// ════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";

// ── Extracted modules ─────────────────────────────────────────────
import GLOBAL_CSS from "./styles/globalStyles";
import { STORAGE_KEY, STORAGE_KEY_OLD, DECKS_KEY, TURNS, MAX_PER_SIDE, DEBUG_DRAG, HAND_SIZE } from "./constants";
import useTilt from "./hooks/useTilt";
import { _snapshotPowers, _diffPowers } from "./game/snapHelpers";
import SNAP_HANDLERS from "./game/snapHandlers";
import CARD_IMAGES from "./game/cardImages";
import { SNAP_ABILITY_LIBRARY, SPREADSHEET_CARDS } from "./game/cardData";
import ZONES from "./game/zones";
import {
  uid, tiltOf, hueOf, emojiOf, shuffle,
  buildDeck, initGame, applyReveal,
  displayClout, zonePower, klawBonusForZone, deathReducedCost,
  computePriority, computeWinner,
  endTurnResolve, getResults, aiDecide,
} from "./game/gameLogic";

// ── Everything else in your file continues unchanged below ────────
// ─── Components ───────────────────────────────────────────────────────────────
function CardView({ card, mini = false, selected = false, playing = false, landing = false, showName = false, revealed = true, onClick, onPointerDown, className: extraClass = "", style: extraStyle }) {
  const hue = hueOf(card);
  const energy = card.energy ?? card.clout;  // energy cost — falls back to power if not set
  const power  = card.clout;
  const isOngoing = revealed && card.abilityText && card.abilityText.startsWith("Ongoing:");
  return (
    <div
      className={["card-view", mini?"card-mini":"", selected?"card-selected":"", playing?"card-playing":"", landing?"card-land":"", isOngoing?"ongoing-shimmer":"", extraClass].filter(Boolean).join(" ")}
      style={{ "--ch": hue, cursor: onPointerDown ? "grab" : onClick ? "pointer" : "default", ...extraStyle }}
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      {/* Flip container — front face = full card, back face = uniform graphic */}
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

function Zone({ zone, zoneRef, zoneIdx, state, dragOver, dragBlocked, scoreChanged, revealedIds, revealFx, powerFx, onSelectCard, playedThisTurnIds, onDragPlayerCard, onUnplayCard, draggingCardId, winnerGlow }) {
  const pp = zonePower(zone.pCards, state, true,  zoneIdx) + klawBonusForZone(state||{zones:[]}, true,  zoneIdx);
  const ap = zonePower(zone.aCards, state, false, zoneIdx) + klawBonusForZone(state||{zones:[]}, false, zoneIdx);
  const winning = pp > ap ? "player" : ap > pp ? "ai" : "tied";

  // Build inline style: custom image takes priority; otherwise use placeholder gradient
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
      className={`zone${zone.bgImage ? " has-bg-image" : ""}${dragOver ? " drag-over" : ""}${dragBlocked ? " drag-blocked" : ""}${winnerGlow ? " zone-winner-glow" : ""}`}
      style={zoneStyle}
    >
      <div className="zone-slot ai-slot">
        {zone.aCards.length
          ? zone.aCards.map(c => {
              const isRevealed = revealedIds?.has(c.id);
              const showFx     = revealFx && !revealFx.isPlayer && revealFx.cardId === c.id;
              const myDeltas = (powerFx || []).filter(d => d.cardId === c.id && d.side === "ai");
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
      <div className={`zone-bar${winning==="player"?" winning-player":winning==="ai"?" winning-ai":""}`}>
        {/* AI score above the location name (closer to AI cards) */}
        <span className={`zone-score-hex${winning==="ai"?" leading-ai":""}${scoreChanged?" score-changed":""}`}>{ap}</span>
        <span className="zone-name">{zone.name}</span>
        <div className="zone-ability">{zone.ability}</div>
        {/* Player score below the location name (closer to player cards) */}
        <span className={`zone-score-hex${winning==="player"?" leading-player":""}${scoreChanged?" score-changed":""}`}>{pp}</span>
      </div>
      <div className="zone-slot player-slot">
        {zone.pCards.length
          ? zone.pCards.map(c => {
              const draggable = playedThisTurnIds?.has(c.id);
              const isDragged = draggingCardId === c.id;
              const isRevealed= revealedIds?.has(c.id);
              const showFx    = revealFx && revealFx.isPlayer && revealFx.cardId === c.id;
              const myDeltas = (powerFx || []).filter(d => d.cardId === c.id && d.side === "player");
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

function HomeScreen({ onPlay, onCollection }) {
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

function CollectionCard({ card, selected, onSelect }) {
  const hue = hueOf(card);
  const tiltRef = useTilt(10, 1.04);
  return (
    <div className="card-grid-item" onClick={onSelect}>
      <div ref={tiltRef} className={`coll-card card-tiltable${selected ? " coll-selected" : ""}`} style={{"--ch": hue}}>
        {card.imageUrl
          ? <img className="coll-card-art" src={card.imageUrl} alt={card.name} />
          : <div className="coll-card-emoji">{emojiOf(hue)}</div>}
        <div className="coll-card-overlay" />
        <div className="coll-shine" />
        <div className="coll-card-badge">{card.clout}</div><div className="coll-card-energy">{card.energy ?? card.clout}</div>
        <div className="coll-card-name">{card.name}</div>
      </div>
    </div>
  );
}

function CollectionScreen({ cards, onBack, onNew, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort,   setSort]   = useState("default"); // default | energy-asc | energy-desc | power-asc | power-desc
  const [selected, setSelected] = useState(null);

  const visible = cards
    .filter(c => {
      const ms = c.name.toLowerCase().includes(search.toLowerCase());
      const mf = filter === "all" ? true : filter === "ability" ? !!c.abilityText : filter === "no-art" ? !c.imageUrl : true;
      return ms && mf;
    })
    .sort((a, b) => {
      if (sort === "energy-asc")  return (a.energy ?? a.clout) - (b.energy ?? b.clout);
      if (sort === "energy-desc") return (b.energy ?? b.clout) - (a.energy ?? a.clout);
      if (sort === "power-asc")   return a.clout - b.clout;
      if (sort === "power-desc")  return b.clout - a.clout;
      return 0; // default: original order
    });

  const selectedCard = cards.find(c => c.id === selected);

  // Sort button: cycles asc → desc → off for each field
  const cycleSort = (field) => {
    if (sort === `${field}-asc`)  setSort(`${field}-desc`);
    else if (sort === `${field}-desc`) setSort("default");
    else setSort(`${field}-asc`);
  };
  const sortIcon = (field) => {
    if (sort === `${field}-asc`)  return "↑";
    if (sort === `${field}-desc`) return "↓";
    return "↕";
  };

  return (
    <div className="screen" style={{paddingBottom: selected ? 80 : 0}} onClick={() => setSelected(null)}>
      <div className="screen-header" onClick={e => e.stopPropagation()}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <h2>Cards</h2>
        <button className="btn btn-primary" onClick={onNew}>+ New</button>
      </div>
      <div className="collection-toolbar" onClick={e => e.stopPropagation()}>
        <div className="collection-toolbar-row">
          <input className="search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="collection-toolbar-row">
          <div className="filter-tabs">
            {[["all","All"],["ability","Ability"],["no-art","No Art"]].map(([v,l]) => (
              <button key={v} className={`filter-tab${filter===v?" active":""}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
            <button
              className={`filter-tab${sort.startsWith("energy") ? " active" : ""}`}
              style={{color: sort.startsWith("energy") ? "#1d8ed4" : undefined, borderColor: sort.startsWith("energy") ? "#1d8ed4" : undefined, background: sort.startsWith("energy") ? "rgba(29,142,212,0.1)" : undefined}}
              onClick={() => cycleSort("energy")}
            >⚡ {sortIcon("energy")}</button>
            <button
              className={`filter-tab${sort.startsWith("power") ? " active" : ""}`}
              style={{color: sort.startsWith("power") ? "#e74624" : undefined, borderColor: sort.startsWith("power") ? "#e74624" : undefined, background: sort.startsWith("power") ? "rgba(231,70,36,0.1)" : undefined}}
              onClick={() => cycleSort("power")}
            >💥 {sortIcon("power")}</button>
          </div>
        </div>
      </div>
      <div className="collection-count">{visible.length} / {cards.length}</div>
      <div className="card-grid" onClick={e => e.stopPropagation()}>
        {!visible.length && <div className="empty-state">No cards match.</div>}
        {visible.map(card => (
          <CollectionCard
            key={card.id}
            card={card}
            selected={selected === card.id}
            onSelect={e => { e.stopPropagation(); setSelected(p => p === card.id ? null : card.id); }}
          />
        ))}
      </div>
      {selectedCard && (
        <div className="coll-preview-backdrop" onClick={() => setSelected(null)}>
          <div className="coll-preview-stage" onClick={e => e.stopPropagation()}>
            <CardView card={selectedCard} showName revealed className="coll-preview-card" />
            <div className="coll-preview-info">
              <div className="coll-preview-name">{selectedCard.name}</div>
              {selectedCard.abilityText && (
                <div className="coll-preview-ability">{selectedCard.abilityText}</div>
              )}
              {selectedCard.flavor && (
                <div className="coll-preview-flavor">"{selectedCard.flavor}"</div>
              )}
              <div className="coll-preview-stats">
                <span className="coll-stat-energy">⚡ {selectedCard.energy ?? selectedCard.clout} Energy</span>
                <span className="coll-stat-power">💥 {selectedCard.clout} Power</span>
              </div>
            </div>
            <div className="coll-preview-actions">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setSelected(null); onEdit(selectedCard); }}>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardEditorScreen({ card, onSave, onBack }) {
  const [form, setForm] = useState({ name: card?.name||"", energy: card?.energy||3, clout: card?.clout||3, snapName: card?.snapName||"", abilityText: card?.abilityText||"", flavor: card?.flavor||"", imageUrl: card?.imageUrl||null });
  const [err, setErr] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleImg = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => set("imageUrl", ev.target.result); r.readAsDataURL(f); };
  const handleSave = () => { if (!form.name.trim()) { setErr("A name is required."); return; } setErr(""); onSave({ id: card?.id || uid(), ...form, name: form.name.trim(), clout: Number(form.clout) }); };
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <h2>{card ? "Edit Card" : "New Card"}</h2>
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
      </div>
      <div className="editor-layout">
        <div><CardView card={{ ...form, id: card?.id || "preview" }} /></div>
        <div className="editor-form">
          {err && <div className="form-err">{err}</div>}
          <label>Name<input value={form.name} onChange={e => set("name", e.target.value)} maxLength={30} /></label>
          <label>Clout (power 1–6)
            <div className="clout-row">{[1,2,3,4,5,6].map(n => <button key={n} className={`clout-btn${form.clout===n?" active":""}`} onClick={() => set("clout",n)}>{n}</button>)}</div>
          </label>
          <label>Ability
            <input
              type="text"
              placeholder="Snap reference (e.g. Black Panther)"
              value={form.snapName}
              onChange={e => set("snapName", e.target.value)}
            />
            <textarea
              placeholder="Ability text (e.g. On Reveal: Double this card's Power.)"
              value={form.abilityText}
              onChange={e => set("abilityText", e.target.value)}
              rows={2}
            />
          </label>
          <label>Flavor Text<input value={form.flavor} onChange={e => set("flavor", e.target.value)} maxLength={80} /></label>
          <label>Card Art (optional)<input type="file" accept="image/*" onChange={handleImg} /></label>
          {form.imageUrl && <button className="btn btn-sm btn-danger" style={{alignSelf:"flex-start"}} onClick={() => set("imageUrl",null)}>Remove Image</button>}
        </div>
      </div>
    </div>
  );
}

function CardPopup({ card, onDismiss, playable = true, onUnplay = null }) {
  return (
    <>
      {/* Backdrop — tappable to dismiss */}
      <div
        style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(5px)",WebkitBackdropFilter:"blur(5px)"}}
        onClick={onDismiss}
      />
      {/* Stage */}
      <div
        style={{
          position:"fixed", left:"50%", bottom:150, transform:"translateX(-50%)",
          zIndex:201, display:"flex", flexDirection:"column", alignItems:"center", gap:12,
          animation:"popup-rise 0.22s cubic-bezier(.22,1,.36,1)",
          width:"min(240px,64vw)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Full card — width:100% overrides the 130px default */}
        <CardView
          card={card} revealed showName
          style={{width:"100%", height:"auto", borderRadius:14, boxShadow:"0 20px 50px rgba(0,0,0,0.9)"}}
        />

        {/* Info panel */}
        <div style={{
          background:"rgba(16,16,30,0.95)", border:"1px solid rgba(255,255,255,0.12)",
          borderRadius:14, padding:"12px 14px", width:"100%",
          display:"flex", flexDirection:"column", gap:6,
          boxShadow:"0 8px 24px rgba(0,0,0,0.7)",
        }}>
          <div style={{fontFamily:"var(--f-display)",fontSize:"1rem",color:"#fff",letterSpacing:"0.03em",lineHeight:1.1}}>
            {card.name}
          </div>
          {card.abilityText && (
            <div style={{fontSize:"0.74rem",color:"#b4ff4f",lineHeight:1.45,fontWeight:500}}>
              {card.abilityText}
            </div>
          )}
          {card.flavor && (
            <div style={{fontSize:"0.67rem",color:"rgba(255,255,255,0.4)",fontStyle:"italic",lineHeight:1.35}}>
              "{card.flavor}"
            </div>
          )}
          <div style={{display:"flex",gap:10,marginTop:2,fontFamily:"var(--f-mono)",fontSize:"0.68rem",fontWeight:700}}>
            <span style={{color:"#1d8ed4"}}>⚡ {card.energy ?? card.clout}</span>
            <span style={{color:"#e74624"}}>💥 {card.clout}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{display:"flex",gap:8,width:"100%"}}>
          <button className="btn btn-secondary" style={{flex:1,padding:"10px"}} onClick={onDismiss}>Close</button>
          {onUnplay && (
            <button className="btn btn-danger" style={{flex:1,padding:"10px"}} onClick={() => { onUnplay(); onDismiss(); }}>
              ↩ Return
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// CardBack — uniform back graphic for face-down cards (Marvel-Snap style)
// ════════════════════════════════════════════════════════════════════
function CardBack({ mini = false }) {
  return (
    <div className={`card-back-graphic${mini ? " card-back-mini" : ""}`}>
      <div className="card-back-frame">
        <div className="card-back-logo">Z</div>
        <div className="card-back-glyph">⬢</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// RevealEffect — burst ring + floating ability label, shown briefly when
// a card's onReveal fires. Color/label come from snapName-based theming.
// ════════════════════════════════════════════════════════════════════
// Generic reveal effect — gold/cyan/red palette by ability category
function RevealEffect({ snapName }) {
  // Quick category sniff for the color
  const handler = snapName && SNAP_HANDLERS[snapName];
  let color = "#ffe066", glow = "rgba(255,224,102,0.7)", label = (snapName || "REVEAL").toUpperCase();
  if (snapName && handler) {
    const lc = snapName.toLowerCase();
    if (["aero","magneto","cannonball","nocturne","jeff","makkari"].some(n => lc.includes(n))) {
      color = "#5fd4ff"; glow = "rgba(95,212,255,0.7)";       // movement = cyan
    } else if (["cassandra","darkhawk","alioth","echo"].some(n => lc.includes(n))) {
      color = "#ff5e8a"; glow = "rgba(255,94,138,0.7)";       // debuff = pink/red
    } else if (["panther","silver","ant","gilgamesh","elsa","adam","nebula"].some(n => lc.includes(n))) {
      color = "#7eff5e"; glow = "rgba(126,255,94,0.7)";       // buff = green
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

// ════════════════════════════════════════════════════════════════════
// PowerDeltaLabel — floating +N or -N number that rises and fades when
// a card's power changes from a Snap ability (Black Panther doubles,
// Cassandra Nova steals, etc.). Color-coded by sign.
// ════════════════════════════════════════════════════════════════════
function PowerDeltaLabel({ delta }) {
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

// ════════════════════════════════════════════════════════════════════
// MoveEffect — overlay that visualizes a card moving between zones.
// Renders a flashing border around source + destination, plus a dashed
// arrow drawn between them. Auto-fades over ~1s.
// ════════════════════════════════════════════════════════════════════
function MoveEffect({ event, zoneRefs }) {
  const fromRect = zoneRefs[event.fromZone]?.current?.getBoundingClientRect();
  const toRect   = zoneRefs[event.toZone]?.current?.getBoundingClientRect();
  if (!fromRect || !toRect) return null;

  // Side-aware Y: AI cards are in the top half, player cards in the bottom half.
  const yFrac = event.side === "player" ? 0.78 : 0.22;
  const fx = fromRect.left + fromRect.width / 2;
  const fy = fromRect.top  + fromRect.height * yFrac;
  const tx = toRect.left   + toRect.width  / 2;
  const ty = toRect.top    + toRect.height * yFrac;

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

function Confetti() {
  const COLORS = ["#ffe066","#b4ff4f","#5fd4ff","#ff5fba","#ff7043","#a78bfa"];
  const pieces = Array.from({length:28},(_,i)=>({
    id:i,
    left: Math.random()*100,
    delay: Math.random()*1.2,
    dur: 1.6 + Math.random()*0.8,
    color: COLORS[i % COLORS.length],
    rotate: Math.random()*360,
    size: 6 + Math.random()*8,
  }));
  return (
    <div className="confetti-wrap">
      {pieces.map(p=>(
        <div key={p.id} className="confetti-piece" style={{
          left:`${p.left}%`,
          top:0,
          width:p.size,
          height:p.size*1.5,
          background:p.color,
          animationDelay:`${p.delay}s`,
          animationDuration:`${p.dur}s`,
          transform:`rotate(${p.rotate}deg)`,
        }}/>
      ))}
    </div>
  );
}

function DragGhost({ card, x, y }) {
  const hue = hueOf(card);
  const energy = card.energy ?? card.clout;
  const power  = card.clout;
  return (
    <div className="drag-ghost" style={{ left: x, top: y, "--ch": hue, background: `hsl(${hue},16%,8%)` }}>
      <div className="card-art" style={{position:"absolute",inset:0,borderRadius:9}}>
        {card.imageUrl
          ? <img src={card.imageUrl} alt={card.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
          : <span style={{fontSize:"2.5rem",opacity:0.4}}>{emojiOf(hue)}</span>}
      </div>
      <div className="card-vignette" />
      <div className="card-energy" style={{position:"absolute",top:5,left:5,width:22,height:22,fontSize:"0.75rem",background:"#1d8ed4"}}>{energy}</div>
      <div className="card-power"  style={{position:"absolute",top:5,right:5,width:22,height:22,fontSize:"0.75rem",background:"#e74624",bottom:"auto",left:"auto"}}>{power}</div>
    </div>
  );
}


// ─── DeckPanel ────────────────────────────────────────────────────────────────
function DeckPanel({ title, icon, cards, onClose }) {
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
                    style={{ width:"100%", height:"100%", borderRadius:"9px" }} />
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── ShuffleOverlay ───────────────────────────────────────────────────────────
function ShuffleOverlay({ deckSize, onDone }) {
  const [phase, setPhase] = useState("fan");   // fan → deal → done
  useEffect(() => {
    // Fan in: 0.8s, then trigger deal animation
    const t1 = setTimeout(() => setPhase("deal"), 700);
    // Deal anim runs ~1.4s (last card at 0.9s + 0.35s duration + buffer)
    const t2 = setTimeout(() => { onDone(); }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="shuffle-overlay">
      <div className="shuffle-title">DEALING CARDS</div>
      <div className={`shuffle-deck-area shuffle-card-fan${phase === "deal" ? " shuffle-anim" : ""}`}>
        {[1,2,3,4,5].map(n => (
          <div key={n} className={`shuffle-card shuffle-card-${n}`}>🂠</div>
        ))}
      </div>
      <div className="shuffle-sub">SHUFFLING YOUR DECK</div>
      <div className="shuffle-count">{deckSize} CARDS · 6 TURNS</div>
    </div>
  );
}

function GameScreen({ cards, deckCards, onBack }) {
  const [game, setGame] = useState(() => initGame(deckCards || cards));
  const [selected, setSelected]   = useState(null);   // card tapped for popup
  const [playingId, setPlayingId] = useState(null);
  const [deckPanel, setDeckPanel] = useState(null);   // null | "deck" | "discard" | "destroyed"

  // Drag state
  const [drag, setDrag]         = useState(null);  // { cardId, x, y }
  const [dragOver, setDragOver] = useState(null);  // zoneIdx
  const [debugLog, setDebugLog] = useState("idle"); // visible diagnostic
  const [revealFx, setRevealFx] = useState(null);   // {cardId, snapName, zoneIdx, isPlayer}
  const [moveFx,   setMoveFx]   = useState([]);     // [{type:"move", cardId, fromZone, toZone, side, _id}]
  const [powerFx,  setPowerFx]  = useState([]);     // [{cardId, side, zoneIdx, delta, _id}]
  const zoneRefs                = [useRef(), useRef(), useRef()];
  const dragRef                 = useRef(null);

  const inPlay   = game.phase === "play";
  const inReveal = game.phase === "reveal";
  const inEnd    = game.phase === "end";
  const inShuffle= game.phase === "shuffle";

  // Shuffle → play transition: deal HAND_SIZE cards one by one then start game
  const handleShuffleDone = () => {
    setGame(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      s.playerHand = s.playerDeck.slice(0, HAND_SIZE);
      s.playerDeck = s.playerDeck.slice(HAND_SIZE);
      s.phase = "play";
      return s;
    });
  };

  // Reveal sequencer — runs after END TURN places AI cards face-down
  useEffect(() => {
    if (game.phase !== "reveal") return;

    // Build queue: priority player's plays first, in placement order
    const playerQ = (game.playerPlaysThisTurn || []).map(p => ({ ...p, isPlayer: true }));
    const aiQ     = (game.aiPlaysThisTurn     || []).map(p => ({ ...p, isPlayer: false }));
    const queue   = (game.priority === "player")
      ? [...playerQ, ...aiQ]
      : [...aiQ, ...playerQ];

    let cancelled = false;
    const timeouts = [];

    // Step the queue with delays
    let delay = 500;          // initial dramatic pause
    const flipTime = 700;     // per-card reveal interval

    queue.forEach((play, idx) => {
      timeouts.push(setTimeout(() => {
        if (cancelled) return;
        setGame(prev => {
          const s = JSON.parse(JSON.stringify(prev));
          const zone = s.zones[play.zoneIdx];
          const card = play.isPlayer
            ? zone.pCards.find(c => c.id === play.cardId)
            : zone.aCards.find(c => c.id === play.cardId);
          if (!card) return prev;
          if (!s.revealedIds.includes(card.id)) s.revealedIds.push(card.id);
          // Snapshot powers before the handler so we can diff after
          const before = _snapshotPowers(s);
          const result = applyReveal(card, play.zoneIdx, s, play.isPlayer);
          const after  = _snapshotPowers(result.state);
          const powerDeltas = _diffPowers(before, after);

          // Reveal-effect overlay (snapName label + glow on the card)
          setTimeout(() => {
            setRevealFx({
              cardId: play.cardId,
              snapName: card.snapName || "",
              zoneIdx: play.zoneIdx,
              isPlayer: play.isPlayer,
            });
          }, 220);

          // Move-effect overlays (one per moved card, staggered)
          if (result.fx && result.fx.length) {
            result.fx.forEach((ev, mi) => {
              const evWithId = { ...ev, _id: Date.now() + mi };
              setTimeout(() => setMoveFx(prev => [...prev, evWithId]), 380 + mi * 140);
              setTimeout(() => setMoveFx(prev => prev.filter(m => m._id !== evWithId._id)), 1500 + mi * 140);
            });
          }

          // Power-delta floating labels (+N / -N on each affected card)
          if (powerDeltas.length) {
            powerDeltas.forEach((d, di) => {
              const deltaWithId = { ...d, _id: Date.now() + 1000 + di };
              setTimeout(() => setPowerFx(prev => [...prev, deltaWithId]), 320 + di * 90);
              setTimeout(() => setPowerFx(prev => prev.filter(x => x._id !== deltaWithId._id)), 1300 + di * 90);
            });
          }
          return result.state;
        });
      }, delay));
      // Clear effect after animation
      timeouts.push(setTimeout(() => { if (!cancelled) setRevealFx(null); }, delay + 750));
      delay += flipTime;
    });

    // Final step: advance the turn + recompute priority for next turn
    timeouts.push(setTimeout(() => {
      if (cancelled) return;
      setGame(prev => {
        let s = JSON.parse(JSON.stringify(prev));
        s.playerPlaysThisTurn = [];
        s.aiPlaysThisTurn = [];
        // Compute priority for the upcoming turn based on current board state
        s.priority = computePriority(s, s.priority);
        if (s.turn >= TURNS) {
          // ── End-of-game effects ──────────────────────────────────────
          // Captain Marvel (Logan Touchdown): move to the location that wins the game
          if (s._captainMarvelCardId) {
            const cmId = s._captainMarvelCardId;
            // Find where Captain Marvel is
            let cmZone = -1;
            for (let z = 0; z < 3; z++) {
              if (s.zones[z].pCards.some(c => c.id === cmId)) { cmZone = z; break; }
            }
            if (cmZone >= 0) {
              // Find best zone: where moving CM would win overall
              const scores = s.zones.map((z, zi) => ({
                zi,
                pp: zonePower(z.pCards, s, true, zi) + klawBonusForZone(s, true, zi),
                ap: zonePower(z.aCards, s, false, zi) + klawBonusForZone(s, false, zi),
              }));
              // Pick losing zone with highest enemy power (biggest swing)
              const losing = scores.filter(sc => sc.pp <= sc.ap && sc.zi !== cmZone)
                .sort((a, b) => b.ap - a.ap);
              if (losing.length) _moveCard(s, "player", cmId, cmZone, losing[0].zi);
            }
          }
          // Dracula (Wakanda Ellen): discard highest-power hand card, gain its power
          if (s._draculaCardId) {
            const dcId = s._draculaCardId;
            let dcZone = -1;
            for (let z = 0; z < 3; z++) {
              if (s.zones[z].pCards.some(c => c.id === dcId)) { dcZone = z; break; }
            }
            if (dcZone >= 0 && s.playerHand.length) {
              const best = s.playerHand.slice().sort((a, b) => b.clout - a.clout)[0];
              const hi = s.playerHand.findIndex(c => c.id === best.id);
              if (hi >= 0) {
                s.playerHand.splice(hi, 1);
                s.playerDiscard = s.playerDiscard || [];
                s.playerDiscard.push(best);
                const dc = s.zones[dcZone].pCards.find(c => c.id === dcId);
                if (dc) dc.clout += best.clout;
              }
            }
          }
          // ─────────────────────────────────────────────────────────────
          s.phase = "end";
        } else {
          s.turn += 1;
          s.phase = "play";
          const draws = 1 + (s.bonusDraw || 0);
          s.bonusDraw = 0;
          for (let i = 0; i < draws; i++) {
            if (s.playerDeck.length) s.playerHand.push(s.playerDeck.shift());
            if (s.aiDeck.length)     s.aiHand.push(s.aiDeck.shift());
          }
        }
        return s;
      });
      setDebugLog("idle");
    }, delay + 400));

    return () => { cancelled = true; timeouts.forEach(clearTimeout); };
  }, [game.phase]);

  // Track which zone scores just changed so we can pulse them
  const prevScoresRef = useRef([null, null, null]);
  const [changedZones, setChangedZones] = useState(new Set());
  useEffect(() => {
    const newChanged = new Set();
    game.zones.forEach((z, i) => {
      const sig = `${zonePower(z.pCards, game, true, i) + klawBonusForZone(game, true, i)}|${zonePower(z.aCards, game, false, i) + klawBonusForZone(game, false, i)}`;
      if (prevScoresRef.current[i] !== null && prevScoresRef.current[i] !== sig) {
        newChanged.add(i);
      }
      prevScoresRef.current[i] = sig;
    });
    if (newChanged.size > 0) {
      setChangedZones(newChanged);
      const t = setTimeout(() => setChangedZones(new Set()), 600);
      return () => clearTimeout(t);
    }
  }, [game.zones]);



  // ── Hit-test which zone is under (x,y) ─────────────────────────────────────
  // Pure math: zones are always 3 equal columns in the upper-middle of screen.
  // No DOM lookups = bulletproof regardless of refs, transforms, z-index, etc.
  const hitZone = (x, y) => {
    if (typeof window === "undefined") return null;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Zones occupy the area between the top bar (~56px) and the bottom bar+hand
    // (~56px+120px = ~176px). Allow generous bounds for forgiving drops.
    const topLimit    = 40;
    const bottomLimit = h - 120;   // anything below this is hand area
    if (y < topLimit || y > bottomLimit) return null;
    // Three equal columns
    if (x < w / 3)     return 0;
    if (x < w * 2 / 3) return 1;
    return 2;
  };

  // ── Unplay a card placed this turn — return it to the hand and refund Flux ─
  const unplayCard = (cardId) => {
    setGame(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      if (!(s.playerPlaysThisTurn || []).some(p => p.cardId === cardId)) return prev;
      // Find which zone has it
      let fromZone = -1;
      for (let i = 0; i < s.zones.length; i++) {
        if (s.zones[i].pCards.some(c => c.id === cardId)) { fromZone = i; break; }
      }
      if (fromZone === -1) return prev;
      const ci = s.zones[fromZone].pCards.findIndex(c => c.id === cardId);
      const card = s.zones[fromZone].pCards.splice(ci, 1)[0];
      s.playerHand.push(card);
      s.playerPlaysThisTurn = s.playerPlaysThisTurn.filter(p => p.cardId !== cardId);
      s.revealedIds = (s.revealedIds || []).filter(id => id !== cardId);
      return s;
    });
    setDebugLog(`Returned to hand`);
  };

  // ── Move a card placed this turn from one zone to another ──────────────────
  const moveCard = (cardId, toZone) => {
    setGame(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      let fromZone = -1;
      for (let i = 0; i < s.zones.length; i++) {
        if (s.zones[i].pCards.some(c => c.id === cardId)) { fromZone = i; break; }
      }
      if (fromZone === -1 || fromZone === toZone) return prev;
      if (s.zones[toZone].pCards.length >= MAX_PER_SIDE) return prev;
      const ci = s.zones[fromZone].pCards.findIndex(c => c.id === cardId);
      const card = s.zones[fromZone].pCards.splice(ci, 1)[0];
      s.zones[toZone].pCards.push(card);
      s.playerPlaysThisTurn = (s.playerPlaysThisTurn || []).map(p =>
        p.cardId === cardId ? { ...p, zoneIdx: toZone } : p
      );
      return s;
    });
    setDebugLog(`Moved to zone ${toZone}`);
  };

  // ── Place a card in a zone immediately (Snap-style) ─────────────────────────
  // Card moves from hand to zone right away. Abilities don't trigger until END TURN.
  // Multiple plays allowed per turn — limited only by energy (Flux) budget.
  const placeCard = (cardId, zoneIdx) => {
    if (!inPlay) return;
    const card = game.playerHand.find(c => c.id === cardId);
    if (!card) return;
    const destroyedCount = (game.playerDestroyed || []).length;
    const hasDeath = (game.playerHand || []).some(c=>c.snapName==="Death") ||
                     game.zones.some(z=>z.pCards.some(c=>c.snapName==="Death"));
    const rawCost = card.energy ?? card.clout;
    const cost = hasDeath ? deathReducedCost(card, destroyedCount) : rawCost;
    const spent  = (game.playerPlaysThisTurn || []).reduce((s, p) => s + p.energy, 0);
    const budget = game.turn;
    if (cost > budget - spent) {
      setDebugLog(`Need ${cost} Flux — only ${budget - spent} left`);
      return;
    }
    if (game.zones[zoneIdx].pCards.length >= MAX_PER_SIDE) {
      setDebugLog(`Location full (${MAX_PER_SIDE} max)`);
      return;
    }
    setSelected(null);
    setPlayingId(cardId);
    setGame(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      const ci = s.playerHand.findIndex(c => c.id === cardId);
      if (ci === -1) return prev;
      const placed = s.playerHand.splice(ci, 1)[0];
      s.zones[zoneIdx].pCards.push(placed);
      s.playerPlaysThisTurn = [...(s.playerPlaysThisTurn || []), { cardId, zoneIdx, energy: cost }];
      // Player cards stay face-down (NOT added to revealedIds) until END TURN.
      // They flip in priority order during the reveal sequence, same as AI cards.
      return s;
    });
    setTimeout(() => setPlayingId(null), 400);
  };

  // ── Drag start ─────────────────────────────────────────────────────────────
  // Strategy: do NOT preventDefault on pointerdown (breaks iOS touch sequence).
  // Use window-level listeners so events reach us even if a child intercepts.
  // preventDefault inside pointermove to block page scrolling during drag.
  const startDrag = (e, cardId, source = "hand") => {
    // source: "hand" = drag from hand, "zone" = drag a card placed this turn
    // Always allow drag-start so a tap can open the popup for ANY card.
    // Affordability + valid-source are re-checked at drop time.
    if (inEnd) {
      setDebugLog(`Game over`);
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const TAP_THRESHOLD = 15;
    let moved = false;
    let lastEv = null;

    setSelected(null);
    dragRef.current = { cardId, x: startX, y: startY };
    setDrag({ cardId, x: startX, y: startY });
    setDebugLog(`DOWN ${startX|0},${startY|0}`);

    const onMove = ev => {
      if (ev.cancelable) ev.preventDefault();
      lastEv = ev;
      const x = ev.clientX, y = ev.clientY;
      if (!moved && (Math.abs(x - startX) > TAP_THRESHOLD || Math.abs(y - startY) > TAP_THRESHOLD)) {
        moved = true;
        setDebugLog(`DRAGGING (threshold passed)`);
      }
      dragRef.current = { cardId, x, y };
      setDrag({ cardId, x, y });
      if (moved) {
        const zi = hitZone(x, y);
        setDragOver(zi);
        setDebugLog(`MOVE ${x|0},${y|0} zone=${zi !== null ? zi : "none"}`);
      }
    };

    const onEnd = ev => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);

      // Use last move event for coords if pointerup has 0,0 (happens on iOS sometimes)
      const x = (ev.clientX || lastEv?.clientX || startX);
      const y = (ev.clientY || lastEv?.clientY || startY);
      const zi = moved ? hitZone(x, y) : null;

      setDebugLog(`UP ${x|0},${y|0} moved=${moved} zone=${zi !== null ? zi : "none"}`);

      dragRef.current = null;
      setDrag(null);
      setDragOver(null);

      if (!moved) {
        setSelected(p => p === cardId ? null : cardId);
      } else {
        // Branch on drag source
        if (source === "hand") {
          if (zi !== null) {
            // Hand → zone: place card (with affordability + full-zone checks)
            const card = game.playerHand.find(c => c.id === cardId);
            if (!card) {
              setDebugLog(`Not in hand`);
            } else if (game.zones[zi].pCards.length >= MAX_PER_SIDE) {
              setDebugLog(`Location full (${MAX_PER_SIDE} max)`);
            } else {
              const cost   = card.energy ?? card.clout;
              const spent  = (game.playerPlaysThisTurn || []).reduce((s, p) => s + p.energy, 0);
              const budget = game.turn;
              if (cost > budget - spent) {
                setDebugLog(`Need ${cost} Flux — only ${budget - spent} left`);
              } else if (!inPlay) {
                setDebugLog(`Wait for next turn`);
              } else {
                placeCard(cardId, zi);
              }
            }
          } else {
            setDebugLog(`Released outside`);
          }
        } else if (source === "zone") {
          // Zone card drag-back behavior
          if (!inPlay) {
            setDebugLog(`Wait for next turn`);
          } else if (zi === null) {
            unplayCard(cardId);
          } else {
            // Dropped on a zone: move (or no-op if same zone)
            moveCard(cardId, zi);
          }
        }
      }
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  // End Turn: AI plays cards face-down → reveal sequence → advance turn.
  // Reveal order: player's plays first (priority), then AI's, in placement order.
  // Each reveal triggers that card's onReveal ability.
  const handleEndTurn = () => {
    if (!inPlay) return;
    setDebugLog("END TURN — AI playing, revealing in order");

    // Step 1: AI picks cards (greedy by energy, random zones), place face-down
    setGame(prev => {
      let s = JSON.parse(JSON.stringify(prev));
      const aiBudget = s.turn;
      let aiSpent = 0;
      const aiPlays = [];
      for (let attempt = 0; attempt < 3 && s.aiHand.length; attempt++) {
        const affordable = s.aiHand.filter(c => (c.energy ?? c.clout) <= aiBudget - aiSpent);
        if (!affordable.length) break;
        const openZones = [0, 1, 2].filter(zi => s.zones[zi].aCards.length < MAX_PER_SIDE);
        if (!openZones.length) break;
        const pick = affordable[Math.floor(Math.random() * affordable.length)];
        const zoneIdx = openZones[Math.floor(Math.random() * openZones.length)];
        const ci = s.aiHand.findIndex(c => c.id === pick.id);
        if (ci === -1) break;
        const card = s.aiHand.splice(ci, 1)[0];
        s.zones[zoneIdx].aCards.push(card);
        aiSpent += card.energy ?? card.clout;
        aiPlays.push({ cardId: card.id, zoneIdx });
      }
      s.aiPlaysThisTurn = aiPlays;   // remember for the reveal queue
      s.phase = "reveal";
      return s;
    });
  };

  const results = inEnd ? getResults(game) : null;
  const pWins   = results?.filter(r => r.winner === "player").length ?? 0;
  const aWins   = results?.filter(r => r.winner === "ai").length     ?? 0;
  // Overall winner uses the full Snap tiebreaker chain (locations → margin → total power)
  const overallWinner = inEnd ? computeWinner(game) : null;

  // Look up selected card anywhere: hand, player zones, AI zones
  const findCardAnywhere = id => {
    if (!id) return null;
    let c = game.playerHand.find(x => x.id === id);
    if (c) return c;
    for (const z of game.zones) {
      c = z.pCards.find(x => x.id === id) || z.aCards.find(x => x.id === id);
      if (c) return c;
    }
    return null;
  };
  const selectedCard  = findCardAnywhere(selected);
  const selectedInHand = selectedCard && game.playerHand.some(c => c.id === selected);
  const isDragging   = !!drag;

  return (
    <div className="screen game-screen">
      {/* DEBUG STATUS BAR — hidden in production. Set DEBUG_DRAG=true above to show. */}
      {DEBUG_DRAG && (
        <div className={`debug-status${dragOver !== null ? " debug-hit" : ""}`}>
          {debugLog}
        </div>
      )}

      {/* Top bar — 3-col grid: you | gem | cpu */}
      <div className="game-top">
        {/* YOU pill — left column */}
        <div className={`player-pill${game.priority === "player" ? " has-priority" : ""}`}>
          <div className="player-avatar">🧑</div>
          <div className="player-name-block">
            <div className="player-name">YOU</div>
            <div className="hand-count">🃏 {game.playerHand?.length ?? 0}</div>
          </div>
        </div>

        {/* Centre: energy gem only */}
        <div className="energy-crystal">
          <div className="crystal-gem">
            <span>{game.turn - (game.playerPlaysThisTurn?.reduce((s,p)=>s+p.energy,0) || 0)}</span>
          </div>
        </div>

        {/* CPU pill — right column, flipped */}
        <div className={`player-pill${game.priority === "ai" ? " has-priority" : ""}`}
          style={{flexDirection:"row-reverse", justifySelf:"end"}}>
          <div className="player-avatar">🤖</div>
          <div className="player-name-block" style={{alignItems:"flex-end"}}>
            <div className="player-name">CPU</div>
            <div className="hand-count">{game.aiHand?.length ?? 0} 🃏</div>
          </div>
        </div>
      </div>

      {/* Turn label — equidistant between diamond and card lanes */}
      <div className="turn-label">TURN {game.turn} / {TURNS}</div>

      {/* Daredevil peek — turn 5, show what CPU will play this turn */}
      {game._daredevilActive && game.turn === 5 && inPlay && (
        <div style={{
          background:"rgba(255,95,186,0.15)", borderBottom:"1px solid rgba(255,95,186,0.35)",
          padding:"4px 12px", display:"flex", alignItems:"center", gap:8,
          fontFamily:"var(--f-display)", fontSize:"0.72rem", color:"#ff5fba",
          letterSpacing:"0.07em", flexShrink:0,
        }}>
          👁 DAREDEVIL — CPU has {game.aiHand?.length ?? 0} cards · {game.aiHand?.reduce((s,c)=>s+(c.energy??c.clout),0) ?? 0} total energy
        </div>
      )}

      {/* Zones */}
      <div className="zones-row">
        {game.zones.map((zone, i) => {
          const isOverThis = dragOver === i && isDragging && inPlay;
          const isFull     = zone.pCards.length >= MAX_PER_SIDE;
          const zoneResult = results?.[i];
          return (
            <Zone
              key={zone.id} zone={zone} zoneRef={zoneRefs[i]} zoneIdx={i} state={game}
              dragOver={isOverThis && !isFull}
              dragBlocked={isOverThis && isFull}
              scoreChanged={changedZones.has(i)}
              revealedIds={new Set(game.revealedIds || [])}
              revealFx={revealFx && revealFx.zoneIdx === i ? revealFx : null}
              powerFx={powerFx.filter(d => d.zoneIdx === i)}
              onSelectCard={id => setSelected(p => p === id ? null : id)}
              playedThisTurnIds={new Set((game.playerPlaysThisTurn || []).map(p => p.cardId))}
              onDragPlayerCard={(e, cid) => startDrag(e, cid, "zone")}
              onUnplayCard={cid => unplayCard(cid)}
              draggingCardId={drag?.cardId}
              winnerGlow={inEnd && zoneResult?.winner === "player"}
            />
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="game-bottom">
        <button className="retreat-btn" onClick={onBack}>Retreat</button>
        <div className="status-hint">
          {inPlay && !isDragging && !game.playerPlay && "DRAG A CARD TO A LOCATION"}
          {inPlay && game.playerPlay && "TAP END TURN ▶"}
        </div>
        <button
          className={`end-turn-btn${(game.playerPlaysThisTurn?.length) ? " ready" : ""}`}
          onClick={handleEndTurn}
          disabled={!inPlay}
        >
          End Turn
          <div className="turn-counter">{game.turn} / {TURNS}</div>
        </button>
      </div>

      {/* Deck info pills — Snap-style deck / discard / destroyed buttons */}
      <div className="deck-info-row">
        <button className="deck-pill deck-pill-deck" onClick={() => setDeckPanel("deck")}>
          <span className="pill-icon">🂠</span>
          DECK
          <span className="pill-count">{game.playerDeck.length}</span>
        </button>
        <button className="deck-pill deck-pill-discard" onClick={() => setDeckPanel("discard")}>
          <span className="pill-icon">♻️</span>
          DISCARD
          <span className="pill-count">{(game.playerDiscard||[]).length}</span>
        </button>
        <button className="deck-pill deck-pill-destroy" onClick={() => setDeckPanel("destroyed")}>
          <span className="pill-icon">💀</span>
          DESTROYED
          <span className="pill-count">{(game.playerDestroyed||[]).length}</span>
        </button>
      </div>

      {/* Hand */}
      <div className="hand-area">
        <div className="hand-cards">
          {(() => {
            const spent  = (game.playerPlaysThisTurn || []).reduce((s, p) => s + p.energy, 0);
            const budget = game.turn;
            const remaining = budget - spent;
            const total = game.playerHand.length;
            // Dynamic slot width: shrink cards if hand is large, but never below 56px
            // Available width ≈ viewport - 24px margin. Cap card width at 92.
            const vw = (typeof window !== "undefined") ? window.innerWidth : 380;
            // Hand area is 148px tall, cards are 1:1.4 ratio → max card height ~128px → max width ~91px
            // Shrink uniformly so all cards fit side by side with gap
            const maxW = Math.floor((vw - 24 - (Math.max(total,1)-1)*4) / Math.max(total,1));
            const slotW = Math.max(52, Math.min(88, maxW));
            return game.playerHand.map((card, i) => {
              const isSelected = selected === card.id;
              const isDragged  = drag?.cardId === card.id;
              const destroyedCt = (game.playerDestroyed || []).length;
              const hasDeathCard = game.zones.some(z=>z.pCards.some(c=>c.snapName==="Death")) || game.playerHand.some(c=>c.snapName==="Death");
              const cost       = hasDeathCard ? deathReducedCost(card, destroyedCt) : (card.energy ?? card.clout);
              const affordable = cost <= remaining;
              return (
                <div
                  key={card.id}
                  className="hand-slot"
                  style={{
                    "--slot-w": slotW + "px",
                    zIndex: isSelected || isDragged ? 60 : i,
                  }}
                >
                  <CardView
                    card={card}
                    selected={isSelected}
                    playing={playingId === card.id}
                    showName
                    style={{
                      opacity: isDragged ? 0.3 : (affordable ? 1 : 0.42),
                      filter: affordable ? undefined : "grayscale(0.6)",
                      transition: "opacity 0.15s, filter 0.15s, transform 0.2s",
                    }}
                    onPointerDown={e => startDrag(e, card.id)}
                  />
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Drag ghost — follows finger/cursor */}
      {drag && (() => {
        let c = game.playerHand.find(x => x.id === drag.cardId);
        if (!c) for (const z of game.zones) { c = z.pCards.find(x => x.id === drag.cardId); if (c) break; }
        return c ? <DragGhost card={c} x={drag.x} y={drag.y} /> : null;
      })()}

      {/* Move-effect overlays — one per Snap-triggered move */}
      {moveFx.map(ev => <MoveEffect key={ev._id} event={ev} zoneRefs={zoneRefs} />)}

      {/* Card popup on tap — works for hand cards, zone cards (player & AI) */}
      {selectedCard && !drag && (() => {
        const isUncommitted = inPlay &&
          (game.playerPlaysThisTurn || []).some(p => p.cardId === selected);
        return (
          <CardPopup
            card={selectedCard}
            onDismiss={() => setSelected(null)}
            playable={selectedInHand && inPlay}
            onUnplay={isUncommitted ? () => { unplayCard(selected); setSelected(null); } : null}
          />
        );
      })()}

      {/* Shuffle / deal animation shown on game start */}
      {inShuffle && (
        <ShuffleOverlay
          deckSize={(game._fullPlayerDeck||game.playerDeck).length}
          onDone={handleShuffleDone}
        />
      )}

      {/* Deck info panel drawers */}
      {deckPanel === "deck" && (
        <DeckPanel
          title="Your Deck"
          icon="🂠"
          cards={game.playerDeck}
          onClose={() => setDeckPanel(null)}
        />
      )}
      {deckPanel === "discard" && (
        <DeckPanel
          title="Discard Pile"
          icon="♻️"
          cards={game.playerDiscard || []}
          onClose={() => setDeckPanel(null)}
        />
      )}
      {deckPanel === "destroyed" && (
        <DeckPanel
          title="Destroyed"
          icon="💀"
          cards={game.playerDestroyed || []}
          onClose={() => setDeckPanel(null)}
        />
      )}

      {/* End game overlay */}
      {inEnd && (
        <>
          {overallWinner === "player" && <Confetti />}
          <div className="result-overlay">
            <div className="result-card">
              <div className="result-title">
                {overallWinner === "player" ? "🎉 Victory!" : overallWinner === "ai" ? "💀 Defeated" : "🤝 Draw"}
              </div>
              <div className="result-sub">{pWins} – {aWins} Rifts</div>
              <div className="result-actions">
                <button className="btn btn-primary" onClick={() => { setGame(initGame(cards)); setSelected(null); }}>Play Again</button>
                <button className="btn btn-secondary" onClick={onBack}>Home</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Deck helpers ─────────────────────────────────────────────────────────────
function loadDecks() {
  try { return JSON.parse(localStorage.getItem(DECKS_KEY) || "null") || []; } catch { return []; }
}
function saveDecks(decks) {
  try { localStorage.setItem(DECKS_KEY, JSON.stringify(decks)); } catch {}
}
function makeRandomDeck(allCards) {
  return shuffle([...allCards]).slice(0, 12).map(c => c.id);
}

// ─── DeckBuilderScreen ────────────────────────────────────────────────────────
function DeckBuilderScreen({ deck, allCards, onSave, onBack }) {
  const [name,    setName]    = useState(deck?.name    || "New Deck");
  const [cardIds, setCardIds] = useState(deck?.cardIds || []);

  const toggle = id => {
    setCardIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 12) return prev; // cap at 12
      return [...prev, id];
    });
  };

  const handleSave = () => {
    onSave({ ...deck, name: name.trim() || "Deck", cardIds, id: deck?.id || uid() });
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <input
          value={name} onChange={e => setName(e.target.value)}
          style={{flex:1,background:"transparent",border:"none",color:"var(--text)",fontSize:"1.1rem",fontWeight:700,outline:"none",textAlign:"center"}}
          maxLength={20}
        />
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
      </div>
      <div className="deck-builder-bar">
        <span className="deck-bar-count">{cardIds.length}/12 cards selected</span>
        <button className="btn btn-sm btn-secondary" onClick={() => setCardIds(makeRandomDeck(allCards))}>🎲 Random</button>
        <button className="btn btn-sm btn-danger" onClick={() => setCardIds([])}>Clear</button>
      </div>
      <div className="deck-builder-grid">
        {allCards.map(card => {
          const inDeck = cardIds.includes(card.id);
          const hue = hueOf(card);
          return (
            <div key={card.id} className="deck-builder-slot" onClick={() => toggle(card.id)}>
              <div className={`coll-card${inDeck?" in-deck":""}`} style={{"--ch":hue}}>
                {card.imageUrl
                  ? <img className="coll-card-art" src={card.imageUrl} alt={card.name} />
                  : <div className="coll-card-emoji">{emojiOf(hue)}</div>}
                <div className="coll-card-overlay"/>
                <div className="coll-card-badge">{card.clout}</div>
                <div className="coll-card-energy">{card.energy ?? card.clout}</div>
                <div className="coll-card-name">{card.name}</div>
              </div>
              {inDeck && <div className="deck-count-badge">✓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DeckSelectScreen ─────────────────────────────────────────────────────────
const DECK_ICONS = ["⚔️","🔮","💀","🌀","🎭","🦅"];
const DEFAULT_DECKS = [
  { id:"deck1", name:"Deck 1", cardIds:[] },
  { id:"deck2", name:"Deck 2", cardIds:[] },
  { id:"deck3", name:"Deck 3", cardIds:[] },
];

function DeckSelectScreen({ allCards, onPlay, onBack }) {
  const [decks,    setDecks]    = useState(() => {
    const saved = loadDecks();
    // Merge saved over defaults (keep 3 slots)
    return DEFAULT_DECKS.map(d => saved.find(s => s.id === d.id) || d);
  });
  const [selected,  setSelected]  = useState(null);  // deck id
  const [building,  setBuilding]  = useState(null);  // deck being edited

  const persistAndSet = updated => {
    setDecks(updated);
    saveDecks(updated);
  };

  const handleSaveDeck = deck => {
    const updated = decks.map(d => d.id === deck.id ? deck : d);
    persistAndSet(updated);
    setBuilding(null);
  };

  const resolveCards = (cardIds, allCards) => {
    // Get actual card objects for the deck; pad with randoms if < 12
    let picked = cardIds.map(id => allCards.find(c => c.id === id)).filter(Boolean);
    if (picked.length < 12) {
      const used = new Set(picked.map(c => c.id));
      const pool = shuffle(allCards.filter(c => !used.has(c.id)));
      while (picked.length < 12 && pool.length) picked.push(pool.shift());
    }
    return shuffle(picked.slice(0, 12));
  };

  if (building) {
    return (
      <DeckBuilderScreen
        deck={building}
        allCards={allCards}
        onSave={handleSaveDeck}
        onBack={() => setBuilding(null)}
      />
    );
  }

  const canPlay = !!selected;
  const handlePlay = () => {
    if (!selected) return;
    const deck = decks.find(d => d.id === selected);
    const deckCards = resolveCards(deck?.cardIds || [], allCards);
    onPlay(deckCards);
  };
  const handleRandom = () => {
    onPlay(shuffle([...allCards]).slice(0,12));
  };

  return (
    <div className="screen deck-select-screen">
      <div className="deck-select-header">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <span className="deck-select-title">Choose Your Deck</span>
      </div>

      <div className="deck-list">
        {/* Random deck option */}
        <div className="deck-card" onClick={handleRandom} style={{background:"linear-gradient(135deg,rgba(112,64,240,0.2),rgba(160,112,255,0.1))"}}>
          <div className="deck-card-icon">🎲</div>
          <div className="deck-card-info">
            <div className="deck-card-name">Random Deck</div>
            <div className="deck-card-sub">12 random cards — pure chaos</div>
          </div>
          <button className="btn btn-primary btn-sm">Play</button>
        </div>

        {/* 3 saved decks */}
        {decks.map((deck, i) => {
          const deckCards = (deck.cardIds || []).map(id => allCards.find(c => c.id === id)).filter(Boolean);
          const isSelected = selected === deck.id;
          return (
            <div key={deck.id} className={`deck-card${isSelected?" deck-selected":""}`}
              onClick={() => setSelected(p => p === deck.id ? null : deck.id)}>
              <div className="deck-card-icon">{DECK_ICONS[i]}</div>
              <div className="deck-card-info">
                <div className="deck-card-name">{deck.name}</div>
                <div className="deck-card-sub">
                  {deckCards.length > 0
                    ? `${deckCards.length} cards · avg ${(deckCards.reduce((s,c)=>s+(c.energy??c.clout),0)/deckCards.length).toFixed(1)} energy`
                    : "Empty — tap Edit to build"}
                </div>
              </div>
              <div className="deck-card-actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn-sm btn-secondary"
                  onClick={() => setBuilding(deck)}>Edit</button>
              </div>
            </div>
          );
        })}
      </div>

      {canPlay && (
        <div className="deck-play-bar">
          <button className="btn btn-primary" style={{width:"100%",padding:"14px"}} onClick={handlePlay}>
            ▶ Play with {decks.find(d=>d.id===selected)?.name}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── LoadingScreen ─────────────────────────────────────────────────────────────
const LOADING_LINES = [
  "Initializing interdimensional portals...",
  "Bribing Detective Scrotum...",
  "Inflating Buttermilk Androgyna...",
  "Calibrating Mr. Plaigan's drain...",
  "Waking Sleepy Butterson...",
  "Counting Bonald Brum's brain cells...",
  "Negotiating with Goblin Addict...",
  "Locating Souvenir Cheeseburger...",
  "Loading ZANY card data...",
  "Preparing interdimensional battlefield...",
  "Shuffling 77 degenerates...",
  "Almost ready...",
];
function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [lineIdx, setLineIdx]   = useState(0);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) { p = 100; clearInterval(interval); setTimeout(onDone, 400); }
      setProgress(Math.min(p, 100));
      setLineIdx(Math.floor((Math.min(p, 99) / 100) * LOADING_LINES.length));
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:32,
      background:"radial-gradient(ellipse at 50% 55%, #16082e 0%, #05050f 68%)",
      padding:"0 40px",
    }}>
      <div style={{textAlign:"center"}}>
        <div style={{
          fontSize:"clamp(5rem,22vw,10rem)", fontWeight:700, lineHeight:0.9,
          color:"#b4ff4f", letterSpacing:"-0.03em",
          textShadow:"0 0 50px rgba(180,255,79,0.45),0 0 120px rgba(180,255,79,0.18)",
        }}>ZANY</div>
        <div style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.35)",marginTop:8,letterSpacing:"0.12em"}}>
          INTERDIMENSIONAL CARD BATTLES
        </div>
      </div>
      <div style={{width:"100%", maxWidth:280, display:"flex", flexDirection:"column", gap:10}}>
        {/* Progress bar */}
        <div style={{height:4, background:"rgba(255,255,255,0.1)", borderRadius:2, overflow:"hidden"}}>
          <div style={{
            height:"100%", borderRadius:2,
            background:"linear-gradient(90deg,#7040f0,#b4ff4f)",
            width:`${progress}%`,
            transition:"width 0.18s ease-out",
            boxShadow:"0 0 12px rgba(180,255,79,0.6)",
          }}/>
        </div>
        {/* Flavor loading text */}
        <div style={{
          fontFamily:"var(--f-mono,monospace)", fontSize:"0.62rem",
          color:"rgba(255,255,255,0.4)", letterSpacing:"0.05em",
          textAlign:"center", minHeight:"1.2em",
        }}>
          {LOADING_LINES[lineIdx] || "Loading..."}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    const s = document.createElement("style"); s.textContent = GLOBAL_CSS; document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // On first load: seed from spreadsheet cards.
  // We MERGE the SPREADSHEET data with stored data:
  //   - Stats (energy/clout/abilityId/flavor) ALWAYS come from SPREADSHEET_CARDS
  //     so balance changes flow to existing users without a manual cache clear.
  //   - User-uploaded imageUrl is preserved if they edited it via the editor.
  const [cards, setCards] = useState(() => {
    try {
      // One-time cleanup: drop the old v1 cache
      if (typeof STORAGE_KEY_OLD !== "undefined") localStorage.removeItem(STORAGE_KEY_OLD);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      const userImgs = {};
      const userExtra = {};
      if (stored && stored.length > 0) {
        stored.forEach(c => {
          // Preserve images the user has uploaded (anything not in CARD_IMAGES baseline)
          if (c.imageUrl && c.imageUrl !== CARD_IMAGES[c.id]) userImgs[c.id] = c.imageUrl;
          // Preserve any user-added cards not in SPREADSHEET_CARDS
          userExtra[c.id] = c;
        });
      }
      const merged = SPREADSHEET_CARDS.map(c => ({
        ...c,
        imageUrl: userImgs[c.id] || CARD_IMAGES[c.id] || c.imageUrl || null,
      }));
      // Append any user-added cards (IDs not in SPREADSHEET_CARDS)
      const baseIds = new Set(SPREADSHEET_CARDS.map(c => c.id));
      Object.values(userExtra).forEach(c => { if (!baseIds.has(c.id)) merged.push(c); });
      return merged;
    } catch {
      return SPREADSHEET_CARDS;
    }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); }, [cards]);

  const [screen,    setScreen]    = useState("home");
  const [editing,   setEditing]   = useState(null);
  const [loaded,    setLoaded]    = useState(false);
  const [deckCards, setDeckCards] = useState(null);

  if (!loaded) return <LoadingScreen onDone={() => setLoaded(true)} />;

  const saveCard   = card => { setCards(prev => { const i = prev.findIndex(c => c.id===card.id); return i!==-1 ? prev.map((c,j)=>j===i?card:c) : [...prev,card]; }); setScreen("collection"); setEditing(null); };
  const deleteCard = id   => setCards(prev => prev.filter(c => c.id !== id));
  const handlePlay = (chosenDeck) => { setDeckCards(chosenDeck || null); setScreen("game"); };

  if (screen==="game")       return <GameScreen cards={cards} deckCards={deckCards} onBack={() => setScreen("home")} />;
  if (screen==="deckselect") return <DeckSelectScreen allCards={cards} onPlay={handlePlay} onBack={() => setScreen("home")} />;
  if (screen==="collection") return <CollectionScreen cards={cards} onBack={() => setScreen("home")} onNew={() => { setEditing(null); setScreen("editor"); }} onEdit={c => { setEditing(c); setScreen("editor"); }} onDelete={deleteCard} />;
  if (screen==="editor")     return <CardEditorScreen card={editing} onSave={saveCard} onBack={() => setScreen("collection")} />;
  return <HomeScreen onPlay={() => setScreen("deckselect")} onCollection={() => setScreen("collection")} />;
}
