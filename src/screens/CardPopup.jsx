// ════════════════════════════════════════════════════════════════════
// components/CardPopup.jsx — Full-card popup shown on tap, with
// optional Return button for uncommitted zone cards.
// ════════════════════════════════════════════════════════════════════

import { CardView } from "./CardView";

export function CardPopup({ card, onDismiss, playable = true, onUnplay = null }) {
  return (
    <>
      {/* Backdrop — tappable to dismiss */}
      <div
        style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(5px)",WebkitBackdropFilter:"blur(5px)"}}
        onClick={onDismiss}
      />
      {/* Stage */}
      <div
        style={{position:"fixed",left:"50%",bottom:150,transform:"translateX(-50%)",zIndex:201,display:"flex",flexDirection:"column",alignItems:"center",gap:12,animation:"popup-rise 0.22s cubic-bezier(.22,1,.36,1)",width:"min(240px,64vw)"}}
        onClick={e => e.stopPropagation()}
      >
        <CardView card={card} revealed showName style={{width:"100%",height:"auto",borderRadius:14,boxShadow:"0 20px 50px rgba(0,0,0,0.9)"}} />

        <div style={{background:"rgba(16,16,30,0.95)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:"12px 14px",width:"100%",display:"flex",flexDirection:"column",gap:6,boxShadow:"0 8px 24px rgba(0,0,0,0.7)"}}>
          <div style={{fontFamily:"var(--f-display)",fontSize:"1rem",color:"#fff",letterSpacing:"0.03em",lineHeight:1.1}}>{card.name}</div>
          {card.abilityText && <div style={{fontSize:"0.74rem",color:"#b4ff4f",lineHeight:1.45,fontWeight:500}}>{card.abilityText}</div>}
          {card.flavor && <div style={{fontSize:"0.67rem",color:"rgba(255,255,255,0.4)",fontStyle:"italic",lineHeight:1.35}}>"{card.flavor}"</div>}
          <div style={{display:"flex",gap:10,marginTop:2,fontFamily:"var(--f-mono)",fontSize:"0.68rem",fontWeight:700}}>
            <span style={{color:"#1d8ed4"}}>⚡ {card.energy ?? card.clout}</span>
            <span style={{color:"#e74624"}}>💥 {card.clout}</span>
          </div>
        </div>

        <div style={{display:"flex",gap:8,width:"100%"}}>
          <button className="btn btn-secondary" style={{flex:1,padding:"10px"}} onClick={onDismiss}>Close</button>
          {onUnplay && (
            <button className="btn btn-danger" style={{flex:1,padding:"10px"}} onClick={() => { onUnplay(); onDismiss(); }}>↩ Return</button>
          )}
        </div>
      </div>
    </>
  );
}

export default CardPopup;
