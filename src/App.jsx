// ════════════════════════════════════════════════════════════════════
// App.jsx — ZANY: Interdimensional Card Battles
// ════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

// ── Core ──────────────────────────────────────────────────────────
import GLOBAL_CSS from "./styles/globalStyles";
import { STORAGE_KEY, STORAGE_KEY_OLD, DECKS_KEY } from "./constants";
import { SPREADSHEET_CARDS } from "./game/cardData";
import CARD_IMAGES from "./game/cardImages";

// ── Screens ───────────────────────────────────────────────────────
import { LoadingScreen }    from "./screens/LoadingScreen";
import { HomeScreen }       from "./screens/HomeScreen";
import { CollectionScreen } from "./screens/CollectionScreen";
import { CardEditorScreen } from "./screens/CardEditorScreen";
import { DeckSelectScreen } from "./screens/DeckSelectScreen";
import { GameScreen }       from "./screens/GameScreen";

// ── Utilities (used only in App) ──────────────────────────────────
import { uid } from "./game/gameLogic";

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  // Inject global CSS once on mount
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // Seed cards from spreadsheet, preserving any user-uploaded images
  const [cards, setCards] = useState(() => {
    try {
      if (typeof STORAGE_KEY_OLD !== "undefined") localStorage.removeItem(STORAGE_KEY_OLD);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      const userImgs  = {};
      const userExtra = {};
      if (stored && stored.length > 0) {
        stored.forEach(c => {
          if (c.imageUrl && c.imageUrl !== CARD_IMAGES[c.id]?.art1) userImgs[c.id] = c.imageUrl;
          userExtra[c.id] = c;
        });
      }
      const merged = SPREADSHEET_CARDS.map(c => ({
        ...c,
        imageUrl: userImgs[c.id] || CARD_IMAGES[c.id]?.art1 || c.imageUrl || null,
        altImageUrl: CARD_IMAGES[c.id]?.art2 || null,
      }));
      const baseIds = new Set(SPREADSHEET_CARDS.map(c => c.id));
      Object.values(userExtra).forEach(c => { if (!baseIds.has(c.id)) merged.push(c); });
      return merged;
    } catch {
      return SPREADSHEET_CARDS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  const [screen,    setScreen]    = useState("home");
  const [editing,   setEditing]   = useState(null);
  const [loaded,    setLoaded]    = useState(false);
  const [deckCards, setDeckCards] = useState(null);

  if (!loaded) return <LoadingScreen onDone={() => setLoaded(true)} />;

  const saveCard = card => {
    setCards(prev => {
      const i = prev.findIndex(c => c.id === card.id);
      return i !== -1 ? prev.map((c, j) => j === i ? card : c) : [...prev, card];
    });
    setScreen("collection");
    setEditing(null);
  };
  const deleteCard = id => setCards(prev => prev.filter(c => c.id !== id));
  const handlePlay = chosenDeck => { setDeckCards(chosenDeck || null); setScreen("game"); };

  if (screen === "game")       return <GameScreen       cards={cards} deckCards={deckCards} onBack={() => setScreen("home")} />;
  if (screen === "deckselect") return <DeckSelectScreen allCards={cards} onPlay={handlePlay} onBack={() => setScreen("home")} />;
  if (screen === "collection") return <CollectionScreen cards={cards} onBack={() => setScreen("home")} onNew={() => { setEditing(null); setScreen("editor"); }} onEdit={c => { setEditing(c); setScreen("editor"); }} onDelete={deleteCard} />;
  if (screen === "editor")     return <CardEditorScreen card={editing} onSave={saveCard} onBack={() => setScreen("collection")} />;
  return <HomeScreen onPlay={() => setScreen("deckselect")} onCollection={() => setScreen("collection")} />;
}
