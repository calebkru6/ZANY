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
