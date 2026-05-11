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

### Partial Ability Handlers (11 cards need wiring)
- [ ] **The Warden / Apocalypse (c007)** — discard respawn not wired
  - `_apocalypseId` flag set in handler; need discard hook: if discarded card ID matches, push back to hand with `clout + 4`
- [ ] **Peewee Dirtbag / Armor (c008)** — `_canDestroy()` added but not called everywhere
  - Wire into Carnage, Deathlok, Arnim Zola destroy logic in `snapHandlers.js`
- [ ] **Fred Juggs / Black Widow (c016)** — Activate ability, no UI exists
  - Need an Activate button on the card while in a zone during player's turn
  - Pattern: add `activatable` flag to card def; Zone renders button when in play
- [ ] **Logan Touchdown / Captain Marvel (c022)** — end-game move not wired
  - ✅ Actually implemented in `GameScreen.jsx` reveal sequencer — verify it works
- [ ] **Souvenir Cheeseburger / Cloak (c026)** — move window needs turn state
  - Need `zone._cloakTurn` flag + UI indicator showing move window is open next turn
- [ ] **Dan Schwartz / Dagger (c030)** — move power boost needs `_moveCard` callback
  - In `_moveCard` in `snapHelpers.js`, after `toArr.push(moved)`, check if `moved.snapName === "Dagger"` and add `2 × enemy count`
- [ ] **Lucifer Melancholy / Daredevil (c031)** — turn 5 UI peekthrough not shown
  - `_daredevilActive` flag is set; add UI strip on turn 5 showing opponent's hand count/energy
- [ ] **Venus Velociraptor M / Death (c034)** — `deathReducedCost()` added but budget not wired
  - Wire into `placeCard()` in `GameScreen.jsx`: check if Death is in play, apply cost reduction
- [ ] **Wakanda Ellen / Dracula (c041)** — end-game discard not wired
  - ✅ Actually implemented in `GameScreen.jsx` reveal sequencer — verify it works
- [ ] **Podcast Squirrel / Echo (c043)** — Ongoing removal on opponent play not wired
  - `_echoSide` flag set; need to check when AI plays an Ongoing card at that zone, remove its abilities
- [ ] **Eggbert / High Evolutionary (c054)** — Game Start hook missing entirely
  - Add `gameStartEffects(state)` function called from `initGame()` in `gameLogic.js`
  - If High Evolutionary is in the deck, give hidden abilities to cards with no `abilityText`
  - Define a `HE_ABILITIES` const mapping card IDs to their unlocked ability

---

## 🟡 Medium Priority

### Incomplete Card Abilities

- [ ] **Doordasher / Iron Fist (c058)** — "After you play your next card, move it one location to the left"
  - `_ironFistActive` flag is set in handler
  - Wire into `placeCard()` in `GameScreen.jsx`: if flag is active, move the just-played card left and clear the flag

- [ ] **Tim Cheese / Jessica Jones (c060)** — "If you don't play here next turn, +5 Power"
  - `_jessicaJones: { cardId, zoneIdx }` flag is set
  - Check at start of each turn: if player didn't play at that zone last turn, apply +5 to that card

- [ ] **Garth Ponce / Deadpool (c033)** — "When Destroyed: Return with double Power"
  - `_deadpool: true` flag set on card
  - Need destroy hook: if destroyed card has `_deadpool`, push back to hand with `clout * 2`

- [ ] **Shadowflame / Wolverine (c077)** — "When Destroyed/Discarded: Return with +2 Power"
  - `_wolverine: true` flag set on card
  - Same pattern as Deadpool but `clout + 2`; also triggers on discard

- [ ] **Angela / Buttermilk Androgyna (c004)** — needs real accumulation across turns
  - Currently fires at reveal and counts prior cards in zone — only works the turn she's played
  - Fix: maintain `card._angelaAccum` in game state, increment in `endTurnResolve` whenever a card lands in the same zone

- [ ] **Bishop / Tug McKracken (c013)** — needs real accumulation across turns
  - Currently counts plays this turn only; real behavior: +1 each time ANY card is played, across all future turns
  - Same fix as Angela: per-card accumulator incremented in `endTurnResolve`

- [ ] **Turt / Kraven (c066)** — "When a card moves here, +2 Power"
  - `_kravenZone` flag set on card
  - Wire into `_moveCard()` in `snapHelpers.js`: after move, check destination zone for a card with `_kravenZone`, add +2

### Ongoing Badge Gap
- [ ] **Klaw and Iron Man** don't emit floating power-delta badges
  - Their bonus is computed dynamically in `zonePower()`, not via `applyReveal()`, so `_snapshotPowers` / `_diffPowers` never sees a `.clout` mutation
  - Zone scores show correct totals; per-card floating labels do not appear
  - Fix path: mutate a synthetic `.clout` on them at reveal time, or add a separate "ongoing badge" pass after resolve

### Storage Key
- [ ] Bump storage key from `zany_v9` to `zany_v10` in `constants.js` before shipping if data structure changes
  - Cards with 0 Power (Iron Man, Thena, Cerebro, Cassandra Nova etc.) are correct — they rely on abilities
  - Death (Venus Velociraptor M) is 8-cost intentionally — AI greedy budget handles it since it caps at turn 6

### Visual Effects
- [ ] **Destroy flash** — red burst when card is destroyed (Carnage, Deathlok, Arnim Zola) `medium`
  - CSS class `.destroy-flash` already exists in `globalStyles.js` — just needs to be applied
- [ ] **Discard tumble** — card slides down when discarded (Blade, Lady Sif, Gambit) `easy`
- [ ] **Clone spawn pop** — duplicate card pops in (Mister Sinister, Brood, Doctor Doom bots) `easy`
- [ ] **Power drain siphon** — beam between cards when power stolen (Cassandra Nova) `medium`
- [ ] **Mass-move sweep** — zone highlight when Magneto/Juggernaut mass-moves `medium`
- [ ] **Galactus vortex** — zones collapse with implosion when Galactus fires `hard`
- [ ] **Ongoing shimmer** — slow pulse border on Ongoing cards in play `easy`
  - CSS class `.ongoing-shimmer` already exists in `globalStyles.js` — just needs to be applied to Ongoing cards in `CardView.jsx`
- [ ] **Deck-draw beam** — card flies from opponent deck to your hand (Cable) `medium`
- [ ] **Hand-card buff glow** — hand cards pulse green when boosted outside reveal (Bast) `easy`

### AI Improvements
- [ ] AI currently plays random affordable cards in random zones — upgrade to basic scoring
  - Prefer zones where AI is losing
  - Prefer higher-power cards
  - Avoid filling zones already winning by a large margin

---

## 🟢 Nice to Have

### Visual / UX
- [ ] Add card images for the 3 location backgrounds (`bgImage` field in `zones.js`)
- [ ] Sound effects (card play, reveal, win/lose)
- [ ] Haptic feedback on mobile (`navigator.vibrate`)
- [ ] Animated card deal — cards fly from deck to hand one by one
- [ ] Show opponent's hand size as face-down card silhouettes
- [ ] "Snap" button to double the stakes (cosmetic / score multiplier)

### Game Modes
- [ ] Pass-and-play mode (two humans on same device)
- [ ] Spectator replay of last game
- [ ] Daily challenge (fixed seed, same game for everyone that day)

### Card Editor
- [ ] Import card art directly from a URL (not just file upload)
- [ ] Ability picker dropdown (instead of free-text snapName)
- [ ] Bulk import cards from a spreadsheet/CSV

### Collection
- [ ] Sort by snapName / ability type
- [ ] Filter by energy cost range
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
- [x] All components and screens extracted into separate files
- [x] `package.json`, `vite.config.js`, `index.html`, `src/main.jsx` — Vite build setup
- [x] `CLAUDE.md` — Claude Code project briefing
- [x] `README.md` — project overview
- [x] Priority system with gold glow animation
- [x] Drag and drop with iOS pointer event handling
- [x] Reveal sequencer with staggered timing
- [x] PowerDeltaLabel floating +N / -N badges (via _snapshotPowers → _diffPowers)
- [x] MoveEffect arrow + flash overlay
- [x] Score pulse animation when zone power changes
- [x] Deck builder with 3 saved slots + localStorage persistence
- [x] Human Torch doubles power on move (`_humanTorch` flag in `_moveCard`)
- [x] Colossus can't be moved (`_immune` flag in `_moveCard`)
- [x] Cosmo blocks opponent On Reveal (`_cosmoSide` stored; `applyReveal` checks correctly)
- [x] Energy badges and power badges read live from state
- [x] Zone score badges derived from `zonePower()` on each render

---

## 💡 Ideas / Backlog (not committed to yet)

- Multiplayer over WebSockets (major undertaking)
- Card pack opening animation
- "Draft" mode — pick cards one at a time from random pairs
- Achievement system
- Card foil/holographic effect
- Animated location backgrounds
- Export game replay as GIF
