import { Pause, Volume2, VolumeX } from 'lucide-react';
import { Meter, IconBtn, FDISPLAY, FBODY, FMONO } from './ui.jsx';
import { clamp, ACTS } from '../engine/ParadeGame.js';

export function Hud({ stats, onPause, muted, onMute }) {
  const danger = stats.chaos > 70;
  const actName = ACTS[clamp(stats.act, 0, 3)].name;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 96,
        background: "linear-gradient(180deg,rgba(7,5,16,.62),rgba(7,5,16,0))" }} />
      <div style={{ position: "absolute", top: "clamp(12px,2.4vw,20px)", left: "clamp(14px,2.6vw,24px)",
        right: "clamp(14px,2.6vw,24px)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <Meter value={stats.joy} color="linear-gradient(90deg,#159068,#27c08c)" glow="rgba(39,192,140,.6)" label="JOY" />
        <div style={{ textAlign: "center", flex: "0 0 auto" }}>
          <div style={{ fontFamily: FMONO, fontSize: "clamp(8px,1vw,10px)", letterSpacing: ".2em", color: "#f2b441" }}>
            {actName.toUpperCase()}
          </div>
          <div style={{ fontFamily: FMONO, fontWeight: 700, fontSize: "clamp(16px,2.4vw,24px)", color: "#ffd27a", lineHeight: 1.15 }}>
            {Math.ceil(stats.timeLeft)}s
          </div>
          <div style={{ fontFamily: FMONO, fontSize: "clamp(7px,.95vw,9px)", letterSpacing: ".2em", color: "rgba(244,238,226,.5)" }}>
            TO SUNDOWN
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <Meter value={stats.chaos} color={danger ? "linear-gradient(90deg,#e2562b,#ff7a3a)" : "linear-gradient(90deg,#c77a2a,#e0a23a)"}
            glow={danger ? "rgba(226,86,43,.7)" : "rgba(224,162,58,.4)"} label="CHAOS" align="right" />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {stats.mult > 1.01 && (
              <div style={{ fontFamily: FMONO, fontSize: "clamp(10px,1.3vw,13px)", color: "#f2b441",
                animation: stats.mult >= 2 ? "mg-pulse 1s ease-in-out infinite" : "none" }}>
                ×{stats.mult.toFixed(1)} flow
              </div>
            )}
            <div style={{ fontFamily: FMONO, fontWeight: 700, fontSize: "clamp(16px,2.4vw,24px)", color: "#f4eee2" }}>
              {String(stats.score).padStart(5, "0")}
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "clamp(10px,1.8vw,16px)", left: 0, right: 0, textAlign: "center",
        fontFamily: FMONO, fontSize: "clamp(8px,1.1vw,11px)", color: "rgba(244,238,226,.45)", letterSpacing: ".05em" }}>
        drag a marcher into their matching lane · a flowing parade scores more · wrong lane breeds chaos
      </div>
      <div style={{ position: "absolute", top: "clamp(58px,8.4vw,76px)", right: "clamp(14px,2.6vw,24px)",
        display: "flex", gap: 8, pointerEvents: "auto" }}>
        <IconBtn label="pause" onClick={onPause}><Pause size={18} /></IconBtn>
        <IconBtn label="sound" onClick={onMute}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</IconBtn>
      </div>
    </div>
  );
}

