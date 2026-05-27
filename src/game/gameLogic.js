// ════════════════════════════════════════════════════════════════════
// game/gameLogic.js — Pure game logic: utilities, state init, turn
// resolution, scoring. No React, no UI concerns.
// ════════════════════════════════════════════════════════════════════

import { TURNS, MAX_PER_SIDE, HAND_SIZE } from "../constants";
import { SPREADSHEET_CARDS } from "./cardData";
import SNAP_HANDLERS from "./snapHandlers";
import ZONES from "./zones";

// ─── Utilities ───────────────────────────────────────────────────────────────
export const uid     = () => Math.random().toString(36).slice(2, 9);
export const tiltOf  = card => (((card.id || "").charCodeAt(0) % 7) - 3) * 1.4;
export const hueOf   = card => ((card.name || "X").charCodeAt(0) * 47 + 180) % 360;
export const emojiOf = hue  => String.fromCodePoint(0x1F300 + (hue % 80));

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Deck building ────────────────────────────────────────────────────────────
export function buildDeck(playerCards) {
  const pool = [...playerCards];
  let i = 0;
  while (pool.length < 8) {
    pool.push({ ...SPREADSHEET_CARDS[i % SPREADSHEET_CARDS.length], id: uid() });
    i++;
  }
  return shuffle(pool.slice(0, 12));
}

export function initGame(playerCards) {
  const pDeck = buildDeck(playerCards);
  const aDeck = buildDeck(shuffle([...SPREADSHEET_CARDS]).slice(0, 12));
  return {
    turn: 1, phase: "shuffle", bonusDraw: 0,
    playerHand: [], playerDeck: pDeck,
    _fullPlayerDeck: pDeck,
    aiHand: aDeck.slice(0, HAND_SIZE), aiDeck: aDeck.slice(HAND_SIZE),
    playerDiscard: [], aiDiscard: [],
    playerDestroyed: [], aiDestroyed: [],
    zones: ZONES.map(z => ({ ...z, pCards: [], aCards: [] })),
    playerPlaysThisTurn: [],
    aiPlaysThisTurn: [],
    revealedIds: [],
    priority: Math.random() < 0.5 ? "player" : "ai",
  };
}

// ─── Reveal ───────────────────────────────────────────────────────────────────
export function applyReveal(card, zoneIdx, state, isPlayer) {
  let fx = [];

  // Cosmo blocks the card's On Reveal ability (not zone abilities)
  const cosmoBlocked = state.zones[zoneIdx]._cosmoActive &&
    state.zones[zoneIdx]._cosmoSide &&
    state.zones[zoneIdx]._cosmoSide !== (isPlayer ? "player" : "ai");

  if (!cosmoBlocked) {
    const handler = card.snapName && SNAP_HANDLERS[card.snapName];
    if (handler) {
      const result = handler(state, card, zoneIdx, isPlayer) || {};
      state = result.state || state;
      fx    = result.fx    || [];
    }
  }

  // ── Zone abilities (always fire, Cosmo does not block these) ──────────
  const sideKey = isPlayer ? "pCards" : "aCards";

  // The Vortex (z0): every card revealed here gains +1 Power
  if (zoneIdx === 0) {
    const c = state.zones[0][sideKey].find(x => x.id === card.id);
    if (c) c.clout += 1;
  }

  // The Fringe (z2): the first card revealed here gives its owner +1 draw
  if (zoneIdx === 2 && !state.zones[2]._fringeUsed) {
    state.zones[2]._fringeUsed = true;
    if (isPlayer) {
      state.bonusDraw = (state.bonusDraw || 0) + 1;
    } else {
      state._fringeAiDraw = true;
    }
  }

  return { state, fx };
}

// ─── Power calculation ────────────────────────────────────────────────────────

// displayClout: base power + Ongoing modifiers baked in at render time.
export function displayClout(card, myCards, state, isPlayer) {
  let c = card.clout;
  // Ka-Zar Ongoing: +1 to all 1-cost cards on your side (checks all zones cross-zone)
  if (card.energy === 1 && card.snapName !== "Ka-Zar") {
    let hasKazar = false;
    if (state && isPlayer !== undefined) {
      const sk = isPlayer ? "pCards" : "aCards";
      hasKazar = state.zones.some(z => z[sk].some(x => x.snapName === "Ka-Zar"));
    } else if (myCards) {
      hasKazar = myCards.some(x => x.snapName === "Ka-Zar");
    }
    if (hasKazar) c += 1;
  }
  return Math.max(0, c);
}

// zonePower: sum display power + cross-card Ongoing effects.
export function zonePower(cards, state, isPlayer, zIdx) {
  let base = cards.reduce((s, c) => s + displayClout(c, cards, state, isPlayer), 0);
  if (!state) return base;

  const sideKey = isPlayer ? "pCards" : "aCards";
  const oppKey  = isPlayer ? "aCards" : "pCards";

  // Glitch Alley (z1): lowest-power card(s) on each side get +2
  if (zIdx === 1 && cards.length) {
    const powers = cards.map(c => displayClout(c, cards, state, isPlayer));
    const minPow = Math.min(...powers);
    base += 2 * powers.filter(p => p === minPow).length;
  }

  // Iron Man Ongoing: double total power at this location
  if (cards.some(c => c.snapName === "Iron Man")) base = base * 2;

  // Blue Marvel Ongoing: +1 to all other cards everywhere (cross-zone)
  const totalBlueMarvels = state.zones.reduce((n, z) => n + z[sideKey].filter(c => c.snapName === "Blue Marvel").length, 0);
  if (totalBlueMarvels) base += totalBlueMarvels * cards.filter(c => c.snapName !== "Blue Marvel").length;

  // Punisher Ongoing: +1 per enemy card at this location
  if (cards.some(c => c.snapName === "Punisher") && zIdx !== undefined) {
    base += state.zones[zIdx][oppKey].length;
  }

  // Ant Man Ongoing: +4 when your side of this location is full
  if (cards.some(c => c.snapName === "Ant Man") && cards.length >= MAX_PER_SIDE) {
    base += 4;
  }

  return base;
}

// klawBonusForZone: +7 if Klaw is in the zone to the left
export function klawBonusForZone(state, isPlayer, zIdx) {
  if (zIdx === 0) return 0;
  const sideKey = isPlayer ? "pCards" : "aCards";
  return state.zones[zIdx - 1][sideKey].some(c => c.snapName === "Klaw") ? 7 : 0;
}

// deathReducedCost: card costs 1 less per destroyed card
export function deathReducedCost(card, destroyedCount) {
  if (!destroyedCount) return card.energy;
  return Math.max(0, (card.energy || 0) - destroyedCount);
}

// ─── Priority / winner ────────────────────────────────────────────────────────

// ════════════════════════════════════════════════════════════════════
// Marvel-Snap-style priority/winner calculation:
//   1. Whoever wins the most locations wins.
//   2. Tied locations → biggest winning margin at any single location.
//   3. Still tied → higher total power across all 3 zones.
//   4. Total tie → keep current priority (or random for first turn).
// ════════════════════════════════════════════════════════════════════
export function computePriority(state, current = null) {
  let pWins = 0, aWins = 0, pTotal = 0, aTotal = 0;
  let pBigMargin = 0, aBigMargin = 0;
  for (let zi = 0; zi < state.zones.length; zi++) {
    const z  = state.zones[zi];
    const pp = zonePower(z.pCards, state, true,  zi) + klawBonusForZone(state, true,  zi);
    const ap = zonePower(z.aCards, state, false, zi) + klawBonusForZone(state, false, zi);
    pTotal += pp; aTotal += ap;
    if (pp > ap) { pWins++; pBigMargin = Math.max(pBigMargin, pp - ap); }
    else if (ap > pp) { aWins++; aBigMargin = Math.max(aBigMargin, ap - pp); }
  }
  if (pWins !== aWins)           return pWins > aWins ? "player" : "ai";
  if (pBigMargin !== aBigMargin) return pBigMargin > aBigMargin ? "player" : "ai";
  if (pTotal !== aTotal)         return pTotal > aTotal ? "player" : "ai";
  return current || (Math.random() < 0.5 ? "player" : "ai");
}

// computeWinner: same rules but allows a true "draw" if everything ties.
export function computeWinner(state) {
  let pWins = 0, aWins = 0, pTotal = 0, aTotal = 0;
  let pBigMargin = 0, aBigMargin = 0;
  for (let zi = 0; zi < state.zones.length; zi++) {
    const z  = state.zones[zi];
    const pp = zonePower(z.pCards, state, true,  zi) + klawBonusForZone(state, true,  zi);
    const ap = zonePower(z.aCards, state, false, zi) + klawBonusForZone(state, false, zi);
    pTotal += pp; aTotal += ap;
    if (pp > ap) { pWins++; pBigMargin = Math.max(pBigMargin, pp - ap); }
    else if (ap > pp) { aWins++; aBigMargin = Math.max(aBigMargin, ap - pp); }
  }
  if (pWins !== aWins)           return pWins > aWins ? "player" : "ai";
  if (pBigMargin !== aBigMargin) return pBigMargin > aBigMargin ? "player" : "ai";
  if (pTotal !== aTotal)         return pTotal > aTotal ? "player" : "ai";
  return "draw";
}

// ─── Turn resolution ──────────────────────────────────────────────────────────
export function endTurnResolve(state) {
  let s = JSON.parse(JSON.stringify(state));

  // 1. AI plays as many cards as it can afford (greedy: random affordable)
  const aiBudget = s.turn;
  let aiSpent = 0;
  const aiPlays = [];
  for (let attempt = 0; attempt < 3 && s.aiHand.length; attempt++) {
    const affordable = s.aiHand.filter(c => (c.energy ?? c.clout) <= aiBudget - aiSpent);
    if (!affordable.length) break;
    const openZones = [0, 1, 2].filter(zi => s.zones[zi].aCards.length < MAX_PER_SIDE);
    if (!openZones.length) break;
    const pick    = affordable[Math.floor(Math.random() * affordable.length)];
    const zoneIdx = openZones[Math.floor(Math.random() * openZones.length)];
    const ci = s.aiHand.findIndex(c => c.id === pick.id);
    if (ci === -1) break;
    const card = s.aiHand.splice(ci, 1)[0];
    s.zones[zoneIdx].aCards.push(card);
    aiSpent += card.energy ?? card.clout;
    aiPlays.push({ cardId: card.id, zoneIdx });
  }

  // 2. Fire onReveal — player first, then AI, in placement order
  for (const p of (s.playerPlaysThisTurn || [])) {
    const card = s.zones[p.zoneIdx].pCards.find(c => c.id === p.cardId);
    if (card) s = applyReveal(card, p.zoneIdx, s, true).state;
  }
  for (const p of aiPlays) {
    const card = s.zones[p.zoneIdx].aCards.find(c => c.id === p.cardId);
    if (card) s = applyReveal(card, p.zoneIdx, s, false).state;
  }
  s.playerPlaysThisTurn = [];

  // 3. Advance turn or end game
  if (s.turn >= TURNS) {
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
}

export function getResults(state) {
  return state.zones.map((z, zi) => {
    const pp = zonePower(z.pCards, state, true,  zi) + klawBonusForZone(state, true,  zi);
    const ap = zonePower(z.aCards, state, false, zi) + klawBonusForZone(state, false, zi);
    return { pp, ap, winner: pp > ap ? "player" : ap > pp ? "ai" : "tie" };
  });
}

export function aiDecide(game) {
  if (!game.aiHand.length) return null;
  return {
    cardId:  game.aiHand[Math.floor(Math.random() * game.aiHand.length)].id,
    zoneIdx: Math.floor(Math.random() * 3),
  };
}
