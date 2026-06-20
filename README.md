# Morphogenesis — A Solstice Parade

A small browser game built for a Solstice Game Jam, themed on the **Fremont Solstice Parade** and dedicated to **Alan Turing**.

Sort marchers — cyclists, pole-puppets, and sun-floats — into their matching lanes and carry the parade to the bonfire before the longest day burns out. Every cyclist wears a **live Gray–Scott reaction–diffusion pattern** computed in real time from Turing's 1952 paper *The Chemical Basis of Morphogenesis*.

## Play

- **Drag** each marcher into their matching lane: bikes → bike lane, puppets → promenade, floats → avenue.
- **Right lane** = Joy, score, and a growing **Flow** multiplier. **Wrong lane** = Chaos, and it breaks your flow.
- A flowing, joyful parade literally scores more (radiance). If **Chaos** hits 100, the parade collapses.
- Survive four escalating acts — *Gathering → Procession → Golden Hour → Sundown* — and reach the bonfire.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Structure

```
src/
  engine/ParadeGame.js   reaction–diffusion, simulation, canvas renderer, audio (framework-free)
  components/            React UI: loading, title, HUD, act banner, pause, end
  App.jsx                phase machine wiring engine ↔ UI
```

The engine is plain JS and renders the living world to a canvas; React owns every UI overlay, which keeps the interface crisp and aligned on any screen.

## Dedication

For Alan Turing (1912–1954), prosecuted in 1952 for being different. The patterns his equations describe are everywhere in living things — a celebration of the freedom to be seen exactly as you are.

> "We can only see a short distance ahead, but we can see plenty there that needs to be done." — A. M. Turing, 1950
