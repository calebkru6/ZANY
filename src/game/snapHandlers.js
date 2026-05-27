// ════════════════════════════════════════════════════════════════════
// game/snapHandlers.js — On-reveal ability handlers for each Snap card.
// Handler signature: (state, card, zoneIdx, isPlayer) → { state, fx? }
// fx (optional): [{ type:"move", cardId, fromZone, toZone, side }, ...]
// Cards without a handler reveal silently.
// ════════════════════════════════════════════════════════════════════

import { MAX_PER_SIDE } from "../constants";
import { _moveCard, _canDestroy, _pickAwayZone, _afterDiscard, _afterDestroy } from "./snapHelpers";

// Inline helper — zone total power. Used by several handlers.
const zonePower = cards => cards.reduce((sum, c) => sum + c.clout, 0);

const SNAP_HANDLERS = {
  // ─── MOVEMENT ABILITIES ───────────────────────────────────────────

  "Aero": (s, card, zIdx, isPlayer) => {
    // Move opponent's last-played card to this zone (opponent side)
    const oppPlays = isPlayer ? (s.aiPlaysThisTurn || []) : (s.playerPlaysThisTurn || []);
    const last = oppPlays[oppPlays.length - 1];
    if (!last) return { state: s };
    const oppSide = isPlayer ? "ai" : "player";
    if (_moveCard(s, oppSide, last.cardId, last.zoneIdx, zIdx)) {
      return { state: s, fx: [{ type: "move", cardId: last.cardId, fromZone: last.zoneIdx, toZone: zIdx, side: oppSide }] };
    }
    return { state: s };
  },

  "Magneto": (s, card, zIdx, isPlayer) => {
    // Move all enemy 3 and 4-cost cards to this zone
    const oppSide = isPlayer ? "ai" : "player";
    const sideKey = oppSide === "player" ? "pCards" : "aCards";
    const moves = [];
    for (let z = 0; z < 3; z++) {
      if (z === zIdx) continue;
      const arr = [...s.zones[z][sideKey]];
      for (const c of arr) {
        if ((c.energy === 3 || c.energy === 4) && _moveCard(s, oppSide, c.id, z, zIdx)) {
          moves.push({ type: "move", cardId: c.id, fromZone: z, toZone: zIdx, side: oppSide });
        }
      }
    }
    return { state: s, fx: moves };
  },

  "Cannonball": (s, card, zIdx, isPlayer) => {
    // Move the highest-power enemy card here away
    const oppSide = isPlayer ? "ai" : "player";
    const sideKey = oppSide === "player" ? "pCards" : "aCards";
    const enemies = s.zones[zIdx][sideKey];
    if (!enemies.length) return { state: s };
    const target = enemies.slice().sort((a, b) => b.clout - a.clout)[0];
    const dest = _pickAwayZone(s, oppSide, zIdx);
    if (dest >= 0 && _moveCard(s, oppSide, target.id, zIdx, dest)) {
      return { state: s, fx: [{ type: "move", cardId: target.id, fromZone: zIdx, toZone: dest, side: oppSide }] };
    }
    return { state: s };
  },

  "Nocturne": (s, card, zIdx, isPlayer) => {
    // Move self once to a different random zone
    const side = isPlayer ? "player" : "ai";
    const dest = _pickAwayZone(s, side, zIdx);
    if (dest >= 0 && _moveCard(s, side, card.id, zIdx, dest)) {
      return { state: s, fx: [{ type: "move", cardId: card.id, fromZone: zIdx, toZone: dest, side }] };
    }
    return { state: s };
  },

  // ─── POWER BUFFS / DEBUFFS ────────────────────────────────────────

  "Black Panther": (s, card, zIdx, isPlayer) => {
    // Double this card's power
    const sideKey = isPlayer ? "pCards" : "aCards";
    const c = s.zones[zIdx][sideKey].find(x => x.id === card.id);
    if (c) c.clout = c.clout * 2;
    return { state: s };
  },

  "Silver Surfer": (s, card, zIdx, isPlayer) => {
    // +2 power to your other 3-cost cards across all zones
    const sideKey = isPlayer ? "pCards" : "aCards";
    for (const z of s.zones) {
      for (const c of z[sideKey]) {
        if (c.id !== card.id && c.energy === 3) c.clout += 2;
      }
    }
    return { state: s };
  },

  "Ant Man": (s) => ({ state: s }), // Ongoing: handled in zonePower (+4 when side is full)

  "Adam Warlock": (s, card, zIdx, isPlayer) => {
    // +1 power if not currently winning here (simplified end-of-turn check)
    const pp = zonePower(s.zones[zIdx].pCards);
    const ap = zonePower(s.zones[zIdx].aCards);
    const winning = isPlayer ? pp >= ap : ap >= pp;
    if (!winning) {
      const sideKey = isPlayer ? "pCards" : "aCards";
      const c = s.zones[zIdx][sideKey].find(x => x.id === card.id);
      if (c) c.clout += 1;
    }
    return { state: s };
  },

  "Nebula": (s, card, zIdx, isPlayer) => {
    // +2 power for itself (simplified per-turn buff)
    const sideKey = isPlayer ? "pCards" : "aCards";
    const c = s.zones[zIdx][sideKey].find(x => x.id === card.id);
    if (c) c.clout += 2;
    return { state: s };
  },

  "Gilgamesh": (s, card, zIdx, isPlayer) => {
    // +1 for each of your other cards in play
    const sideKey = isPlayer ? "pCards" : "aCards";
    let count = 0;
    for (const z of s.zones) for (const c of z[sideKey]) if (c.id !== card.id) count++;
    const c = s.zones[zIdx][sideKey].find(x => x.id === card.id);
    if (c) c.clout += count;
    return { state: s };
  },

  "Cassandra Nova": (s, card, zIdx, isPlayer) => {
    // Steal 1 power from each enemy card on the board
    const oppKey  = isPlayer ? "aCards" : "pCards";
    const sideKey = isPlayer ? "pCards" : "aCards";
    let stolen = 0;
    for (const z of s.zones) {
      for (const c of z[oppKey]) { c.clout = Math.max(0, c.clout - 1); stolen++; }
    }
    const me = s.zones[zIdx][sideKey].find(x => x.id === card.id);
    if (me) me.clout += stolen;
    return { state: s };
  },

  "Darkhawk": (s, card, zIdx, isPlayer) => {
    // +2 for each card in opponent's deck
    const deck    = isPlayer ? s.aiDeck : s.playerDeck;
    const sideKey = isPlayer ? "pCards" : "aCards";
    const c = s.zones[zIdx][sideKey].find(x => x.id === card.id);
    if (c) c.clout += 2 * deck.length;
    return { state: s };
  },

  "Elsa Bloodstone": (s, card, zIdx, isPlayer) => {
    // +2 to each of your cards at locations where your side is full
    const sideKey = isPlayer ? "pCards" : "aCards";
    for (const z of s.zones) {
      if (z[sideKey].length >= MAX_PER_SIDE) {
        for (const c of z[sideKey]) c.clout += 2;
      }
    }
    return { state: s };
  },

  "Doctor Doom": (s, card, zIdx, isPlayer) => {
    // Add a 5-Power DoomBot to each OTHER zone (your side, if there's room)
    const sideKey = isPlayer ? "pCards" : "aCards";
    let i = 0;
    for (let z = 0; z < s.zones.length; z++) {
      if (z === zIdx) continue;
      if (s.zones[z][sideKey].length < MAX_PER_SIDE) {
        s.zones[z][sideKey].push({
          id: `doombot-${Date.now()}-${i++}`,
          name: "DoomBot", energy: 0, clout: 5,
          snapName: "DoomBot", abilityText: "Created by Doctor Doom.",
          flavor: "", imageUrl: null,
        });
      }
    }
    return { state: s };
  },

  "The Living Tribunal": (s, card, zIdx, isPlayer) => {
    // Split your total power evenly across all 3 zones
    const sideKey = isPlayer ? "pCards" : "aCards";
    const total = s.zones.reduce((sum, z) => sum + z[sideKey].reduce((a, c) => a + c.clout, 0), 0);
    const per = Math.floor(total / 3);
    for (const z of s.zones) {
      const arr = z[sideKey];
      if (!arr.length) continue;
      const cur  = arr.reduce((a, c) => a + c.clout, 0);
      const diff = per - cur;
      if (diff !== 0) {
        const each      = Math.floor(diff / arr.length);
        const remainder = diff - each * arr.length;
        arr.forEach((c, i) => {
          c.clout = Math.max(0, c.clout + each + (i === 0 ? remainder : 0));
        });
      }
    }
    return { state: s };
  },

  "Thena": (s, card, zIdx, isPlayer) => {
    // +3 power if exactly 2 cards played this turn
    const plays = isPlayer ? (s.playerPlaysThisTurn || []) : (s.aiPlaysThisTurn || []);
    if (plays.length === 2) {
      const sideKey = isPlayer ? "pCards" : "aCards";
      const c = s.zones[zIdx][sideKey].find(x => x.id === card.id);
      if (c) c.clout += 3;
    }
    return { state: s };
  },

  "Red Hulk": (s, card, zIdx, isPlayer) => {
    // +3 if opponent has unspent energy this turn
    const oppSpent = isPlayer
      ? (s.aiPlaysThisTurn     || []).reduce((a, p) => a + (p.energy || 0), 0)
      : (s.playerPlaysThisTurn || []).reduce((a, p) => a + (p.energy || 0), 0);
    if (oppSpent < s.turn) {
      const sideKey = isPlayer ? "pCards" : "aCards";
      const c = s.zones[zIdx][sideKey].find(x => x.id === card.id);
      if (c) c.clout += 3;
    }
    return { state: s };
  },

  "Hope Summers": (s, card, zIdx, isPlayer) => {
    // +1 hand size next turn approximates +1 energy
    if (isPlayer) s.bonusDraw = (s.bonusDraw || 0) + 1;
    return { state: s };
  },

  // ─── NEWLY IMPLEMENTED HANDLERS ───────────────────────────────────

  "Angela": (s, card, zIdx, isPlayer) => {
    // +1 power each time you play a card here (on-reveal: +1 per prior card here)
    const sideKey = isPlayer ? "pCards" : "aCards";
    const here  = s.zones[zIdx][sideKey];
    const prior = here.filter(c => c.id !== card.id).length;
    const me    = here.find(c => c.id === card.id);
    if (me && prior > 0) me.clout += prior;
    return { state: s };
  },

  "Bast": (s, card, zIdx, isPlayer) => {
    // Set power of all cards in hand to 3
    const hand = isPlayer ? s.playerHand : s.aiHand;
    hand.forEach(c => { c.clout = 3; });
    return { state: s };
  },

  "Bishop": (s, card, zIdx, isPlayer) => {
    // +1 power for each card played after this (approximated: +1 per play this turn)
    const sideKey      = isPlayer ? "pCards" : "aCards";
    const playsThisTurn = isPlayer ? (s.playerPlaysThisTurn || []) : (s.aiPlaysThisTurn || []);
    const me = s.zones[zIdx][sideKey].find(c => c.id === card.id);
    if (me) me.clout += playsThisTurn.length;
    return { state: s };
  },

  "Black Bolt": (s, card, zIdx, isPlayer) => {
    const oppHand = isPlayer ? s.aiHand : s.playerHand;
    if (!oppHand.length) return { state: s };
    const lowest = oppHand.slice().sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0))[0];
    const idx = oppHand.findIndex(c => c.id === lowest.id);
    if (idx >= 0) {
      oppHand.splice(idx, 1);
      if (isPlayer) { s.aiDiscard     = s.aiDiscard     || []; s.aiDiscard.push(lowest); }
      else          { s.playerDiscard = s.playerDiscard || []; s.playerDiscard.push(lowest); }
      _afterDiscard(s, lowest, !isPlayer);
    }
    return { state: s };
  },

  "Blade": (s, card, zIdx, isPlayer) => {
    const hand = isPlayer ? s.playerHand : s.aiHand;
    if (!hand.length) return { state: s };
    const discarded = hand.pop();
    if (isPlayer) { s.playerDiscard = s.playerDiscard || []; s.playerDiscard.push(discarded); }
    else          { s.aiDiscard     = s.aiDiscard     || []; s.aiDiscard.push(discarded); }
    _afterDiscard(s, discarded, isPlayer);
    return { state: s };
  },

  "Blue Marvel": (s) => ({ state: s }), // Ongoing: handled cross-zone in zonePower

  "Brood": (s, card, zIdx, isPlayer) => {
    // Add 2 Broodlings here with same power
    const sideKey = isPlayer ? "pCards" : "aCards";
    const here    = s.zones[zIdx][sideKey];
    const pow     = card.clout;
    for (let i = 0; i < 2 && here.length < MAX_PER_SIDE; i++) {
      here.push({ id: `broodling-${Date.now()}-${i}`, name: "Broodling", energy: 1, clout: pow,
        snapName: "", abilityText: "", flavor: "", imageUrl: null });
    }
    return { state: s };
  },

  "Cable": (s, card, zIdx, isPlayer) => {
    // Draw a card from opponent's deck
    const oppDeck = isPlayer ? s.aiDeck     : s.playerDeck;
    const myHand  = isPlayer ? s.playerHand : s.aiHand;
    if (oppDeck.length) myHand.push(oppDeck.shift());
    return { state: s };
  },

  "Carnage": (s, card, zIdx, isPlayer) => {
    const side    = isPlayer ? "player" : "ai";
    const sideKey = isPlayer ? "pCards"  : "aCards";
    const here    = s.zones[zIdx][sideKey];
    const others  = here.filter(c => c.id !== card.id && _canDestroy(s, side, zIdx, c.id));
    const me      = here.find(c => c.id === card.id);
    others.forEach(c => {
      const i = here.indexOf(c); if (i >= 0) here.splice(i, 1);
      if (isPlayer) { s.playerDestroyed = s.playerDestroyed || []; s.playerDestroyed.push(c); }
      else          { s.aiDestroyed     = s.aiDestroyed     || []; s.aiDestroyed.push(c); }
      _afterDestroy(s, c, isPlayer);
    });
    if (me) me.clout += others.length * 2;
    return { state: s };
  },

  "Cerebro": (s, card, zIdx, isPlayer) => {
    // +3 to your highest-power card(s)
    const sideKey = isPlayer ? "pCards" : "aCards";
    let max = -Infinity;
    for (const z of s.zones) for (const c of z[sideKey]) if (c.clout > max) max = c.clout;
    if (max > -Infinity) {
      for (const z of s.zones) for (const c of z[sideKey]) if (c.clout === max) c.clout += 3;
    }
    return { state: s };
  },

  "Crystal": (s, card, zIdx, isPlayer) => {
    // Each player draws a card
    if (s.playerDeck.length) s.playerHand.push(s.playerDeck.shift());
    if (s.aiDeck.length)     s.aiHand.push(s.aiDeck.shift());
    return { state: s };
  },

  "Dagger": (s, card, zIdx, isPlayer) => {
    // +2 power per enemy card when moved here (on-reveal approximation)
    const oppKey  = isPlayer ? "aCards" : "pCards";
    const sideKey = isPlayer ? "pCards" : "aCards";
    const enemies = s.zones[zIdx][oppKey].length;
    const me      = s.zones[zIdx][sideKey].find(c => c.id === card.id);
    if (me && enemies > 0) me.clout += enemies * 2;
    return { state: s };
  },

  "Deadpool": (s, card, zIdx, isPlayer) => {
    // Mark card with respawn flag so a destroy hook can respawn it with double power
    const sideKey = isPlayer ? "pCards" : "aCards";
    const me = s.zones[zIdx][sideKey].find(c => c.id === card.id);
    if (me) me._deadpool = true;
    return { state: s };
  },

  "Deathlok": (s, card, zIdx, isPlayer) => {
    const side    = isPlayer ? "player" : "ai";
    const sideKey = isPlayer ? "pCards"  : "aCards";
    const here    = s.zones[zIdx][sideKey];
    const others  = here.filter(c => c.id !== card.id && _canDestroy(s, side, zIdx, c.id));
    others.forEach(c => {
      const i = here.indexOf(c); if (i >= 0) here.splice(i, 1);
      if (isPlayer) { s.playerDestroyed = s.playerDestroyed || []; s.playerDestroyed.push(c); }
      else          { s.aiDestroyed     = s.aiDestroyed     || []; s.aiDestroyed.push(c); }
      _afterDestroy(s, c, isPlayer);
    });
    return { state: s };
  },

  "Doctor Octopus": (s, card, zIdx, isPlayer) => {
    // Pull lowest-power card from opponent's hand to their side here
    const oppHand = isPlayer ? s.aiHand : s.playerHand;
    const oppKey  = isPlayer ? "aCards" : "pCards";
    if (!oppHand.length) return { state: s };
    const pulled = oppHand.slice().sort((a, b) => a.clout - b.clout)[0];
    const idx    = oppHand.findIndex(c => c.id === pulled.id);
    if (idx >= 0 && s.zones[zIdx][oppKey].length < MAX_PER_SIDE) {
      oppHand.splice(idx, 1);
      s.zones[zIdx][oppKey].push(pulled);
    }
    return { state: s };
  },

  "Doctor Strange": (s, card, zIdx, isPlayer) => {
    // Move your highest-power cards to this location
    const sideKey = isPlayer ? "pCards" : "aCards";
    let maxPow = -Infinity;
    for (const z of s.zones) for (const c of z[sideKey]) if (c.id !== card.id && c.clout > maxPow) maxPow = c.clout;
    const fx = [];
    for (let z = 0; z < 3; z++) {
      if (z === zIdx) continue;
      const targets = [...s.zones[z][sideKey]].filter(c => c.clout === maxPow);
      for (const t of targets) {
        if (_moveCard(s, isPlayer ? "player" : "ai", t.id, z, zIdx))
          fx.push({ type: "move", cardId: t.id, fromZone: z, toZone: zIdx, side: isPlayer ? "player" : "ai" });
      }
    }
    return { state: s, fx };
  },

  "Drax": (s, card, zIdx, isPlayer) => {
    // +4 power if opponent played a card here this turn
    const oppPlays   = isPlayer ? (s.aiPlaysThisTurn || []) : (s.playerPlaysThisTurn || []);
    const playedHere = oppPlays.some(p => p.zoneIdx === zIdx);
    if (playedHere) {
      const sideKey = isPlayer ? "pCards" : "aCards";
      const me = s.zones[zIdx][sideKey].find(c => c.id === card.id);
      if (me) me.clout += 4;
    }
    return { state: s };
  },

  "Enchantress": (s, card, zIdx, isPlayer) => {
    // Remove abilities from all Ongoing cards here
    for (const side of ["pCards", "aCards"]) {
      for (const c of s.zones[zIdx][side]) {
        if (c.abilityText && c.abilityText.startsWith("Ongoing:")) {
          c.abilityText = ""; c.snapName = "";
        }
      }
    }
    return { state: s };
  },

  "Falcon": (s, card, zIdx, isPlayer) => {
    // Return your 1-cost cards to hand
    const sideKey = isPlayer ? "pCards" : "aCards";
    const hand    = isPlayer ? s.playerHand : s.aiHand;
    for (let z = 0; z < 3; z++) {
      const arr      = s.zones[z][sideKey];
      const keepers  = [];
      const returned = [];
      arr.forEach(c => { (c.id !== card.id && c.energy === 1 ? returned : keepers).push(c); });
      s.zones[z][sideKey] = keepers;
      returned.forEach(c => hand.push(c));
    }
    return { state: s };
  },

  "Galactus": (s, card, zIdx, isPlayer) => {
    // If winning here and only card, destroy other locations
    const sideKey = isPlayer ? "pCards" : "aCards";
    const here    = s.zones[zIdx][sideKey];
    if (here.length !== 1) return { state: s };
    const pp = zonePower(s.zones[zIdx].pCards), ap = zonePower(s.zones[zIdx].aCards);
    if (!(isPlayer ? pp > ap : ap > pp)) return { state: s };
    for (let z = 0; z < 3; z++) {
      if (z === zIdx) continue;
      s.zones[z].pCards = []; s.zones[z].aCards = [];
    }
    return { state: s };
  },

  "Gambit": (s, card, zIdx, isPlayer) => {
    const hand    = isPlayer ? s.playerHand : s.aiHand;
    const oppSide = isPlayer ? "ai"     : "player";
    const oppKey  = isPlayer ? "aCards" : "pCards";
    if (!hand.length) return { state: s };
    const discarded = hand.splice(Math.floor(Math.random() * hand.length), 1)[0];
    if (isPlayer) { s.playerDiscard = s.playerDiscard || []; s.playerDiscard.push(discarded); }
    else          { s.aiDiscard     = s.aiDiscard     || []; s.aiDiscard.push(discarded); }
    _afterDiscard(s, discarded, isPlayer);
    const destroyable = s.zones[zIdx][oppKey].filter(c => _canDestroy(s, oppSide, zIdx, c.id));
    if (destroyable.length) {
      const target = destroyable[Math.floor(Math.random() * destroyable.length)];
      const ti = s.zones[zIdx][oppKey].findIndex(c => c.id === target.id);
      if (ti >= 0) s.zones[zIdx][oppKey].splice(ti, 1);
      if (!isPlayer) { s.playerDestroyed = s.playerDestroyed || []; s.playerDestroyed.push(target); }
      else           { s.aiDestroyed     = s.aiDestroyed     || []; s.aiDestroyed.push(target); }
      _afterDestroy(s, target, !isPlayer);
    }
    return { state: s };
  },

  "Ghost Rider": (s, card, zIdx, isPlayer) => {
    // Bring back the last discarded card to this location
    const discard = isPlayer ? (s.playerDiscard || []) : (s.aiDiscard || []);
    const sideKey = isPlayer ? "pCards" : "aCards";
    if (!discard.length || s.zones[zIdx][sideKey].length >= MAX_PER_SIDE) return { state: s };
    const revived = { ...discard[discard.length - 1], id: `revive-${Date.now()}` };
    s.zones[zIdx][sideKey].push(revived);
    return { state: s };
  },

  "Gwenpool": (s, card, zIdx, isPlayer) => {
    // Pick 3 random hand cards, +2 each
    const hand = isPlayer ? s.playerHand : s.aiHand;
    for (let i = 0; i < 3; i++) {
      if (!hand.length) break;
      hand[Math.floor(Math.random() * hand.length)].clout += 2;
    }
    return { state: s };
  },

  "Iron Man": (s) => ({ state: s }), // Ongoing: handled in zonePower (doubles zone total)

  "Iron Fist": (s, card, zIdx, isPlayer) => {
    // Next card you play moves one location left (flag on state)
    if (isPlayer) s._ironFistActive = true;
    return { state: s };
  },

  "Ironheart": (s, card, zIdx, isPlayer) => {
    // Give 2 other cards +3 power
    const sideKey = isPlayer ? "pCards" : "aCards";
    const targets = [];
    for (const z of s.zones) for (const c of z[sideKey]) if (c.id !== card.id) targets.push(c);
    targets.sort(() => Math.random() - 0.5).slice(0, 2).forEach(c => { c.clout += 3; });
    return { state: s };
  },

  "Jessica Jones": (s, card, zIdx, isPlayer) => {
    // +5 if you don't play here next turn (flag; bonus applied next turn start)
    if (isPlayer) s._jessicaJones = { cardId: card.id, zoneIdx: zIdx };
    return { state: s };
  },

  "Juggernaut": (s, card, zIdx, isPlayer) => {
    // Move away all enemy cards played here this turn
    const oppSide  = isPlayer ? "ai"     : "player";
    const oppKey   = isPlayer ? "aCards" : "pCards";
    const oppPlays = isPlayer ? (s.aiPlaysThisTurn || []) : (s.playerPlaysThisTurn || []);
    const fx = [];
    for (const cid of oppPlays.filter(p => p.zoneIdx === zIdx).map(p => p.cardId)) {
      const dest = _pickAwayZone(s, oppSide, zIdx);
      if (dest >= 0 && _moveCard(s, oppSide, cid, zIdx, dest))
        fx.push({ type: "move", cardId: cid, fromZone: zIdx, toZone: dest, side: oppSide });
    }
    return { state: s, fx };
  },

  "Ka-Zar": (s) => ({ state: s }), // Ongoing: handled cross-zone in displayClout

  "Killmonger": (s, card, zIdx, isPlayer) => {
    for (let z = 0; z < 3; z++) {
      for (const [side, sideKey] of [["player", "pCards"], ["ai", "aCards"]]) {
        const victims = s.zones[z][sideKey].filter(c => c.energy === 1 && c.id !== card.id && _canDestroy(s, side, z, c.id));
        victims.forEach(c => {
          const i = s.zones[z][sideKey].indexOf(c); if (i >= 0) s.zones[z][sideKey].splice(i, 1);
          if (sideKey === "pCards") { s.playerDestroyed = s.playerDestroyed || []; s.playerDestroyed.push(c); }
          else                     { s.aiDestroyed     = s.aiDestroyed     || []; s.aiDestroyed.push(c); }
          _afterDestroy(s, c, side === "player");
        });
      }
    }
    return { state: s };
  },

  "Klaw": (s) => ({ state: s }), // Ongoing: handled in klawBonusForZone (+7 to right zone)

  "Kraven": (s, card, zIdx, isPlayer) => {
    // +2 per card that moves here — flagged; tracked by move handler
    const sideKey = isPlayer ? "pCards" : "aCards";
    const me = s.zones[zIdx][sideKey].find(c => c.id === card.id);
    if (me) me._kravenZone = zIdx;
    return { state: s };
  },

  "Lady Sif": (s, card, zIdx, isPlayer) => {
    const hand = isPlayer ? s.playerHand : s.aiHand;
    if (!hand.length) return { state: s };
    const highest = hand.slice().sort((a, b) => (b.energy ?? 0) - (a.energy ?? 0))[0];
    const idx     = hand.findIndex(c => c.id === highest.id);
    if (idx >= 0) {
      hand.splice(idx, 1);
      if (isPlayer) { s.playerDiscard = s.playerDiscard || []; s.playerDiscard.push(highest); }
      else          { s.aiDiscard     = s.aiDiscard     || []; s.aiDiscard.push(highest); }
      _afterDiscard(s, highest, isPlayer);
    }
    return { state: s };
  },

  "Leech": (s, card, zIdx, isPlayer) => {
    // Remove abilities from opponent's 6-cost hand cards
    const oppHand = isPlayer ? s.aiHand : s.playerHand;
    oppHand.filter(c => c.energy === 6).forEach(c => { c.abilityText = ""; c.snapName = ""; });
    return { state: s };
  },

  "Mister Sinister": (s, card, zIdx, isPlayer) => {
    // Add a clone here with same power
    const sideKey = isPlayer ? "pCards" : "aCards";
    if (s.zones[zIdx][sideKey].length < MAX_PER_SIDE) {
      s.zones[zIdx][sideKey].push({ ...card, id: `sinister-${Date.now()}`, name: `${card.name} Clone`, abilityText: "", snapName: "" });
    }
    return { state: s };
  },

  "Odin": (s, card, zIdx, isPlayer) => {
    // Repeat On Reveal of all other cards in this zone
    const sideKey = isPlayer ? "pCards" : "aCards";
    const others  = s.zones[zIdx][sideKey].filter(c => c.id !== card.id && c.snapName && SNAP_HANDLERS[c.snapName]);
    for (const c of others) {
      const result = SNAP_HANDLERS[c.snapName](s, c, zIdx, isPlayer);
      s = result.state || s;
    }
    return { state: s };
  },

  "Punisher": (s) => ({ state: s }), // Ongoing: handled in zonePower (+1 per enemy here)

  "Wolverine": (s, card, zIdx, isPlayer) => {
    // When destroyed, respawn with +2 power — flag for destroy hook
    const sideKey = isPlayer ? "pCards" : "aCards";
    const me = s.zones[zIdx][sideKey].find(c => c.id === card.id);
    if (me) me._wolverine = true;
    return { state: s };
  },

  "Absorbing Man": (s, card, zIdx, isPlayer) => {
    // Copy last On Reveal played (second-to-last play this turn)
    const plays = isPlayer ? (s.playerPlaysThisTurn || []) : (s.aiPlaysThisTurn || []);
    if (plays.length < 2) return { state: s };
    const prevPlay = plays[plays.length - 2];
    const sideKey  = isPlayer ? "pCards" : "aCards";
    let prevCard   = null;
    for (const z of s.zones) { prevCard = z[sideKey].find(c => c.id === prevPlay.cardId); if (prevCard) break; }
    if (!prevCard || !prevCard.snapName || !SNAP_HANDLERS[prevCard.snapName]) return { state: s };
    if (prevCard.snapName === "Absorbing Man") return { state: s }; // no infinite loop
    return SNAP_HANDLERS[prevCard.snapName](s, card, zIdx, isPlayer);
  },

  "Annihilus": (s, card, zIdx, isPlayer) => {
    // Cards with power < 0 switch sides; destroy if they can't move
    const sideKey = isPlayer ? "pCards" : "aCards";
    const oppKey  = isPlayer ? "aCards" : "pCards";
    const negatives = s.zones[zIdx][sideKey].filter(c => c.id !== card.id && c.clout < 0);
    negatives.forEach(c => {
      const i = s.zones[zIdx][sideKey].indexOf(c);
      if (i >= 0) s.zones[zIdx][sideKey].splice(i, 1);
      if (s.zones[zIdx][oppKey].length < MAX_PER_SIDE) s.zones[zIdx][oppKey].push(c);
    });
    return { state: s };
  },

  "Apocalypse": (s) => ({ state: s }), // respawn handled by _afterDiscard in discard sources

  "Arnim Zola": (s, card, zIdx, isPlayer) => {
    const side    = isPlayer ? "player" : "ai";
    const sideKey = isPlayer ? "pCards"  : "aCards";
    const here    = s.zones[zIdx][sideKey].filter(c => c.id !== card.id && _canDestroy(s, side, zIdx, c.id));
    if (!here.length) return { state: s };
    const target = here[Math.floor(Math.random() * here.length)];
    const ti     = s.zones[zIdx][sideKey].indexOf(target);
    if (ti >= 0) s.zones[zIdx][sideKey].splice(ti, 1);
    if (isPlayer) { s.playerDestroyed = s.playerDestroyed || []; s.playerDestroyed.push(target); }
    else          { s.aiDestroyed     = s.aiDestroyed     || []; s.aiDestroyed.push(target); }
    _afterDestroy(s, target, isPlayer);
    for (let z = 0; z < 3; z++) {
      if (z === zIdx) continue;
      if (s.zones[z][sideKey].length < MAX_PER_SIDE)
        s.zones[z][sideKey].push({ ...target, id: `zola-${Date.now()}-${z}` });
    }
    return { state: s };
  },

  "Baron Mordo": (s, card, zIdx, isPlayer) => {
    // Top card of opponent's deck gets energy locked
    const oppDeck = isPlayer ? s.aiDeck : s.playerDeck;
    if (oppDeck.length) { oppDeck[0].energy = 6; oppDeck[0]._mordo = true; }
    return { state: s };
  },

  "Beast": (s, card, zIdx, isPlayer) => {
    // Return your other cards here to hand with cost -1
    const sideKey = isPlayer ? "pCards" : "aCards";
    const hand    = isPlayer ? s.playerHand : s.aiHand;
    const others  = s.zones[zIdx][sideKey].filter(c => c.id !== card.id);
    others.forEach(c => {
      const i = s.zones[zIdx][sideKey].indexOf(c); if (i >= 0) s.zones[zIdx][sideKey].splice(i, 1);
      c.energy = Math.max(0, (c.energy || 0) - 1);
      hand.push(c);
    });
    return { state: s };
  },

  // Minor state effects
  "Black Widow": (s, card, zIdx, isPlayer) => {
    // Opponent skips their draw next turn
    if (isPlayer) s._widowBiteAi = true;
    else s._widowBitePlayer = true;
    return { state: s };
  },
  "Cloak": (s, card, zIdx) => {
    s.zones[zIdx]._cloakTurn = s.turn; // next turn both players may move cards here
    return { state: s };
  },
  "Death": (s) => ({ state: s }),
  "High Evolutionary": (s, card, zIdx, isPlayer) => {
    // +2 to all your cards in play that have no ability (no snapName)
    const sideKey = isPlayer ? "pCards" : "aCards";
    for (const z of s.zones) {
      for (const c of z[sideKey]) {
        if (c.id !== card.id && !c.snapName) c.clout += 2;
      }
    }
    return { state: s };
  },

  "Captain Marvel": (s, card, zIdx, isPlayer) => {
    // At game end move to winning location — flag
    if (isPlayer) s._captainMarvelCardId = card.id;
    return { state: s };
  },

  "Colossus": (s, card, zIdx, isPlayer) => {
    // Mark as immune to moves and destruction
    const sideKey = isPlayer ? "pCards" : "aCards";
    const me = s.zones[zIdx][sideKey].find(c => c.id === card.id);
    if (me) me._immune = true;
    return { state: s };
  },

  "Cosmo": (s, card, zIdx, isPlayer) => {
    // Flag this zone as blocking opponent's On Reveal (checked in applyReveal)
    s.zones[zIdx]._cosmoActive = true;
    s.zones[zIdx]._cosmoSide   = isPlayer ? "player" : "ai";
    return { state: s };
  },

  "Daredevil": (s, card, zIdx, isPlayer) => {
    // On turn 5, see opponent plays first — state flag
    if (isPlayer) s._daredevilActive = true;
    return { state: s };
  },

  "Debrii": (s, card, zIdx, isPlayer) => {
    // Add a Rock to each other location (both sides)
    const rock = () => ({ id: `rock-${Date.now()}-${Math.random().toFixed(4)}`, name: "Rock", energy: 0, clout: 0, snapName: "", abilityText: "", imageUrl: null });
    for (let z = 0; z < 3; z++) {
      if (z === zIdx) continue;
      if (s.zones[z].pCards.length < MAX_PER_SIDE) s.zones[z].pCards.push(rock());
      if (s.zones[z].aCards.length < MAX_PER_SIDE) s.zones[z].aCards.push(rock());
    }
    return { state: s };
  },

  "Devil Dinosaur": (s, card, zIdx, isPlayer) => {
    // Ongoing +2 per hand card — on-reveal approximation
    const hand    = isPlayer ? s.playerHand : s.aiHand;
    const sideKey = isPlayer ? "pCards" : "aCards";
    const me = s.zones[zIdx][sideKey].find(c => c.id === card.id);
    if (me) me.clout += hand.length * 2;
    return { state: s };
  },

  "Dracula": (s, card, zIdx, isPlayer) => {
    // At end of game, discard hand card for its power — flag
    if (isPlayer) s._draculaCardId = card.id;
    return { state: s };
  },

  "Echo": (s, card, zIdx, isPlayer) => {
    // After opponent plays Ongoing here, remove abilities — flag zone
    s.zones[zIdx]._echoSide = isPlayer ? "player" : "ai";
    return { state: s };
  },

  "Gladiator": (s, card, zIdx, isPlayer) => {
    // Add card from opponent's deck to their side; destroy if lower power (unless Armor protects)
    const oppDeck = isPlayer ? s.aiDeck     : s.playerDeck;
    const oppKey  = isPlayer ? "aCards"     : "pCards";
    const sideKey = isPlayer ? "pCards"     : "aCards";
    const oppSide = isPlayer ? "ai"         : "player";
    if (!oppDeck.length || s.zones[zIdx][oppKey].length >= MAX_PER_SIDE) return { state: s };
    const pulled = { ...oppDeck.shift(), id: `glad-${Date.now()}` };
    const me = s.zones[zIdx][sideKey].find(c => c.id === card.id);
    const armorProtects = s.zones[zIdx]._armorSide === oppSide;
    if (pulled.clout < (me?.clout || 0) && !armorProtects) {
      if (!isPlayer) { s.playerDestroyed = s.playerDestroyed || []; s.playerDestroyed.push(pulled); }
      else           { s.aiDestroyed     = s.aiDestroyed     || []; s.aiDestroyed.push(pulled); }
      _afterDestroy(s, pulled, !isPlayer);
    } else {
      s.zones[zIdx][oppKey].push(pulled);
    }
    return { state: s };
  },

  "Hela": (s, card, zIdx, isPlayer) => {
    // For each different cost in discard, resurrect one to a random location
    const discard = isPlayer ? (s.playerDiscard || []) : (s.aiDiscard || []);
    const sideKey = isPlayer ? "pCards" : "aCards";
    const seen    = new Set();
    for (const d of discard) {
      if (seen.has(d.energy)) continue;
      seen.add(d.energy);
      const z = Math.floor(Math.random() * 3);
      if (s.zones[z][sideKey].length < MAX_PER_SIDE)
        s.zones[z][sideKey].push({ ...d, id: `hela-${Date.now()}-${z}` });
    }
    return { state: s };
  },

  "Human Torch": (s, card, zIdx, isPlayer) => {
    // When moved, double power — flag for move handler
    const sideKey = isPlayer ? "pCards" : "aCards";
    const me = s.zones[zIdx][sideKey].find(c => c.id === card.id);
    if (me) me._humanTorch = true;
    return { state: s };
  },

  "Thanos": (s, card, zIdx, isPlayer) => {
    // On-reveal: add one random Power Stone to your hand
    const hand   = isPlayer ? s.playerHand : s.aiHand;
    const stones = ["⚡", "💎", "🔮", "❤️", "🧠", "🌀"];
    const stone  = stones[Math.floor(Math.random() * stones.length)];
    hand.push({ id: `stone-${Date.now()}`, name: `${stone} Power Stone`, energy: 0, clout: 3,
      snapName: "", abilityText: "On Reveal: +3 Power.", imageUrl: null });
    return { state: s };
  },

  "Armor": (s, card, zIdx, isPlayer) => {
    // Ongoing — mark zone as no-destroy for your side
    s.zones[zIdx]._armorSide = isPlayer ? "player" : "ai";
    return { state: s };
  },
};

export default SNAP_HANDLERS;
