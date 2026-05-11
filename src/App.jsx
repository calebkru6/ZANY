// ════════════════════════════════════════════════════════════════════
// App.jsx — ZANY: Interdimensional Card Battles
// ════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";

// ── Extracted modules ─────────────────────────────────────────────
import { STORAGE_KEY, STORAGE_KEY_OLD, DECKS_KEY, TURNS, MAX_PER_SIDE, DEBUG_DRAG, HAND_SIZE } from "./constants";
import useTilt from "./hooks/useTilt";
import { _snapshotPowers, _diffPowers } from "./game/snapHelpers";
import SNAP_HANDLERS from "./game/snapHandlers";
import CARD_IMAGES from "./game/cardImages";

// ── Everything else in your file continues unchanged below ────────
