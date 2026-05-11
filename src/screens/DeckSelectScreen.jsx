// ════════════════════════════════════════════════════════════════════
// screens/DeckSelectScreen.jsx — Deck selection + deck builder
// ════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { DECKS_KEY } from "../constants";
import { uid, hueOf, emojiOf, shuffle } from "../game/gameLogic";

// ─── Deck helpers ─────────────────────────────────────────────────
function loadDecks() {
  try { return JSON.parse(localStorage.getItem(DECKS_KEY) || "null") || []; } catch { return []; }
}
function saveDecks(decks) {
  try { localStorage.setItem(DECKS_KEY, JSON.stringify(decks)); } catch {}
}
function makeRandomDeck(allCards) {
  return shuffle([...allCards]).slice(0, 12).map(c => c.id);
}

// ─── DeckBuilderScreen ────────────────────────────────────────────
function DeckBuilderScreen({ deck, allCards, onSave, onBack }) {
  const [name,    setName]    = useState(deck?.name    || "New Deck");
  const [cardIds, setCardIds] = useState(deck?.cardIds || []);

  const toggle = id => {
    setCardIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 12) return prev;
      return [...prev, id];
    });
  };

  const handleSave = () => {
    onSave({ ...deck, name: name.trim() || "Deck", cardIds, id: deck?.id || uid() });
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <input
          value={name} onChange={e => setName(e.target.value)}
          style={{flex:1,background:"transparent",border:"none",color:"var(--text)",fontSize:"1.1rem",fontWeight:700,outline:"none",textAlign:"center"}}
          maxLength={20}
        />
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
      </div>
      <div className="deck-builder-bar">
        <span className="deck-bar-count">{cardIds.length}/12 cards selected</span>
        <button className="btn btn-sm btn-secondary" onClick={() => setCardIds(makeRandomDeck(allCards))}>🎲 Random</button>
        <button className="btn btn-sm btn-danger" onClick={() => setCardIds([])}>Clear</button>
      </div>
      <div className="deck-builder-grid">
        {allCards.map(card => {
          const inDeck = cardIds.includes(card.id);
          const hue = hueOf(card);
          return (
            <div key={card.id} className="deck-builder-slot" onClick={() => toggle(card.id)}>
              <div className={`coll-card${inDeck?" in-deck":""}`} style={{"--ch":hue}}>
                {card.imageUrl
                  ? <img className="coll-card-art" src={card.imageUrl} alt={card.name} />
                  : <div className="coll-card-emoji">{emojiOf(hue)}</div>}
                <div className="coll-card-overlay"/>
                <div className="coll-card-badge">{card.clout}</div>
                <div className="coll-card-energy">{card.energy ?? card.clout}</div>
                <div className="coll-card-name">{card.name}</div>
              </div>
              {inDeck && <div className="deck-count-badge">✓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DeckSelectScreen ─────────────────────────────────────────────
const DECK_ICONS    = ["⚔️","🔮","💀","🌀","🎭","🦅"];
const DEFAULT_DECKS = [
  { id:"deck1", name:"Deck 1", cardIds:[] },
  { id:"deck2", name:"Deck 2", cardIds:[] },
  { id:"deck3", name:"Deck 3", cardIds:[] },
];

export function DeckSelectScreen({ allCards, onPlay, onBack }) {
  const [decks,    setDecks]   = useState(() => {
    const saved = loadDecks();
    return DEFAULT_DECKS.map(d => saved.find(s => s.id === d.id) || d);
  });
  const [selected, setSelected] = useState(null);
  const [building, setBuilding] = useState(null);

  const persistAndSet = updated => { setDecks(updated); saveDecks(updated); };

  const handleSaveDeck = deck => {
    persistAndSet(decks.map(d => d.id === deck.id ? deck : d));
    setBuilding(null);
  };

  const resolveCards = (cardIds, allCards) => {
    let picked = cardIds.map(id => allCards.find(c => c.id === id)).filter(Boolean);
    if (picked.length < 12) {
      const used = new Set(picked.map(c => c.id));
      const pool = shuffle(allCards.filter(c => !used.has(c.id)));
      while (picked.length < 12 && pool.length) picked.push(pool.shift());
    }
    return shuffle(picked.slice(0, 12));
  };

  if (building) {
    return (
      <DeckBuilderScreen
        deck={building}
        allCards={allCards}
        onSave={handleSaveDeck}
        onBack={() => setBuilding(null)}
      />
    );
  }

  const handlePlay = () => {
    if (!selected) return;
    const deck = decks.find(d => d.id === selected);
    onPlay(resolveCards(deck?.cardIds || [], allCards));
  };

  return (
    <div className="screen deck-select-screen">
      <div className="deck-select-header">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <span className="deck-select-title">Choose Your Deck</span>
      </div>

      <div className="deck-list">
        <div className="deck-card" onClick={() => onPlay(shuffle([...allCards]).slice(0,12))} style={{background:"linear-gradient(135deg,rgba(112,64,240,0.2),rgba(160,112,255,0.1))"}}>
          <div className="deck-card-icon">🎲</div>
          <div className="deck-card-info">
            <div className="deck-card-name">Random Deck</div>
            <div className="deck-card-sub">12 random cards — pure chaos</div>
          </div>
          <button className="btn btn-primary btn-sm">Play</button>
        </div>

        {decks.map((deck, i) => {
          const deckCards  = (deck.cardIds || []).map(id => allCards.find(c => c.id === id)).filter(Boolean);
          const isSelected = selected === deck.id;
          return (
            <div key={deck.id} className={`deck-card${isSelected?" deck-selected":""}`}
              onClick={() => setSelected(p => p === deck.id ? null : deck.id)}>
              <div className="deck-card-icon">{DECK_ICONS[i]}</div>
              <div className="deck-card-info">
                <div className="deck-card-name">{deck.name}</div>
                <div className="deck-card-sub">
                  {deckCards.length > 0
                    ? `${deckCards.length} cards · avg ${(deckCards.reduce((s,c)=>s+(c.energy??c.clout),0)/deckCards.length).toFixed(1)} energy`
                    : "Empty — tap Edit to build"}
                </div>
              </div>
              <div className="deck-card-actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn-sm btn-secondary" onClick={() => setBuilding(deck)}>Edit</button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="deck-play-bar">
          <button className="btn btn-primary" style={{width:"100%",padding:"14px"}} onClick={handlePlay}>
            ▶ Play with {decks.find(d=>d.id===selected)?.name}
          </button>
        </div>
      )}
    </div>
  );
}

export default DeckSelectScreen;
