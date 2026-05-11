# ZANY — Task Tracker

This file tracks what's done, what's in progress, and what's next.
Update it as tasks are completed. Claude Code reads this automatically.

---

## 🔴 High Priority

### Card Images
- [ ] Get image URLs from Google Sheets for all 77 cards (c001–c077)
- [ ] Update `src/game/cardImages.js` with real URLs
- [ ] Verify images display correctly in collection and game screens
- [ ] Decide on fallback if image fails to load (current: colored emoji)

### Location Abilities (currently decorative — not wired to game logic)
- [ ] **The Vortex** — "On Reveal: cards played here gain +1 Power"
  - Wire into `applyReveal()` in `gameLogic.js`: after any card is revealed at zone 0, give it +1 clout
- [ ] **Glitch Alley** — "Ongoing: each side's lowest-Power card gets +2"
  - Wire into `zonePower()` in `gameLogic.js`: find min-power card per side, add 2 to base
- [ ] **The Fringe** — "On Reveal: the first card played here draws +1 card"
  - Track whether a card has been played at zone 2 this game; if first, set `bonusDraw += 1`

---

## 🟡 Medium Priority

### Incomplete Card Abilities

- [ ] **Iron Fist / Doordasher (c058)** — "On Reveal: After you play your next card, move it one location to the left"
  - `_ironFistActive` flag is set in `snapHandlers.js`
  - Need to check this flag in `placeCard()` in `GameScreen.jsx` and move the card left after placement

- [ ] **Jessica Jones / Tim Cheese (c060)** — "On Reveal: If you don't play a card here next turn, +5 Power"
  - `_jessicaJones: { cardId, zoneIdx }` flag is set in handler
  - Need to check at start of each turn: if player didn't play at that zone, apply +5 to that card

- [ ] **Deadpool / Garth Ponce (c033)** — "When Destroyed: Return with double Power"
  - `_deadpool: true` flag is set on the card
  - Need a destroy hook in card destruction logic: if destroyed card has `_deadpool`, push it back to hand with `clout * 2`

- [ ] **Wolverine / Shadowflame (c077)** — "When Discarded or Destroyed: Return with +2 Power"
  - `_wolverine: true` flag is set on the card
  - Same as Deadpool but `clout + 2` instead of `clout * 2`; also triggers on discard

- [ ] **Eggbert / High Evolutionary (c054)** — "Game Start: Unlock the potential of your cards with no abilities"
  - Currently a no-op
  - Should give basic abilities to cards that have no `abilityText` at game start (e.g. vanilla stat boosts)

- [ ] **Kraven / Turt (c066)** — "When a card moves here, +2 Power"
  - `_kravenZone` flag is set on the card
  - Need to check in `_moveCard()` in `snapHelpers.js`: if a card moves to a zone containing a card with `_kravenZone`, give that card +2

### AI Improvements
- [ ] AI currently plays random affordable cards in random zones — upgrade to basic scoring
  - Prefer zones where AI is losing
  - Prefer higher-power cards
  - Avoid filling zones that are already winning by a large margin

### Deck System
- [ ] Deck names are editable but icons are fixed — allow icon selection
- [ ] Show deck win/loss record (requires tracking game results)
- [ ] Allow decks larger than 12 with a draw-down mechanic (stretch goal)

---

## 🟢 Nice to Have

### Visual / UX
- [ ] Add card images for the 3 location backgrounds (`bgImage` field in `zones.js`)
- [ ] Sound effects (card play, reveal, win/lose)
- [ ] Haptic feedback on mobile (navigator.vibrate)
- [ ] Animated card deal — cards fly from deck to hand one by one
- [ ] Show opponent's hand size as face-down card silhouettes
- [ ] "Snap" button to double the stakes (cosmetic / score multiplier)
- [ ] Dark/light mode toggle

### Game Modes
- [ ] Pass-and-play mode (two humans on same device)
- [ ] Spectator replay of last game
- [ ] Daily challenge (fixed seed, same game for everyone that day)

### Card Editor
- [ ] Import card art directly from a URL (not just file upload)
- [ ] Ability picker dropdown (instead of free-text snapName)
- [ ] Preview card at full size before saving
- [ ] Bulk import cards from a spreadsheet/CSV

### Collection
- [ ] Sort by snapName / ability type
- [ ] Filter by energy cost range
- [ ] "Missing art" badge count in toolbar
- [ ] Export/import collection as JSON

---

## ✅ Completed

- [x] Project split from single 3.2MB App.jsx into modular file structure
- [x] `src/game/snapHandlers.js` — all 60+ card ability handlers
- [x] `src/game/snapHelpers.js` — _moveCard, _canDestroy, _pickAwayZone, _snapshotPowers, _diffPowers
- [x] `src/game/gameLogic.js` — initGame, applyReveal, zonePower, klawBonusForZone, computePriority, computeWinner, getResults
- [x] `src/game/cardData.js` — all 77 SPREADSHEET_CARDS + SNAP_ABILITY_LIBRARY
- [x] `src/game/cardImages.js` — placeholder (all null, ready for URLs)
- [x] `src/game/zones.js` — 3 location definitions
- [x] `src/constants.js` — TURNS, MAX_PER_SIDE, HAND_SIZE, storage keys
- [x] `src/hooks/useTilt.js` — 3D pointer-tracked card tilt
- [x] `src/styles/globalStyles.js` — all CSS extracted
- [x] `src/components/CardView.jsx` + `CardBack`
- [x] `src/components/Zone.jsx`
- [x] `src/components/DragGhost.jsx`
- [x] `src/components/DeckPanel.jsx`
- [x] `src/components/ShuffleOverlay.jsx`
- [x] `src/components/Confetti.jsx`
- [x] `src/components/CardPopup.jsx`
- [x] `src/components/effects/RevealEffect.jsx`
- [x] `src/components/effects/PowerDeltaLabel.jsx`
- [x] `src/components/effects/MoveEffect.jsx`
- [x] `src/screens/HomeScreen.jsx`
- [x] `src/screens/CollectionScreen.jsx`
- [x] `src/screens/CardEditorScreen.jsx`
- [x] `src/screens/GameScreen.jsx`
- [x] `src/screens/DeckSelectScreen.jsx`
- [x] `src/screens/LoadingScreen.jsx`
- [x] `package.json`, `vite.config.js`, `index.html`, `src/main.jsx` — Vite build setup
- [x] `CLAUDE.md` — Claude Code project briefing
- [x] `README.md` — project overview
- [x] End-of-game Captain Marvel (Logan Touchdown) ability
- [x] End-of-game Dracula (Wakanda Ellen) ability
- [x] Priority system with gold glow animation
- [x] Drag and drop with iOS pointer event handling
- [x] Reveal sequencer with staggered timing
- [x] Power delta floating labels
- [x] Move effect arrows and flash
- [x] Score pulse animation when zone power changes
- [x] Deck builder with 3 saved slots
- [x] localStorage persistence for cards and decks

---

## 💡 Ideas / Backlog (not committed to yet)

- Multiplayer over WebSockets (major undertaking)
- Card pack opening animation
- "Draft" mode — pick cards one at a time from random pairs
- Achievement system
- Card foil/holographic effect on rare cards
- Animated location backgrounds
- Export game replay as GIF
