// ════════════════════════════════════════════════════════════════════
// screens/CollectionScreen.jsx — Card collection grid + preview
// ════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { hueOf, emojiOf } from "../game/gameLogic";
import useTilt from "../hooks/useTilt";
import { CardView } from "../components/CardView";

function CollectionCard({ card, selected, onSelect }) {
  const hue = hueOf(card);
  const tiltRef = useTilt(10, 1.04);
  return (
    <div className="card-grid-item" onClick={onSelect}>
      <div ref={tiltRef} className={`coll-card card-tiltable${selected ? " coll-selected" : ""}`} style={{"--ch": hue}}>
        {card.imageUrl
          ? <img className="coll-card-art" src={card.imageUrl} alt={card.name} />
          : <div className="coll-card-emoji">{emojiOf(hue)}</div>}
        <div className="coll-card-overlay" />
        <div className="coll-shine" />
        <div className="coll-card-badge">{card.clout}</div>
        <div className="coll-card-energy">{card.energy ?? card.clout}</div>
        <div className="coll-card-name">{card.name}</div>
      </div>
    </div>
  );
}

export function CollectionScreen({ cards, onBack, onNew, onEdit, onDelete }) {
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [sort,     setSort]     = useState("default");
  const [selected, setSelected] = useState(null);

  const visible = cards
    .filter(c => {
      const ms = c.name.toLowerCase().includes(search.toLowerCase());
      const mf = filter === "all" ? true : filter === "ability" ? !!c.abilityText : filter === "no-art" ? !c.imageUrl : true;
      return ms && mf;
    })
    .sort((a, b) => {
      if (sort === "energy-asc")  return (a.energy ?? a.clout) - (b.energy ?? b.clout);
      if (sort === "energy-desc") return (b.energy ?? b.clout) - (a.energy ?? a.clout);
      if (sort === "power-asc")   return a.clout - b.clout;
      if (sort === "power-desc")  return b.clout - a.clout;
      return 0;
    });

  const selectedCard = cards.find(c => c.id === selected);

  const cycleSort = (field) => {
    if (sort === `${field}-asc`)       setSort(`${field}-desc`);
    else if (sort === `${field}-desc`) setSort("default");
    else                               setSort(`${field}-asc`);
  };
  const sortIcon = (field) => {
    if (sort === `${field}-asc`)  return "↑";
    if (sort === `${field}-desc`) return "↓";
    return "↕";
  };

  return (
    <div className="screen" style={{paddingBottom: selected ? 80 : 0}} onClick={() => setSelected(null)}>
      <div className="screen-header" onClick={e => e.stopPropagation()}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <h2>Cards</h2>
        <button className="btn btn-primary" onClick={onNew}>+ New</button>
      </div>

      <div className="collection-toolbar" onClick={e => e.stopPropagation()}>
        <div className="collection-toolbar-row">
          <input className="search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="collection-toolbar-row">
          <div className="filter-tabs">
            {[["all","All"],["ability","Ability"],["no-art","No Art"]].map(([v,l]) => (
              <button key={v} className={`filter-tab${filter===v?" active":""}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
            <button
              className={`filter-tab${sort.startsWith("energy") ? " active" : ""}`}
              style={{color: sort.startsWith("energy") ? "#1d8ed4" : undefined, borderColor: sort.startsWith("energy") ? "#1d8ed4" : undefined, background: sort.startsWith("energy") ? "rgba(29,142,212,0.1)" : undefined}}
              onClick={() => cycleSort("energy")}
            >⚡ {sortIcon("energy")}</button>
            <button
              className={`filter-tab${sort.startsWith("power") ? " active" : ""}`}
              style={{color: sort.startsWith("power") ? "#e74624" : undefined, borderColor: sort.startsWith("power") ? "#e74624" : undefined, background: sort.startsWith("power") ? "rgba(231,70,36,0.1)" : undefined}}
              onClick={() => cycleSort("power")}
            >💥 {sortIcon("power")}</button>
          </div>
        </div>
      </div>

      <div className="collection-count">{visible.length} / {cards.length}</div>

      <div className="card-grid" onClick={e => e.stopPropagation()}>
        {!visible.length && <div className="empty-state">No cards match.</div>}
        {visible.map(card => (
          <CollectionCard
            key={card.id}
            card={card}
            selected={selected === card.id}
            onSelect={e => { e.stopPropagation(); setSelected(p => p === card.id ? null : card.id); }}
          />
        ))}
      </div>

      {selectedCard && (
        <div className="coll-preview-backdrop" onClick={() => setSelected(null)}>
          <div className="coll-preview-stage" onClick={e => e.stopPropagation()}>
            <CardView card={selectedCard} showName revealed className="coll-preview-card" />
            <div className="coll-preview-info">
              <div className="coll-preview-name">{selectedCard.name}</div>
              {selectedCard.abilityText && <div className="coll-preview-ability">{selectedCard.abilityText}</div>}
              {selectedCard.flavor && <div className="coll-preview-flavor">"{selectedCard.flavor}"</div>}
              <div className="coll-preview-stats">
                <span className="coll-stat-energy">⚡ {selectedCard.energy ?? selectedCard.clout} Energy</span>
                <span className="coll-stat-power">💥 {selectedCard.clout} Power</span>
              </div>
            </div>
            <div className="coll-preview-actions">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setSelected(null); onEdit(selectedCard); }}>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectionScreen;
