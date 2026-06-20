import { FDISPLAY, FBODY, FMONO } from './ui.jsx';

export function ActBanner({ act }) {
  return (
    <div key={act.index} style={{ position: "absolute", top: "30%", left: 0, right: 0, textAlign: "center",
      pointerEvents: "none", animation: "mg-act 3.4s ease forwards" }}>
      <div style={{ fontFamily: FMONO, fontSize: "clamp(9px,1.2vw,12px)", letterSpacing: ".4em", color: "#f2b441" }}>
        ACT {["I", "II", "III", "IV"][act.index]}
      </div>
      <div style={{ fontFamily: FDISPLAY, fontWeight: 700, fontSize: "clamp(28px,5vw,52px)",
        textShadow: "0 4px 30px rgba(0,0,0,.6)" }}>{act.name}</div>
      <div style={{ fontFamily: FBODY, fontSize: "clamp(11px,1.5vw,15px)", color: "rgba(244,238,226,.8)", fontStyle: "italic" }}>
        {act.sub}
      </div>
    </div>
  );
}

