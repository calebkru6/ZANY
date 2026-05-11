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
    │   ├── CardBack.jsx    ← Uniform face-down card graphic (exported from CardView.jsx)
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
  playerHand: [],           // cards in player's hand
  playerDeck: [],           // remaining player deck
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
      pCards: [],           // player cards here
      aCards: [],           // AI cards here
      bgImage: null,
      sky: "#3a0d6e",       // gradient colors for placeholder bg
      horizon: "#a83fc4",
      ground: "#0a0118",
      accent: "rgba(200,80,255,0.35)",
      _cosmoActive: false,  // Cosmo ability flag
      _armorSide: null,     // Armor ability flag
    }
  ],
  playerPlaysThisTurn: [{ cardId, zoneIdx, energy }],
  aiPlaysThisTurn: [{ cardId, zoneIdx }],
  revealedIds: [],          // card IDs that have been flipped
  // Special card flags (set by handlers):
  _captainMarvelCardId: null,
  _draculaCardId: null,
  _jessicaJones: null,
  _ironFistActive: false,
  _daredevilActive: false,
}
```

---

## How abilities work

Every card with an ability has a `snapName` that matches a key in `SNAP_HANDLERS` (in `snapHandlers.js`). When a card is revealed, `applyReveal()` in `gameLogic.js` looks up the handler and calls it:

```js
handler(state, card, zoneIdx, isPlayer) → { state, fx? }
```

- `state` — the full game state (mutated in place, then returned)
- `fx` — optional array of move effects `[{ type:"move", cardId, fromZone, toZone, side }]`
- Handlers are pure functions — no React, no UI concerns
- Cards without a handler reveal silently (no ability fires)

**Important:** handlers receive and mutate a deep clone of state. Never mutate state directly in React — always use `JSON.parse(JSON.stringify(prev))` first.

---

## How drag and drop works

Drag is handled entirely in `GameScreen.jsx` with raw pointer events (not React DnD or any library). Key details:

- `pointerdown` starts the drag sequence
- `pointermove` on `window` tracks position (with `preventDefault` to block scroll)
- `pointerup` / `pointercancel` on `window` ends the drag
- Zone hit-testing is **pure math** (3 equal columns), not DOM rect lookups — this is intentional for iOS reliability
- A drag shorter than 15px threshold is treated as a tap → opens card popup
- Cards placed this turn are "uncommitted" — they can be dragged back to hand or moved to another zone

---

## CSS system

All CSS lives in `src/styles/globalStyles.js` as a single template string exported as `GLOBAL_CSS`. It is injected into `<head>` via:

```js
useEffect(() => {
  const s = document.createElement("style");
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
  return () => document.head.removeChild(s);
}, []);
```

**Do not add separate `.css` files.** All new styles go into `globalStyles.js`.

CSS variables defined in `:root`:
- `--bg`, `--bg2`, `--bg3` — dark background layers
- `--neon` — #b4ff4f (lime green accent)
- `--hot` — #ff5fba (pink)
- `--ice` — #5fd4ff (cyan)
- `--text`, `--muted` — text colors
- `--f-display` — Bangers font (card names, titles)
- `--f-head` — Inter font (UI text)
- `--f-mono` — Orbitron font (numbers, badges)
- `--ch` — per-card hue (set inline via style prop)

---

## Card images

Card images are managed in `src/game/cardImages.js`. Currently all values are `null`, which causes cards to display a colored emoji placeholder instead.

To add images, update the object with URL strings:
```js
const CARD_IMAGES = {
  "c001": "https://...",
  "c002": "https://...",
  // etc.
};
```

Images come from Google Sheets where the original card art is stored. The 77 base cards are `c001` through `c077`.

---

## localStorage keys

| Key | Contents |
|-----|---------|
| `zany_v9` | Full cards array (user's collection with any custom edits) |
| `zany_v8` | Old format — cleared automatically on load |
| `zany_decks_v1` | Saved deck configurations (array of 3 deck objects) |

---

## What NOT to touch without careful thought

- **`snapHandlers.js`** — 60+ card ability implementations. Each handler is carefully balanced. Adding a new handler is fine; modifying existing ones risks breaking card interactions.
- **`snapHelpers.js`** — `_moveCard` and `_canDestroy` have subtle immunity checks (Colossus, Armor) that must be preserved.
- **`gameLogic.js` `zonePower()`** — Iron Man, Blue Marvel, Punisher, and Klaw all have Ongoing effects baked into this function. Order of operations matters.
- **The drag system in `GameScreen.jsx`** — it works on iOS. Be very careful with any pointer event changes.
- **`revealedIds` logic** — cards are face-down until explicitly added to this array. The reveal sequence in `GameScreen.jsx` controls the timing.

---

## Common tasks

**Add a new card ability:**
1. Add the handler to `SNAP_HANDLERS` in `snapHandlers.js` using the card's `snapName` as the key
2. Make sure the card in `cardData.js` has the matching `snapName`

**Add a new zone:**
Add an object to the `ZONES` array in `zones.js` following the existing pattern.

**Change game balance (turns, hand size, max cards per zone):**
Edit the constants in `constants.js` — `TURNS`, `HAND_SIZE`, `MAX_PER_SIDE`.

**Add card images:**
Update the URL values in `src/game/cardImages.js`.

**Add a new screen:**
1. Create the component in `src/screens/`
2. Import it in `App.jsx`
3. Add a `screen === "yourscreen"` branch in the `App()` return

**Modify global styles:**
Edit the CSS string in `src/styles/globalStyles.js`.

---

## Known simplifications / approximations

Some card abilities are approximated rather than fully implemented:

- **Ongoing abilities** (Iron Man, Blue Marvel, Ka-Zar, etc.) are applied at reveal time rather than recalculated every render — power values on cards are the "live" values after all modifiers
- **Iron Fist** sets a flag `_ironFistActive` but the actual move-left behavior needs to be wired into `placeCard()` in `GameScreen.jsx`
- **Jessica Jones** sets a flag but the +5 bonus isn't applied at turn start yet
- **Deadpool / Wolverine** set respawn flags but the destroy hook isn't fully implemented
- **High Evolutionary** is a no-op (Game Start ability requires pre-game setup)

---

## The 77 base cards (name → snapName mapping)

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
