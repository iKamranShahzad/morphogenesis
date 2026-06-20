import { Eyebrow, FDISPLAY, FMONO } from './ui.jsx';

export function Loading({ progress }) {
  const pct = Math.round(progress * 100);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-end", paddingBottom: "11%", textAlign: "center", animation: "mg-fade .6s ease" }}>
      <div style={{ animation: "mg-rise .7s ease both" }}>
        <Eyebrow>A. M. Turing · 1952</Eyebrow>
        <div style={{ fontFamily: FDISPLAY, fontWeight: 700, fontSize: "clamp(28px,5.6vw,64px)",
          letterSpacing: ".02em", margin: ".18em 0 .12em",
          background: "linear-gradient(90deg,#f4eee2,#ffd27a,#f4eee2)", backgroundSize: "200% auto",
          WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          animation: "mg-shimmer 4s linear infinite" }}>MORPHOGENESIS</div>
        <div style={{ fontFamily: FMONO, fontSize: "clamp(10px,1.4vw,13px)", color: "rgba(244,238,226,.7)", letterSpacing: ".12em" }}>
          growing patterns from Gray–Scott reaction–diffusion
        </div>
      </div>
      <div style={{ width: "min(46%,360px)", marginTop: "clamp(16px,3vw,30px)", display: "flex",
        alignItems: "center", gap: 12, animation: "mg-rise .7s .1s ease both" }}>
        <div style={{ flex: 1, height: 6, borderRadius: 99, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99,
            background: "linear-gradient(90deg,#27c08c,#84d3ea)", transition: "width .2s ease" }} />
        </div>
        <div style={{ fontFamily: FMONO, fontSize: 12, color: "rgba(244,238,226,.8)", width: 38, textAlign: "right" }}>{pct}%</div>
      </div>
    </div>
  );
}

