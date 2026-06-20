import { Volume2, VolumeX } from 'lucide-react';
import { Eyebrow, Btn, IconBtn, FDISPLAY, FBODY, FMONO } from './ui.jsx';

export function Title({ thumbs, onBegin, muted, onMute }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      justifyContent: "center", padding: "clamp(20px,5vw,64px)", animation: "mg-fade .6s ease" }}>
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <IconBtn label="sound" onClick={onMute}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</IconBtn>
      </div>
      <div style={{ maxWidth: 640, animation: "mg-rise .7s ease both" }}>
        <Eyebrow>Fremont Solstice Parade · for Alan Turing</Eyebrow>
        <h1 style={{ fontFamily: FDISPLAY, fontWeight: 700, fontSize: "clamp(40px,8.5vw,96px)", lineHeight: .96,
          margin: ".12em 0 .2em", letterSpacing: "-.01em", textShadow: "0 4px 40px rgba(0,0,0,.5)" }}>
          Morpho&shy;genesis
        </h1>
        <p style={{ fontSize: "clamp(13px,1.8vw,18px)", lineHeight: 1.5, color: "rgba(244,238,226,.86)", maxWidth: 480, margin: "0 0 1.2em" }}>
          Sort each marcher into their lane and carry the parade to the bonfire across four acts — from
          afternoon light to sundown — before the longest day burns out.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: "1.4em" }}>
          {thumbs.slice(0, 6).map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: "clamp(34px,5.2vw,52px)", height: "clamp(34px,5.2vw,52px)",
              borderRadius: 10, objectFit: "cover", boxShadow: "0 6px 18px rgba(0,0,0,.4), inset 0 0 0 1px rgba(255,255,255,.12)",
              animation: `mg-float 4s ease-in-out ${i * 0.25}s infinite` }} />
          ))}
        </div>
        <Btn onClick={onBegin} tone="teal">Begin the parade</Btn>
        <div style={{ fontFamily: FMONO, fontSize: "clamp(9px,1.2vw,12px)", color: "rgba(244,238,226,.5)", marginTop: "1.4em", letterSpacing: ".06em" }}>
          every cyclist wears a live Turing reaction–diffusion pattern · 1912–1954
        </div>
      </div>
    </div>
  );
}

