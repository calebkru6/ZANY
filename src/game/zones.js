// ════════════════════════════════════════════════════════════════════
// game/zones.js — Zone definitions (name, ability, visual theming)
// Drop a URL or base64 data URI into bgImage for custom zone art.
// ════════════════════════════════════════════════════════════════════

const ZONES = [
  {
    id: "z0",
    name: "The Vortex",
    ability: "On Reveal: cards played here gain +1 Power.",
    bgImage: null,
    sky:     "#3a0d6e",
    horizon: "#a83fc4",
    ground:  "#0a0118",
    accent:  "rgba(200,80,255,0.35)",
  },
  {
    id: "z1",
    name: "Glitch Alley",
    ability: "Ongoing: each side's lowest-Power card gets +2.",
    bgImage: null,
    sky:     "#003848",
    horizon: "#1ae0ff",
    ground:  "#000810",
    accent:  "rgba(95,212,255,0.28)",
  },
  {
    id: "z2",
    name: "The Fringe",
    ability: "On Reveal: the first card played here draws +1 card.",
    bgImage: null,
    sky:     "#4a2000",
    horizon: "#ff9020",
    ground:  "#100400",
    accent:  "rgba(255,160,40,0.32)",
  },
];

export default ZONES;
