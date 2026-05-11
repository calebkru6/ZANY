// ════════════════════════════════════════════════════════════════════
// screens/LoadingScreen.jsx — Animated loading screen shown on first app load
// ════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

const LOADING_LINES = [
  "Initializing interdimensional portals...",
  "Bribing Detective Scrotum...",
  "Inflating Buttermilk Androgyna...",
  "Calibrating Mr. Plaigan's drain...",
  "Waking Sleepy Butterson...",
  "Counting Bonald Brum's brain cells...",
  "Negotiating with Goblin Addict...",
  "Locating Souvenir Cheeseburger...",
  "Loading ZANY card data...",
  "Preparing interdimensional battlefield...",
  "Shuffling 77 degenerates...",
  "Almost ready...",
];

export function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [lineIdx,  setLineIdx]  = useState(0);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) { p = 100; clearInterval(interval); setTimeout(onDone, 400); }
      setProgress(Math.min(p, 100));
      setLineIdx(Math.floor((Math.min(p, 99) / 100) * LOADING_LINES.length));
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:32,background:"radial-gradient(ellipse at 50% 55%, #16082e 0%, #05050f 68%)",padding:"0 40px"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"clamp(5rem,22vw,10rem)",fontWeight:700,lineHeight:0.9,color:"#b4ff4f",letterSpacing:"-0.03em",textShadow:"0 0 50px rgba(180,255,79,0.45),0 0 120px rgba(180,255,79,0.18)"}}>ZANY</div>
        <div style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.35)",marginTop:8,letterSpacing:"0.12em"}}>INTERDIMENSIONAL CARD BATTLES</div>
      </div>
      <div style={{width:"100%",maxWidth:280,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{height:4,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:2,background:"linear-gradient(90deg,#7040f0,#b4ff4f)",width:`${progress}%`,transition:"width 0.18s ease-out",boxShadow:"0 0 12px rgba(180,255,79,0.6)"}}/>
        </div>
        <div style={{fontFamily:"var(--f-mono,monospace)",fontSize:"0.62rem",color:"rgba(255,255,255,0.4)",letterSpacing:"0.05em",textAlign:"center",minHeight:"1.2em"}}>
          {LOADING_LINES[lineIdx] || "Loading..."}
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
