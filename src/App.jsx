import { useEffect, useRef, useState, useCallback } from 'react';
import { ParadeGame } from './engine/ParadeGame.js';
import { FBODY } from './components/ui.jsx';
import { Loading } from './components/Loading.jsx';
import { Title } from './components/Title.jsx';
import { ActBanner } from './components/ActBanner.jsx';
import { Hud } from './components/Hud.jsx';
import { PauseScreen } from './components/PauseScreen.jsx';
import { EndScreen } from './components/EndScreen.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ joy: 48, chaos: 0, score: 0, combo: 0, mult: 1, act: 0, timeLeft: 105 });
  const [result, setResult] = useState(null);
  const [thumbs, setThumbs] = useState([]);
  const [muted, setMuted] = useState(false);
  const [act, setAct] = useState(null);

  useEffect(() => {
    const g = new ParadeGame(canvasRef.current, {
      onProgress: setProgress, onPhase: setPhase, onStats: setStats,
      onResult: setResult, onThumbs: setThumbs, onAct: setAct,
    });
    gameRef.current = g; g.start();
    return () => g.destroy();
  }, []);

  const begin = useCallback(() => { setAct(null); gameRef.current?.beginPlay(); }, []);
  const pause = useCallback(() => gameRef.current?.pause(), []);
  const resume = useCallback(() => gameRef.current?.resume(), []);
  const restart = useCallback(() => { setAct(null); gameRef.current?.restart(); }, []);
  const toggleMute = useCallback(() => { setMuted((m) => { const nm = !m; gameRef.current?.setMuted(nm); return nm; }); }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#070510", overflow: "hidden",
      fontFamily: FBODY, color: "#f4eee2" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes mg-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mg-rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
        @keyframes mg-pulse { 0%,100% { transform: scale(1); opacity: .9 } 50% { transform: scale(1.06); opacity: 1 } }
        @keyframes mg-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
        @keyframes mg-shimmer { 0% { background-position: 0% } 100% { background-position: 200% } }
        @keyframes mg-star { from { opacity: 0; transform: scale(.3) rotate(-30deg) } to { opacity: 1; transform: none } }
        @keyframes mg-act { 0% { opacity: 0; transform: translateY(10px) } 12% { opacity: 1; transform: none } 80% { opacity: 1 } 100% { opacity: 0 } }
        .mg-btn { transition: transform .12s ease, filter .2s ease; }
        .mg-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
        .mg-btn:active { transform: translateY(0) scale(.98); }
        .mg-ico { transition: background .2s ease, transform .12s ease; }
        .mg-ico:hover { background: rgba(255,255,255,.16); transform: translateY(-1px); }
        .mg-ico:active { transform: scale(.94); }
      `}</style>

      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", touchAction: "none" }} />
        {/* vignette for depth */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(120% 80% at 50% 42%, transparent 55%, rgba(4,2,10,.5) 100%)" }} />

        {phase === "loading" && <Loading progress={progress} />}
        {phase === "title" && <Title thumbs={thumbs} onBegin={begin} muted={muted} onMute={toggleMute} />}
        {(phase === "playing" || phase === "paused") && (
          <>
            <Hud stats={stats} onPause={pause} muted={muted} onMute={toggleMute} />
            {act && <ActBanner act={act} />}
          </>
        )}
        {phase === "paused" && <PauseScreen onResume={resume} onQuit={restart} />}
        {(phase === "win" || phase === "lose") && result && (
          <EndScreen result={result} thumbs={thumbs} onRestart={restart} />
        )}
      </div>
    </div>
  );
}

