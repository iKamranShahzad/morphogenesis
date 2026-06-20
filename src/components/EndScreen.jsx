import { RotateCcw } from 'lucide-react';
import { Eyebrow, Btn, Stars, FDISPLAY, FBODY, FMONO } from './ui.jsx';

export function EndScreen({ result, thumbs, onRestart }) {
  const { win, score, stars, delivered, matched, matchPct } = result;
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "4%",
      background: win ? "rgba(8,5,16,.45)" : "rgba(20,6,6,.5)", animation: "mg-fade .4s ease" }}>
      <div style={{ width: "min(560px,94%)", maxHeight: "94%", overflow: "auto", textAlign: "center",
        padding: "clamp(22px,4vw,40px)", borderRadius: 22, background: "rgba(12,8,22,.78)",
        backdropFilter: "blur(14px)", boxShadow: "0 30px 90px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.08)",
        animation: "mg-rise .5s ease both" }}>
        <Eyebrow color={win ? "#f2b441" : "#e2562b"}>{win ? "Sundown reached" : "The parade seized up"}</Eyebrow>
        <h2 style={{ fontFamily: FDISPLAY, fontWeight: 700, fontSize: "clamp(26px,4.6vw,46px)", lineHeight: 1.02,
          margin: ".18em 0", color: win ? "#f2b441" : "#e2562b" }}>
          {win ? "The bonfire is lit" : "Too much chaos"}
        </h2>
        {win && <Stars n={stars} />}
        <div style={{ fontFamily: FMONO, fontSize: "clamp(18px,2.6vw,26px)", fontWeight: 700, margin: ".3em 0 .1em" }}>
          {score.toLocaleString()}
        </div>
        <div style={{ fontFamily: FMONO, fontSize: "clamp(10px,1.4vw,13px)", color: "rgba(244,238,226,.7)" }}>
          delivered {delivered} · right lane {matched} · {matchPct}% in tune
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "1.1em 0" }}>
          {thumbs.slice(0, 6).map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: "clamp(30px,5vw,46px)", height: "clamp(30px,5vw,46px)",
              borderRadius: 8, objectFit: "cover", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12)" }} />
          ))}
        </div>
        <p style={{ fontSize: "clamp(12px,1.55vw,15px)", lineHeight: 1.55, color: "rgba(244,238,226,.9)", margin: "0 auto 1em", maxWidth: 460 }}>
          Every pattern in this parade was grown from Alan Turing’s 1952 morphogenesis equations — the same simple
          rules that paint the spots and stripes of living things. This solstice march celebrates the freedom to be
          seen exactly as you are: a freedom Turing, prosecuted in 1952 for being gay, was denied.
        </p>
        <p style={{ fontFamily: FDISPLAY, fontStyle: "italic", fontSize: "clamp(11px,1.5vw,14px)", color: "#f2b441", margin: "0 0 1.4em" }}>
          “We can only see a short distance ahead, but we can see plenty there that needs to be done.” — A. M. Turing, 1950
        </p>
        <Btn onClick={onRestart} tone={win ? "gold" : "teal"}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><RotateCcw size={16} /> March again</span>
        </Btn>
      </div>
    </div>
  );
}
