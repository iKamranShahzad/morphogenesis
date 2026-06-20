import { clamp } from '../engine/ParadeGame.js';

export const FDISPLAY = "'Space Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif";
export const FBODY = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
export const FMONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

export function Eyebrow({ children, color = "#f2b441" }) {
  return <div style={{ fontFamily: FMONO, fontSize: "clamp(9px,1.1vw,12px)", letterSpacing: ".34em",
    textTransform: "uppercase", color, opacity: .9 }}>{children}</div>;
}
export function Btn({ children, onClick, tone = "teal", style }) {
  const bg = tone === "teal" ? "linear-gradient(180deg,#27c08c,#159068)"
    : tone === "gold" ? "linear-gradient(180deg,#f6c64f,#e09a2a)" : "linear-gradient(180deg,#ef6a44,#c63f22)";
  const fg = tone === "ember" ? "#fff" : "#06281d";
  return (
    <button className="mg-btn" onClick={onClick} style={{ border: "none", cursor: "pointer",
      padding: "clamp(11px,1.6vw,15px) clamp(22px,3vw,34px)", borderRadius: 999, background: bg, color: fg,
      fontFamily: FDISPLAY, fontWeight: 700, fontSize: "clamp(13px,1.5vw,16px)", letterSpacing: ".06em",
      textTransform: "uppercase", boxShadow: "0 10px 30px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.4)", ...style }}>
      {children}
    </button>
  );
}
export function IconBtn({ children, onClick, label }) {
  return <button className="mg-ico" aria-label={label} onClick={onClick} style={{ width: 38, height: 38, borderRadius: 10,
    border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.07)", color: "#f4eee2",
    display: "grid", placeItems: "center", cursor: "pointer", backdropFilter: "blur(6px)" }}>{children}</button>;
}

export function Meter({ value, color, glow, label, align = "left" }) {
  return (
    <div style={{ minWidth: "clamp(120px,16vw,190px)" }}>
      <div style={{ fontFamily: FMONO, fontSize: "clamp(8px,1vw,10px)", letterSpacing: ".22em",
        color: "rgba(244,238,226,.7)", textAlign: align, marginBottom: 4 }}>{label}</div>
      <div style={{ height: 9, borderRadius: 99, background: "rgba(8,5,18,.55)", overflow: "hidden",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.07)" }}>
        <div style={{ height: "100%", width: `${clamp(value, 0, 100)}%`, borderRadius: 99, background: color,
          boxShadow: `0 0 12px ${glow}`, transition: "width .12s linear, background .3s ease" }} />
      </div>
    </div>
  );
}

export function Stars({ n }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: ".5em 0 .2em" }}>
      {[0, 1, 2].map((i) => (
        <svg key={i} width="34" height="34" viewBox="0 0 24 24" style={{ animation: `mg-star .5s ${0.15 * i + 0.2}s ease both` }}>
          <path d="M12 2l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.8 6.1 20.6l1.3-6.6L2.5 9l6.6-.8z"
            fill={i < n ? "#f2b441" : "rgba(244,238,226,.16)"} stroke={i < n ? "#ffdd8a" : "none"} strokeWidth="1" />
        </svg>
      ))}
    </div>
  );
}
