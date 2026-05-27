// ════════════════════════════════════════════════════════════════════
// game/snapHelpers.js — Low-level helpers used by SNAP_HANDLERS.
// Keep these pure (no React, no UI concerns).
// ════════════════════════════════════════════════════════════════════

import { MAX_PER_SIDE } from "../constants";

// ─── MOVE ────────────────────────────────────────────────────────────
// Move a card between two zones on the same side.
// Returns true if the move succeeded.
export function _moveCard(state, side, cardId, fromZ, toZ) {
  if (fromZ === toZ) return false;
  const sideKey = side === "player" ? "pCards" : "aCards";
  const fromArr = state.zones[fromZ][sideKey];
  const idx = fromArr.findIndex(c => c.id === cardId);
  if (idx === -1) return false;
  // Colossus: immune cards can't be moved
  if (fromArr[idx]._immune) return false;
  const toArr = state.zones[toZ][sideKey];
  if (toArr.length >= MAX_PER_SIDE) return false;
  const moved = fromArr.splice(idx, 1)[0];
  // Human Torch: doubles power when moved
  if (moved._humanTorch) moved.clout = moved.clout * 2;
  // Dagger: +2 power per enemy card at the destination
  if (moved.snapName === "Dagger") {
    const oppKey = side === "player" ? "aCards" : "pCards";
    moved.clout += state.zones[toZ][oppKey].length * 2;
  }
  toArr.push(moved);
  // Kraven: +2 when any card moves here (checks both sides of destination zone)
  for (const sk of ["pCards", "aCards"]) {
    for (const c of state.zones[toZ][sk]) {
      if (c.snapName === "Kraven" && c.id !== moved.id) c.clout += 2;
    }
  }
  return true;
}

// ─── DESTROY CHECK ───────────────────────────────────────────────────
// Returns true if a card can legally be destroyed.
// Checks Armor zone flag and Colossus _immune.
export function _canDestroy(state, side, zoneIdx, cardId) {
  const sideKey = side === "player" ? "pCards" : "aCards";
  const card = state.zones[zoneIdx][sideKey].find(c => c.id === cardId);
  if (!card) return false;
  if (card._immune) return false; // Colossus
  const armorSide = state.zones[zoneIdx]._armorSide;
  if (armorSide === side) return false; // Armor protects this side
  return true;
}

// ─── PICK AWAY ZONE ──────────────────────────────────────────────────
// Find the best destination zone for a "move away" effect —
// lowest population zone that isn't the source and has room.
export function _pickAwayZone(state, side, fromZ) {
  const sideKey = side === "player" ? "pCards" : "aCards";
  const candidates = [0, 1, 2]
    .filter(i => i !== fromZ && state.zones[i][sideKey].length < MAX_PER_SIDE);
  if (!candidates.length) return -1;
  candidates.sort((a, b) => state.zones[a][sideKey].length - state.zones[b][sideKey].length);
  return candidates[0];
}

// ─── POWER SNAPSHOT / DIFF ───────────────────────────────────────────
// Snapshot every in-play card's power so we can diff before/after a
// handler runs and display floating +N / -N labels on each affected card.

export function _snapshotPowers(state) {
  const m = new Map();
  for (let z = 0; z < state.zones.length; z++) {
    for (const c of state.zones[z].pCards) m.set(c.id, { z, side: "player", clout: c.clout });
    for (const c of state.zones[z].aCards) m.set(c.id, { z, side: "ai",     clout: c.clout });
  }
  return m;
}

// Called after a card is discarded — handles Apocalypse/Wolverine respawn.
export function _afterDiscard(state, card, isPlayer) {
  const hand    = isPlayer ? state.playerHand    : state.aiHand;
  const discard = isPlayer ? state.playerDiscard : state.aiDiscard;
  if (card.snapName === "Apocalypse") {
    discard.pop(); // undo the push that just happened
    hand.push({ ...card, clout: card.clout + 4 });
  }
  if (card._wolverine) {
    hand.push({ ...card, clout: card.clout + 2 });
  }
}

// Called after a card is destroyed — handles Deadpool/Wolverine respawn.
export function _afterDestroy(state, card, isPlayer) {
  const hand = isPlayer ? state.playerHand : state.aiHand;
  if (card._deadpool) {
    hand.push({ ...card, clout: card.clout * 2 });
  }
  if (card._wolverine) {
    hand.push({ ...card, clout: card.clout + 2 });
  }
}

export function _diffPowers(before, after) {
  const deltas = [];
  for (const [id, a] of after) {
    const b = before.get(id);
    if (!b || b.clout === a.clout) continue;
    deltas.push({ cardId: id, side: a.side, zoneIdx: a.z, delta: a.clout - b.clout });
  }
  return deltas;
}
