# ZANY — Interdimensional Card Battles
## Claude Code Project Briefing

---

## What this project is

ZANY is a browser-based card game heavily inspired by Marvel Snap. Two players (one human, one AI) each play cards onto 3 locations over 6 turns. Each location has a power score per side; whoever wins 2 of 3 locations wins the game. Cards have On Reveal abilities that trigger when flipped, Ongoing abilities that apply passively, and some cards move other cards between locations.

The game is built entirely in React with no backend — all state lives in the browser. Cards and decks are saved to localStorage. There is no multiplayer; the AI opponent is a simple greedy bot.

---

## Tech stack

- **React 18** (functional components + hooks only, no class components)
- **Vite** as the build tool / dev server
- **Plain JavaScript** — no TypeScript anywhere
- **No CSS framework** — all styles are a single JS template string injected into the document head at runtime via a `useEffect` in `App.jsx`
- **No external state management** — useState/useEffect only
- **No routing library** — screen switching is done with a simple `screen` state string in `App.jsx`

---

## File structure

```
ZANY/
├── index.html              ← HTML entry point, loads src/main.jsx
├── package.json            ← Vite + React dependencies
├── vite.config.js          ← Vite config with React plugin
├── .gitignore
├── CLAUDE.md               ← this file
├── README.md               ← project overview + full card list
├── TASKS.md                ← task tracker (read this for what to work on)
└── src/
    ├── main.jsx            ← ReactDOM.createRoot entry point
    ├── App.jsx             ← Root component: CSS injection, card state, screen routing
    ├── constants.js        ← Global constants (TURNS, MAX_PER_SIDE, storage keys, etc.)
    ├── styles/
    │   └── globalStyles.js ← Entire game CSS as a single exported JS string
    ├── hooks/
    │   └── useTilt.js      ← Pointer-tracked 3D card tilt effect (custom hook)
    ├── game/
    │   ├── zones.js        ← ZONES array: 3 location definitions with names, abilities, gradients
    │   ├── cardImages.js   ← CARD_IMAGES object: maps card IDs (c001–c077) to image URLs (currently null)
    │   ├── cardData.js     ← SPREADSHEET_CARDS array (77 cards) + SNAP_ABILITY_LIBRARY reference
    │   ├── snapHelpers.js  ← Low-level helpers: _moveCard, _canDestroy, _pickAwayZone, _snapshotPowers, _diffPowers
    │   ├── snapHandlers.js ← SNAP_HANDLERS object: one function per card ability, keyed by snapName
    │   └── gameLogic.js    ← All pure game logic: initGame, applyReveal, zonePower, computeWinner, etc.
    ├── components/
    │   ├── CardView.jsx    ← Card renderer (front/back flip, energy/power badges, art, nameplate)
    │   ├── Zone.jsx        ← Single location: AI slot, score bar, player slot
    │   ├── DragGhost.jsx   ← Semi-transparent card that follows the pointer during drag
    │   ├── DeckPanel.jsx   ← Slide-up drawer showing deck/discard/destroyed cards
    │   ├── ShuffleOverlay.jsx ← Animated deal sequence shown at game start
    │   ├── Confetti.jsx    ← Victory confetti burst
    │   ├── CardPopup.jsx   ← Full-card tap popup with ability text and optional Return button
    │   └── effects/
    │       ├── RevealEffect.jsx     ← Burst ring + floating label on card reveal
    │       ├── PowerDeltaLabel.jsx  ← Floating +N / -N when card power changes
    │       └── MoveEffect.jsx       ← Arrow + flash overlay when a card moves zones
    └── screens/
        ├── HomeScreen.jsx        ← Title screen with Play and My Cards buttons
        ├── CollectionScreen.jsx  ← Scrollable card grid with search, filter, sort, preview
        ├── CardEditorScreen.jsx  ← Create/edit a card (name, energy, clout, ability, art)
        ├── GameScreen.jsx        ← Main game: zones, hand, drag, reveal sequence, end screen
        ├── DeckSelectScreen.jsx  ← Pick a deck to play (includes DeckBuilderScreen internally)
        └── LoadingScreen.jsx     ← Animated loading bar shown on first app load
```

---

## Key terminology (do not rename these)

| Term | Meaning |
|------|---------|
| `clout` | A card's power value (NOT "power") |
| `energy` | A card's play cost (NOT "mana" or "cost") |
| `snapName` | The Marvel Snap card this card's ability is based on (e.g. "Black Panther") |
| `abilityText` | The human-readable ability description shown on cards |
| `zones` | The 3 locations on the board |
| `pCards` | Player cards in a zone |
| `aCards` | AI cards in a zone |
| `playerPlaysThisTurn` | Array tracking cards played this turn (for energy accounting + reveal queue) |
| `revealedIds` | Array of card IDs that have been flipped face-up |
| `phase` | Game phase: "shuffle" → "play" → "reveal" → back to "play" → "end" |
| `priority` | Which side reveals first each turn (glowing gold border in UI) |
| `Flux` | In-game name for energy budget (used in debug messages) |

---

## Card data structure

```js
{
  id: "c001",               // unique ID, c001–c077 for base cards
  name: "Detective Scrotum", // display name
  energy: 4,                // play cost (1–8)
  clout: 5,                 // base power value
  snapName: "Absorbing Man", // links to SNAP_HANDLERS key
  abilityText: "On Reveal: ...", // shown in UI
  flavor: "Swamp-infected and on the case.", // italic flavor text
  imageUrl: null,           // URL string or null (falls back to emoji)
}
```

---

## Game state structure

```js
{
  turn: 1,                  // current turn (1–6)
  phase: "play",            // "shuffle" | "play" | "reveal" | "end"
  bonusDraw: 0,             // extra cards to draw next turn
  priority: "player",       // "player" | "ai" — who reveals first
  playerHand: [],
  playerDeck: [],
  aiHand: [],
  aiDeck: [],
  playerDiscard: [],
  aiDiscard: [],
  playerDestroyed: [],
  aiDestroyed: [],
  zones: [                  // always 3 zones
    {
      id: "z0",
      name: "The Vortex",
      ability: "...",
      pCards: [],
      aCards: [],
      bgImage: null,
      sky: "#3a0d6e",
      horizon: "#a83fc4",
      ground: "#0a0118",
      accent: "rgba(200,80,255,0.35)",
      // Ability flags set by handlers:
      _cosmoActive: false,
      _cosmoSide: null,
      _armorSide: null,
      _echoSide: null,
      _cloakTurn: null,     // turn number when Cloak window is open
    }
  ],
  playerPlaysThisTurn: [{ cardId, zoneIdx, energy }],
  aiPlaysThisTurn: [{ cardId, zoneIdx }],
  revealedIds: [],
  // Special card flags set by handlers:
  _captainMarvelCardId: null,
  _draculaCardId: null,
  _jessicaJones: null,      // { cardId, zoneIdx }
  _ironFistActive: false,
  _daredevilActive: false,
  _apocalypseId: null,
}
```

---

## How abilities work

Every card with an ability has a `snapName` matching a key in `SNAP_HANDLERS` (`snapHandlers.js`). When a card is revealed, `applyReveal()` in `gameLogic.js` looks up the handler:

```js
handler(state, card, zoneIdx, isPlayer) → { state, fx? }
```

- `state` — full game state (mutated in place, then returned)
- `fx` — optional array of move effects `[{ type:"move", cardId, fromZone, toZone, side }]`
- Handlers are pure functions — no React, no UI
- Cards without a handler reveal silently

**Important:** always deep-clone state before mutation: `JSON.parse(JSON.stringify(prev))`

---

## Ability handler status

66 of 77 handlers are fully implemented. 11 are partial:

| Card | snapName | Issue |
|------|----------|-------|
| The Warden | Apocalypse | Discard respawn not wired |
| Peewee Dirtbag | Armor | `_canDestroy()` not called everywhere |
| Fred Juggs | Black Widow | Activate-only, no UI |
| Logan Touchdown | Captain Marvel | ✅ Wired in GameScreen — verify |
| Souvenir Cheeseburger | Cloak | Move window needs turn state |
| Dan Schwartz | Dagger | Move boost needs `_moveCard` callback |
| Lucifer Melancholy | Daredevil | Turn 5 peek UI not shown |
| Venus Velociraptor M | Death | `deathReducedCost()` not wired to budget |
| Wakanda Ellen | Dracula | ✅ Wired in GameScreen — verify |
| Podcast Squirrel | Echo | Ongoing removal on opp play not wired |
| Eggbert | High Evolutionary | Game Start hook missing |

Additionally:
- **Angela (c004)** and **Bishop (c013)** fire at reveal but don't accumulate across turns — need per-card accumulator in game state
- **Klaw** and **Iron Man** don't emit floating power-delta badges (computed in `zonePower()`, invisible to `_diffPowers`)

---

## How drag and drop works

Drag is handled in `GameScreen.jsx` with raw pointer events (no library). Key details:

- `pointerdown` starts the drag
- `pointermove` on `window` tracks position (with `preventDefault` to block scroll)
- `pointerup` / `pointercancel` ends the drag
- Zone hit-testing is **pure math** (3 equal columns) — not DOM rect lookups. This is intentional for iOS reliability. Do not change this.
- A drag shorter than 15px is treated as a tap → opens card popup
- Cards placed this turn are "uncommitted" — draggable back to hand or to another zone

---

## CSS system

All CSS lives in `src/styles/globalStyles.js` as a single template string. **Do not add separate `.css` files.**

Key CSS classes already defined and ready to use:
- `.destroy-flash` — red burst animation for destroyed cards
- `.ongoing-shimmer` — animated shimmer border for Ongoing cards (apply in `CardView.jsx`)
- `.card-land` — pop animation when card lands in a zone
- `.card-uncommitted` — green pulse for cards played this turn

CSS variables in `:root`:
- `--bg`, `--bg2`, `--bg3` — dark background layers
- `--neon` — #b4ff4f (lime green)
- `--hot` — #ff5fba (pink)
- `--ice` — #5fd4ff (cyan)
- `--f-display` — Bangers (card names, titles)
- `--f-head` — Inter (UI text)
- `--f-mono` — Orbitron (numbers, badges)
- `--ch` — per-card hue (set inline)

---

## localStorage keys

| Key | Contents |
|-----|---------|
| `zany_v9` | Full cards array — bump to `zany_v10` before shipping if data structure changes |
| `zany_v8` | Old format — cleared automatically |
| `zany_decks_v1` | Saved deck configurations |

---

## What NOT to touch without care

- **`snapHandlers.js`** — 60+ ability implementations. Modifying existing ones risks breaking card interactions.
- **`snapHelpers.js`** — `_moveCard` and `_canDestroy` have immunity checks (Colossus `_immune`, Armor `_armorSide`) that must be preserved.
- **`zonePower()` in `gameLogic.js`** — Iron Man, Blue Marvel, Punisher, Klaw Ongoing effects are baked in here. Order of operations matters.
- **The drag system in `GameScreen.jsx`** — it works on iOS. Be very careful with pointer event changes.
- **`revealedIds` logic** — cards are face-down until explicitly added. The reveal sequencer in `GameScreen.jsx` controls timing.

---

## Common tasks

**Add a new card ability:**
1. Add handler to `SNAP_HANDLERS` in `snapHandlers.js` using `snapName` as key
2. Ensure the card in `cardData.js` has the matching `snapName`

**Add card images:**
Update URL values in `src/game/cardImages.js`

**Change game constants (turns, hand size, zone capacity):**
Edit `constants.js` — `TURNS`, `HAND_SIZE`, `MAX_PER_SIDE`

**Add a new screen:**
1. Create component in `src/screens/`
2. Import in `App.jsx`
3. Add `screen === "yourscreen"` branch in `App()` return

**Modify global styles:**
Edit the CSS string in `src/styles/globalStyles.js`

**Wire a destroy hook (Deadpool, Wolverine, Apocalypse):**
In the relevant destroy logic (Carnage, Deathlok, etc.), after splicing a card out, check for `card._deadpool`, `card._wolverine`, or if `state._apocalypseId === card.id` and handle respawn accordingly.

---

## The 77 base cards (name → snapName)

| Card name | snapName |
|-----------|---------|
| Detective Scrotum | Absorbing Man |
| The Cretin | Adam Warlock |
| Kotchy | Aero |
| Buttermilk Androgyna | Angela |
| Mr. Plaigan | Annihilus |
| Fenton All | Ant Man |
| The Warden | Apocalypse |
| Peewee Dirtbag | Armor |
| Big Daddy Three Finger | Arnim Zola |
| LeAntham Glass | Baron Mordo |
| Boof Mudcat | Bast |
| Abassi King | Beast |
| Tug McKracken | Bishop |
| Jordin Jinks | Black Bolt |
| Bubba Jumbo | Black Panther |
| Fred Juggs | Black Widow |
| The Fishbanger | Blade |
| JR Superbone | Blue Marvel |
| Norm Phillibuster | Brood |
| Samson Slaughter | Cable |
| Sniffy Arse | Cannonball |
| Logan Touchdown | Captain Marvel |
| Buck Shindig | Carnage |
| Bonald Brum | Cassandra Nova |
| Hans Uberstein | Cerebro |
| Souvenir Cheeseburger | Cloak |
| Shaquille Fofofo | Colossus |
| LeTwink Piddlepants | Cosmo |
| Jimmy Fushigi | Crystal |
| Dan Schwartz | Dagger |
| Lucifer Melancholy | Daredevil |
| Jizzley Smeenish | Darkhawk |
| Garth Ponce | Deadpool |
| Venus Velociraptor M | Death |
| General Doggins | Deathlok |
| Basketball Mouse | Debrii |
| Cedric The Black Cedar Shingle | Devil Dinosaur |
| Pregnant Woman Getting a Tattoo | Doctor Doom |
| Meowsly McBirdie | Doctor Octopus |
| Mini Miner | Doctor Strange |
| Wakanda Ellen | Dracula |
| Congressman Joe Jonas | Drax |
| Podcast Squirrel | Echo |
| Goblin Addict | Elsa Bloodstone |
| Medevial Basketball Cat | Enchantress |
| Timuoxi Cha le Mei | Falcon |
| Mr. Pants | Galactus |
| Disappointed Bison | Gambit |
| Arabic Spongebob | Ghost Rider |
| Sleepy Butterson | Gilgamesh |
| Shane Gillis-Alexander | Gladiator |
| Ted Boobz | Gwenpool |
| Fatass Frank | Hela |
| Eggbert | High Evolutionary |
| Tavern Wench | Hope Summers |
| The Biden Twins | Human Torch |
| Winter St. Cloud | Iron Man |
| Doordasher | Iron Fist |
| John Pork | Ironheart |
| Tim Cheese | Jessica Jones |
| Pedro Pascal as Fidel Castro | The Living Tribunal |
| Detective Oldie | Juggernaut |
| Mr. Licorice | Ka-Zar |
| The Jellybean Gang | Killmonger |
| Mongrel Must | Klaw |
| Turt | Kraven |
| The Pickler | Lady Sif |
| Sir Squeaks | Leech |
| Andrew Taint | Magneto |
| Decrepit Jimmy Carter | Mister Sinister |
| Ascendent Jimmy Carter | Odin |
| Mark Zuckerbark | Punisher |
| Dan Pills-Aryan | Red Hulk |
| Appendix Prince | Silver Surfer |
| Ana L'bead | Thanos |
| Phenomenal Lucas | Thena |
| Shadowflame | Wolverine |
