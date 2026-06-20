import { Play } from 'lucide-react';
import { Btn, FDISPLAY } from './ui.jsx';

export function PauseScreen({ onResume, onQuit }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center",
      background: "rgba(6,4,14,.35)", backdropFilter: "blur(6px)", animation: "mg-fade .25s ease" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: FDISPLAY, fontWeight: 700, fontSize: "clamp(26px,4.4vw,44px)", marginBottom: ".6em" }}>Paused</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn onClick={onResume} tone="teal"><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Play size={16} /> Resume</span></Btn>
          <Btn onClick={onQuit} tone="ember">Quit</Btn>
        </div>
      </div>
    </div>
  );
}

