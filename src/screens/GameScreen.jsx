// ════════════════════════════════════════════════════════════════════
// screens/GameScreen.jsx — Main game screen
// ════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { TURNS, MAX_PER_SIDE, DEBUG_DRAG, HAND_SIZE } from "../constants";
import {
  initGame, applyReveal,
  zonePower, klawBonusForZone, deathReducedCost,
  computePriority, computeWinner, getResults,
} from "../game/gameLogic";
import { _snapshotPowers, _diffPowers } from "../game/snapHelpers";
import { _moveCard } from "../game/snapHelpers";
import { CardView } from "../components/CardView";
import { Zone } from "../components/Zone";
import { DragGhost } from "../components/DragGhost";
import { DeckPanel } from "../components/DeckPanel";
import { ShuffleOverlay } from "../components/ShuffleOverlay";
import { Confetti } from "../components/Confetti";
import { MoveEffect } from "../components/effects/MoveEffect";
import { CardPopup } from "../components/CardPopup";

export function GameScreen({ cards, deckCards, onBack }) {
  const [game, setGame]         = useState(() => initGame(deckCards || cards));
  const [selected, setSelected] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [deckPanel, setDeckPanel] = useState(null);
  const [drag, setDrag]           = useState(null);
  const [dragOver, setDragOver]   = useState(null);
  const [debugLog, setDebugLog]   = useState("idle");
  const [revealFx, setRevealFx]   = useState(null);
  const [moveFx,   setMoveFx]     = useState([]);
  const [powerFx,  setPowerFx]    = useState([]);
  const zoneRefs = [useRef(), useRef(), useRef()];
  const dragRef  = useRef(null);

  const inPlay    = game.phase === "play";
  const inEnd     = game.phase === "end";
  const inShuffle = game.phase === "shuffle";

  const handleShuffleDone = () => {
    setGame(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      s.playerHand = s.playerDeck.slice(0, HAND_SIZE);
      s.playerDeck = s.playerDeck.slice(HAND_SIZE);
      s.phase = "play";
      return s;
    });
  };

  // ── Reveal sequencer ───────────────────────────────────────────────
  useEffect(() => {
    if (game.phase !== "reveal") return;
    const playerQ = (game.playerPlaysThisTurn || []).map(p => ({ ...p, isPlayer: true }));
    const aiQ     = (game.aiPlaysThisTurn     || []).map(p => ({ ...p, isPlayer: false }));
    const queue   = (game.priority === "player") ? [...playerQ, ...aiQ] : [...aiQ, ...playerQ];
    let cancelled = false;
    const timeouts = [];
    let delay = 500;
    const flipTime = 700;

    queue.forEach((play) => {
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
          const before = _snapshotPowers(s);
          const result = applyReveal(card, play.zoneIdx, s, play.isPlayer);
          const after  = _snapshotPowers(result.state);
          const powerDeltas = _diffPowers(before, after);
          setTimeout(() => {
            setRevealFx({ cardId: play.cardId, snapName: card.snapName || "", zoneIdx: play.zoneIdx, isPlayer: play.isPlayer });
          }, 220);
          if (result.fx && result.fx.length) {
            result.fx.forEach((ev, mi) => {
              const evWithId = { ...ev, _id: Date.now() + mi };
              setTimeout(() => setMoveFx(prev => [...prev, evWithId]), 380 + mi * 140);
              setTimeout(() => setMoveFx(prev => prev.filter(m => m._id !== evWithId._id)), 1500 + mi * 140);
            });
          }
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
      timeouts.push(setTimeout(() => { if (!cancelled) setRevealFx(null); }, delay + 750));
      delay += flipTime;
    });

    timeouts.push(setTimeout(() => {
      if (cancelled) return;
      setGame(prev => {
        let s = JSON.parse(JSON.stringify(prev));
        s.playerPlaysThisTurn = [];
        s.aiPlaysThisTurn = [];
        s.priority = computePriority(s, s.priority);
        if (s.turn >= TURNS) {
          // Captain Marvel: move to winning location
          if (s._captainMarvelCardId) {
            const cmId = s._captainMarvelCardId;
            let cmZone = -1;
            for (let z = 0; z < 3; z++) { if (s.zones[z].pCards.some(c => c.id === cmId)) { cmZone = z; break; } }
            if (cmZone >= 0) {
              const scores = s.zones.map((z, zi) => ({
                zi,
                pp: zonePower(z.pCards, s, true, zi)  + klawBonusForZone(s, true,  zi),
                ap: zonePower(z.aCards, s, false, zi) + klawBonusForZone(s, false, zi),
              }));
              const losing = scores.filter(sc => sc.pp <= sc.ap && sc.zi !== cmZone).sort((a, b) => b.ap - a.ap);
              if (losing.length) _moveCard(s, "player", cmId, cmZone, losing[0].zi);
            }
          }
          // Dracula: discard highest-power hand card, gain its power
          if (s._draculaCardId) {
            const dcId = s._draculaCardId;
            let dcZone = -1;
            for (let z = 0; z < 3; z++) { if (s.zones[z].pCards.some(c => c.id === dcId)) { dcZone = z; break; } }
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
          s.phase = "end";
        } else {
          s.turn += 1; s.phase = "play";
          const draws = 1 + (s.bonusDraw || 0); s.bonusDraw = 0;
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

  // ── Zone score pulse tracker ───────────────────────────────────────
  const prevScoresRef = useRef([null, null, null]);
  const [changedZones, setChangedZones] = useState(new Set());
  useEffect(() => {
    const newChanged = new Set();
    game.zones.forEach((z, i) => {
      const sig = `${zonePower(z.pCards, game, true, i) + klawBonusForZone(game, true, i)}|${zonePower(z.aCards, game, false, i) + klawBonusForZone(game, false, i)}`;
      if (prevScoresRef.current[i] !== null && prevScoresRef.current[i] !== sig) newChanged.add(i);
      prevScoresRef.current[i] = sig;
    });
    if (newChanged.size > 0) {
      setChangedZones(newChanged);
      const t = setTimeout(() => setChangedZones(new Set()), 600);
      return () => clearTimeout(t);
    }
  }, [game.zones]);

  // ── Hit-test ───────────────────────────────────────────────────────
  const hitZone = (x, y) => {
    if (typeof window === "undefined") return null;
    const w = window.innerWidth, h = window.innerHeight;
    if (y < 40 || y > h - 120) return null;
    if (x < w / 3)     return 0;
    if (x < w * 2 / 3) return 1;
    return 2;
  };

  // ── Unplay ─────────────────────────────────────────────────────────
  const unplayCard = (cardId) => {
    setGame(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      if (!(s.playerPlaysThisTurn || []).some(p => p.cardId === cardId)) return prev;
      let fromZone = -1;
      for (let i = 0; i < s.zones.length; i++) { if (s.zones[i].pCards.some(c => c.id === cardId)) { fromZone = i; break; } }
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

  // ── Move zone card ─────────────────────────────────────────────────
  const moveCard = (cardId, toZone) => {
    setGame(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      let fromZone = -1;
      for (let i = 0; i < s.zones.length; i++) { if (s.zones[i].pCards.some(c => c.id === cardId)) { fromZone = i; break; } }
      if (fromZone === -1 || fromZone === toZone) return prev;
      if (s.zones[toZone].pCards.length >= MAX_PER_SIDE) return prev;
      const ci = s.zones[fromZone].pCards.findIndex(c => c.id === cardId);
      const card = s.zones[fromZone].pCards.splice(ci, 1)[0];
      s.zones[toZone].pCards.push(card);
      s.playerPlaysThisTurn = (s.playerPlaysThisTurn || []).map(p => p.cardId === cardId ? { ...p, zoneIdx: toZone } : p);
      return s;
    });
    setDebugLog(`Moved to zone ${toZone}`);
  };

  // ── Place card ─────────────────────────────────────────────────────
  const placeCard = (cardId, zoneIdx) => {
    if (!inPlay) return;
    const card = game.playerHand.find(c => c.id === cardId);
    if (!card) return;
    const destroyedCount = (game.playerDestroyed || []).length;
    const hasDeath = (game.playerHand || []).some(c => c.snapName === "Death") || game.zones.some(z => z.pCards.some(c => c.snapName === "Death"));
    const cost   = hasDeath ? deathReducedCost(card, destroyedCount) : (card.energy ?? card.clout);
    const spent  = (game.playerPlaysThisTurn || []).reduce((s, p) => s + p.energy, 0);
    if (cost > game.turn - spent) { setDebugLog(`Need ${cost} Flux — only ${game.turn - spent} left`); return; }
    if (game.zones[zoneIdx].pCards.length >= MAX_PER_SIDE) { setDebugLog(`Location full (${MAX_PER_SIDE} max)`); return; }
    setSelected(null);
    setPlayingId(cardId);
    setGame(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      const ci = s.playerHand.findIndex(c => c.id === cardId);
      if (ci === -1) return prev;
      const placed = s.playerHand.splice(ci, 1)[0];
      s.zones[zoneIdx].pCards.push(placed);
      s.playerPlaysThisTurn = [...(s.playerPlaysThisTurn || []), { cardId, zoneIdx, energy: cost }];
      return s;
    });
    setTimeout(() => setPlayingId(null), 400);
  };

  // ── Drag ───────────────────────────────────────────────────────────
  const startDrag = (e, cardId, source = "hand") => {
    if (inEnd) { setDebugLog(`Game over`); return; }
    const startX = e.clientX, startY = e.clientY;
    const TAP_THRESHOLD = 15;
    let moved = false, lastEv = null;
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
      if (moved) { const zi = hitZone(x, y); setDragOver(zi); setDebugLog(`MOVE ${x|0},${y|0} zone=${zi !== null ? zi : "none"}`); }
    };

    const onEnd = ev => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      const x = ev.clientX || lastEv?.clientX || startX;
      const y = ev.clientY || lastEv?.clientY || startY;
      const zi = moved ? hitZone(x, y) : null;
      setDebugLog(`UP ${x|0},${y|0} moved=${moved} zone=${zi !== null ? zi : "none"}`);
      dragRef.current = null; setDrag(null); setDragOver(null);
      if (!moved) {
        setSelected(p => p === cardId ? null : cardId);
      } else if (source === "hand") {
        if (zi !== null) {
          const card = game.playerHand.find(c => c.id === cardId);
          if (!card) { setDebugLog(`Not in hand`); return; }
          if (game.zones[zi].pCards.length >= MAX_PER_SIDE) { setDebugLog(`Location full (${MAX_PER_SIDE} max)`); return; }
          const cost  = card.energy ?? card.clout;
          const spent = (game.playerPlaysThisTurn || []).reduce((s, p) => s + p.energy, 0);
          if (cost > game.turn - spent) { setDebugLog(`Need ${cost} Flux — only ${game.turn - spent} left`); return; }
          if (!inPlay) { setDebugLog(`Wait for next turn`); return; }
          placeCard(cardId, zi);
        } else { setDebugLog(`Released outside`); }
      } else if (source === "zone") {
        if (!inPlay) { setDebugLog(`Wait for next turn`); return; }
        if (zi === null) unplayCard(cardId);
        else moveCard(cardId, zi);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  // ── End turn ───────────────────────────────────────────────────────
  const handleEndTurn = () => {
    if (!inPlay) return;
    setDebugLog("END TURN — AI playing, revealing in order");
    setGame(prev => {
      let s = JSON.parse(JSON.stringify(prev));
      const aiBudget = s.turn; let aiSpent = 0; const aiPlays = [];
      for (let attempt = 0; attempt < 3 && s.aiHand.length; attempt++) {
        const affordable = s.aiHand.filter(c => (c.energy ?? c.clout) <= aiBudget - aiSpent);
        if (!affordable.length) break;
        const openZones = [0, 1, 2].filter(zi => s.zones[zi].aCards.length < MAX_PER_SIDE);
        if (!openZones.length) break;
        const pick = affordable[Math.floor(Math.random() * affordable.length)];
        const zoneIdx = openZones[Math.floor(Math.random() * openZones.length)];
        const ci = s.aiHand.findIndex(c => c.id === pick.id); if (ci === -1) break;
        const card = s.aiHand.splice(ci, 1)[0];
        s.zones[zoneIdx].aCards.push(card);
        aiSpent += card.energy ?? card.clout;
        aiPlays.push({ cardId: card.id, zoneIdx });
      }
      s.aiPlaysThisTurn = aiPlays; s.phase = "reveal";
      return s;
    });
  };

  const results       = inEnd ? getResults(game) : null;
  const pWins         = results?.filter(r => r.winner === "player").length ?? 0;
  const aWins         = results?.filter(r => r.winner === "ai").length     ?? 0;
  const overallWinner = inEnd ? computeWinner(game) : null;

  const findCardAnywhere = id => {
    if (!id) return null;
    let c = game.playerHand.find(x => x.id === id); if (c) return c;
    for (const z of game.zones) { c = z.pCards.find(x => x.id === id) || z.aCards.find(x => x.id === id); if (c) return c; }
    return null;
  };
  const selectedCard   = findCardAnywhere(selected);
  const selectedInHand = selectedCard && game.playerHand.some(c => c.id === selected);
  const isDragging     = !!drag;

  return (
    <div className="screen game-screen">
      {DEBUG_DRAG && <div className={`debug-status${dragOver !== null ? " debug-hit" : ""}`}>{debugLog}</div>}

      {/* Top bar */}
      <div className="game-top">
        <div className={`player-pill${game.priority === "player" ? " has-priority" : ""}`}>
          <div className="player-avatar">🧑</div>
          <div className="player-name-block">
            <div className="player-name">YOU</div>
            <div className="hand-count">🃏 {game.playerHand?.length ?? 0}</div>
          </div>
        </div>
        <div className="energy-crystal">
          <div className="crystal-gem">
            <span>{game.turn - (game.playerPlaysThisTurn?.reduce((s,p)=>s+p.energy,0) || 0)}</span>
          </div>
        </div>
        <div className={`player-pill${game.priority === "ai" ? " has-priority" : ""}`} style={{flexDirection:"row-reverse",justifySelf:"end"}}>
          <div className="player-avatar">🤖</div>
          <div className="player-name-block" style={{alignItems:"flex-end"}}>
            <div className="player-name">CPU</div>
            <div className="hand-count">{game.aiHand?.length ?? 0} 🃏</div>
          </div>
        </div>
      </div>

      <div className="turn-label">TURN {game.turn} / {TURNS}</div>

      {game._daredevilActive && game.turn === 5 && inPlay && (
        <div style={{background:"rgba(255,95,186,0.15)",borderBottom:"1px solid rgba(255,95,186,0.35)",padding:"4px 12px",display:"flex",alignItems:"center",gap:8,fontFamily:"var(--f-display)",fontSize:"0.72rem",color:"#ff5fba",letterSpacing:"0.07em",flexShrink:0}}>
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
              dragOver={isOverThis && !isFull} dragBlocked={isOverThis && isFull}
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
        <button className={`end-turn-btn${(game.playerPlaysThisTurn?.length) ? " ready" : ""}`} onClick={handleEndTurn} disabled={!inPlay}>
          End Turn
          <div className="turn-counter">{game.turn} / {TURNS}</div>
        </button>
      </div>

      {/* Deck pills */}
      <div className="deck-info-row">
        <button className="deck-pill deck-pill-deck"    onClick={() => setDeckPanel("deck")}>     <span className="pill-icon">🂠</span>DECK      <span className="pill-count">{game.playerDeck.length}</span></button>
        <button className="deck-pill deck-pill-discard" onClick={() => setDeckPanel("discard")}>  <span className="pill-icon">♻️</span>DISCARD   <span className="pill-count">{(game.playerDiscard||[]).length}</span></button>
        <button className="deck-pill deck-pill-destroy" onClick={() => setDeckPanel("destroyed")}><span className="pill-icon">💀</span>DESTROYED <span className="pill-count">{(game.playerDestroyed||[]).length}</span></button>
      </div>

      {/* Hand */}
      <div className="hand-area">
        <div className="hand-cards">
          {(() => {
            const spent     = (game.playerPlaysThisTurn || []).reduce((s, p) => s + p.energy, 0);
            const remaining = game.turn - spent;
            const total     = game.playerHand.length;
            const vw        = typeof window !== "undefined" ? window.innerWidth : 380;
            const slotW     = Math.max(52, Math.min(88, Math.floor((vw - 24 - (Math.max(total,1)-1)*4) / Math.max(total,1))));
            return game.playerHand.map((card, i) => {
              const isSelected   = selected === card.id;
              const isDragged    = drag?.cardId === card.id;
              const destroyedCt  = (game.playerDestroyed || []).length;
              const hasDeathCard = game.zones.some(z=>z.pCards.some(c=>c.snapName==="Death")) || game.playerHand.some(c=>c.snapName==="Death");
              const cost         = hasDeathCard ? deathReducedCost(card, destroyedCt) : (card.energy ?? card.clout);
              const affordable   = cost <= remaining;
              return (
                <div key={card.id} className="hand-slot" style={{"--slot-w": slotW+"px", zIndex: isSelected||isDragged ? 60 : i}}>
                  <CardView card={card} selected={isSelected} playing={playingId === card.id} showName
                    style={{opacity: isDragged ? 0.3 : (affordable ? 1 : 0.42), filter: affordable ? undefined : "grayscale(0.6)", transition:"opacity 0.15s,filter 0.15s,transform 0.2s"}}
                    onPointerDown={e => startDrag(e, card.id)}
                  />
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Drag ghost */}
      {drag && (() => {
        let c = game.playerHand.find(x => x.id === drag.cardId);
        if (!c) for (const z of game.zones) { c = z.pCards.find(x => x.id === drag.cardId); if (c) break; }
        return c ? <DragGhost card={c} x={drag.x} y={drag.y} /> : null;
      })()}

      {moveFx.map(ev => <MoveEffect key={ev._id} event={ev} zoneRefs={zoneRefs} />)}

      {selectedCard && !drag && (() => {
        const isUncommitted = inPlay && (game.playerPlaysThisTurn || []).some(p => p.cardId === selected);
        return (
          <CardPopup card={selectedCard} onDismiss={() => setSelected(null)} playable={selectedInHand && inPlay}
            onUnplay={isUncommitted ? () => { unplayCard(selected); setSelected(null); } : null}
          />
        );
      })()}

      {inShuffle && <ShuffleOverlay deckSize={(game._fullPlayerDeck||game.playerDeck).length} onDone={handleShuffleDone} />}

      {deckPanel === "deck"      && <DeckPanel title="Your Deck"    icon="🂠" cards={game.playerDeck}            onClose={() => setDeckPanel(null)} />}
      {deckPanel === "discard"   && <DeckPanel title="Discard Pile" icon="♻️" cards={game.playerDiscard || []}   onClose={() => setDeckPanel(null)} />}
      {deckPanel === "destroyed" && <DeckPanel title="Destroyed"    icon="💀" cards={game.playerDestroyed || []} onClose={() => setDeckPanel(null)} />}

      {inEnd && (
        <>
          {overallWinner === "player" && <Confetti />}
          <div className="result-overlay">
            <div className="result-card">
              <div className="result-title">{overallWinner === "player" ? "🎉 Victory!" : overallWinner === "ai" ? "💀 Defeated" : "🤝 Draw"}</div>
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

export default GameScreen;
