/* ----------------------------------------------------------------- colour helpers */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
function hx(h) { h = h.replace("#", ""); if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
function mix(c1, c2, t) { const a = hx(c1), b = hx(c2);
  return `rgb(${Math.round(lerp(a[0],b[0],t))},${Math.round(lerp(a[1],b[1],t))},${Math.round(lerp(a[2],b[2],t))})`; }
function rgba(c, al) { let r,g,b; if (c[0] === "#") { [r,g,b] = hx(c); }
  else { const m = c.match(/[\d.]+/g); r=+m[0]; g=+m[1]; b=+m[2]; } return `rgba(${r},${g},${b},${al})`; }
function ramp(stops, t) { t = clamp(t,0,1); const n = stops.length-1; const f = t*n; let i = Math.floor(f);
  if (i >= n) i = n-1; return mix(stops[i], stops[i+1], f-i); }

/* ----------------------------------------------------------------- reaction–diffusion */
const RD_PRESETS = [
  ["spots", 0.0367, 0.0649], ["coral", 0.0545, 0.0620], ["maze", 0.0340, 0.0618],
  ["worms", 0.0300, 0.0565], ["lace", 0.0460, 0.0630], ["fingerprint", 0.0322, 0.0590],
];
const RD_N = 56, RD_ITERS = 2400, RD_CHUNK = 150;
const PALETTES = [
  ["#241543","#f6c8e2"], ["#0c5848","#eef6c4"], ["#6e1934","#f4b63f"], ["#13315c","#84d3ea"],
  ["#34134c","#f5853a"], ["#0a342e","#efe6d7"], ["#3a0f2e","#ffd27a"], ["#102a44","#a9e7c8"],
];

/* ----------------------------------------------------------------- progression */
const ACTS = [
  { name: "Gathering",   sub: "afternoon light",     until: 0.25, types: ["cyclist","cyclist","puppet"],            spawn: [2.0, 1.6],  surge: null },
  { name: "Procession",  sub: "the avenue fills",     until: 0.55, types: ["cyclist","cyclist","puppet","float"],    spawn: [1.55, 1.2], surge: [12, 15] },
  { name: "Golden Hour", sub: "the long light turns",  until: 0.80, types: ["cyclist","puppet","float","cyclist"],    spawn: [1.1, 0.92], surge: [9, 12] },
  { name: "Sundown",     sub: "carry the fire home",   until: 1.01, types: ["cyclist","puppet","float","cyclist","float"], spawn: [0.86, 0.7], surge: [7, 10] },
];
function actIndexFor(p) { for (let i = 0; i < ACTS.length; i++) if (p < ACTS[i].until) return i; return ACTS.length - 1; }

/* ----------------------------------------------------------------- the engine */
class ParadeGame {
  constructor(canvas, cbs) {
    this.cv = canvas; this.ctx = canvas.getContext("2d", { alpha: false });
    this.cbs = cbs || {}; this.dpr = 1; this.W = 1000; this.H = 620;
    this.phase = "loading"; this.alive = true;
    this.rd = { grids: [], idx: 0, it: 0, done: false, a: null, b: null, a2: null, b2: null };
    this.patPool = []; this.units = []; this.parts = []; this.surge = null; this.uid = 1;
    this.audio = makeAudio();
    this.stars = Array.from({ length: 60 }, () => ({ fx: Math.random(), fy: Math.random(), ph: Math.random() * 6.28 }));
    this.statClock = 0; this.last = 0; this.acc = 0; this.timeAll = 0; this.fireFlare = 0;
    this.resetRound();
    this.layout();
    this._loop = this._loop.bind(this);
    this._onPD = this._onPD.bind(this); this._onPM = this._onPM.bind(this);
    this._onPU = this._onPU.bind(this);
    canvas.addEventListener("pointerdown", this._onPD);
    canvas.addEventListener("pointermove", this._onPM);
    canvas.addEventListener("pointerup", this._onPU);
    canvas.addEventListener("pointercancel", this._onPU);
    this.ro = new ResizeObserver(() => this.fit());
    this.ro.observe(canvas);
    this.rdInit();
  }
  destroy() { this.alive = false;
    this.cv.removeEventListener("pointerdown", this._onPD);
    this.cv.removeEventListener("pointermove", this._onPM);
    this.cv.removeEventListener("pointerup", this._onPU);
    this.cv.removeEventListener("pointercancel", this._onPU);
    if (this.ro) this.ro.disconnect();
    if (this.audio) this.audio.stop(); }

  layout() {
    const W = this.W, H = this.H;
    this.GUTTER = Math.min(150, W * 0.15); this.BONX = W - 96; this.SPAWN = this.GUTTER - 16;
    this.S_TOP = H * 0.585; this.S_BOT = H - 24;
    const band = this.S_BOT - this.S_TOP, lh = band / 3; this.LH = lh;
    this.LANES = [
      { y: this.S_TOP + lh*0.5, type: "cyclist", name: "Bike lane" },
      { y: this.S_TOP + lh*1.5, type: "puppet",  name: "Puppet promenade" },
      { y: this.S_TOP + lh*2.5, type: "float",   name: "Float avenue" },
    ];
  }
  fit() {
    const r = this.cv.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = Math.max(2, Math.round(r.width * this.dpr));
    this.cv.height = Math.max(2, Math.round(r.height * this.dpr));
    this.W = r.width || 1000; this.H = r.height || 620;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.layout();
  }
  start() { this.fit(); this.last = 0; this._raf = requestAnimationFrame(this._loop); }

  /* ---- reaction diffusion ---- */
  rdInit() {
    const N = RD_N*RD_N; const rd = this.rd;
    rd.a = new Float32Array(N).fill(1); rd.b = new Float32Array(N).fill(0);
    rd.a2 = new Float32Array(N); rd.b2 = new Float32Array(N);
    for (let s=0;s<18;s++){ const cx=(Math.random()*RD_N)|0, cy=(Math.random()*RD_N)|0, r=2;
      for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){ const px=(cx+x+RD_N)%RD_N, py=(cy+y+RD_N)%RD_N;
        rd.b[py*RD_N+px]=1; rd.a[py*RD_N+px]=0; } }
    rd.it=0;
  }
  rdRun(steps) {
    const N=RD_N, rd=this.rd; let a=rd.a,b=rd.b,a2=rd.a2,b2=rd.b2;
    const f=RD_PRESETS[rd.idx][1], k=RD_PRESETS[rd.idx][2], Du=1.0, Dv=0.5;
    for(let s=0;s<steps;s++){
      for(let y=0;y<N;y++){ const ym=((y-1+N)%N)*N, yp=((y+1)%N)*N, yo=y*N;
        for(let x=0;x<N;x++){ const xm=(x-1+N)%N, xp=(x+1)%N, i=yo+x; const A=a[i],B=b[i];
          const lA=-A+0.2*(a[yo+xm]+a[yo+xp]+a[ym+x]+a[yp+x])+0.05*(a[ym+xm]+a[ym+xp]+a[yp+xm]+a[yp+xp]);
          const lB=-B+0.2*(b[yo+xm]+b[yo+xp]+b[ym+x]+b[yp+x])+0.05*(b[ym+xm]+b[ym+xp]+b[yp+xm]+b[yp+xp]);
          const r=A*B*B; let na=A+(Du*lA-r+f*(1-A)), nb=B+(Dv*lB+r-(k+f)*B);
          a2[i]=na<0?0:na>1?1:na; b2[i]=nb<0?0:nb>1?1:nb; } }
      const ta=a;a=a2;a2=ta; const tb=b;b=b2;b2=tb;
    }
    rd.a=a;rd.b=b;rd.a2=a2;rd.b2=b2;
  }
  rdToCanvas(grid, pal, size) {
    const oc=document.createElement("canvas"); oc.width=RD_N; oc.height=RD_N;
    const octx=oc.getContext("2d"); const img=octx.createImageData(RD_N,RD_N);
    const lo=hx(pal[0]), hi=hx(pal[1]);
    for(let i=0;i<RD_N*RD_N;i++){ let t=clamp(grid[i]/0.42,0,1); t=smooth(t); const o=i*4;
      img.data[o]=lo[0]+(hi[0]-lo[0])*t; img.data[o+1]=lo[1]+(hi[1]-lo[1])*t;
      img.data[o+2]=lo[2]+(hi[2]-lo[2])*t; img.data[o+3]=255; }
    octx.putImageData(img,0,0);
    const dst=document.createElement("canvas"); dst.width=dst.height=size;
    const dctx=dst.getContext("2d"); dctx.imageSmoothingEnabled=true; dctx.drawImage(oc,0,0,size,size);
    return dst;
  }
  // Pre-render every pattern once, reuse references during play (no per-spawn allocation).
  buildAssets() {
    this.thumbs = this.rd.grids.map((g,i)=>this.rdToCanvas(g, PALETTES[i%PALETTES.length], 96));
    this.patPool = [];
    this.rd.grids.forEach((g)=>{ for(let v=0; v<3; v++){ const pi=(Math.random()*PALETTES.length)|0;
      this.patPool.push({ cv:this.rdToCanvas(g, PALETTES[pi], 72), palIdx:pi }); } });
    const urls=[]; try{ urls.push(...this.thumbs.map(c=>c.toDataURL())); }catch(e){}
    if(this.cbs.onThumbs) this.cbs.onThumbs(urls);
  }

  /* ---- round / units ---- */
  resetRound() {
    this.ROUND = 105; this.t = 0; this.sun = 0; this.actIndex = -1;
    this.units = []; this.parts = []; this.surge = null;
    this.nextSpawn = 1.2; this.surgeTimer = 16;
    this.joy = 48; this.chaos = 0; this.score = 0; this.combo = 0; this.bestCombo = 0;
    this.delivered = 0; this.matched = 0; this.drag = null; this.shake = 0; this.flash = 0;
    this.fireFlare = 0;
  }
  get flowMult() { return 1 + Math.min(this.combo, 24) * 0.125; } // up to 4×
  affinity(t){ return t==="cyclist"?0 : t==="puppet"?1 : 2; }
  SPEED(t, matched){ const base={cyclist:[104,60],puppet:[50,32],float:[44,28]}[t]; return matched?base[0]:base[1]; }
  SZ(t){ return t==="cyclist"?{hw:26,hh:26} : t==="puppet"?{hw:22,hh:40} : {hw:46,hh:26}; }
  spawnUnit(forceType) {
    const act = ACTS[clamp(this.actIndex,0,ACTS.length-1)];
    const type = forceType || pick(act ? act.types : ["cyclist"]);
    const lane = (Math.random()*3)|0; const sz=this.SZ(type);
    const u={ id:this.uid++, type, lane, x:this.SPAWN-rand(0,40), y:this.LANES[lane].y,
      hw:sz.hw, hh:sz.hh, blocked:0, sway:rand(0,6.28), bloom:0, delivered:false, lift:0,
      tint: pick(["#e25b8f","#46b39d","#f2b441","#7a6cf0","#ef7a3a","#4aa3e8","#ec5fb0"]),
      pat:null, palIdx:0, fade:1 };
    if (type==="cyclist" && this.patPool.length){ const p=pick(this.patPool); u.pat=p.cv; u.palIdx=p.palIdx; }
    this.units.push(u);
  }
  addParts(x,y,color,n,opt={}) {
    if(this.parts.length>300) return;
    for(let i=0;i<n;i++){ const a=rand(0,6.28), sp=rand(opt.spMin||30,opt.spMax||140);
      this.parts.push({ x,y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-(opt.up||0),
        life:rand(opt.lifeMin||0.5,opt.lifeMax||1.2), age:0,
        col:color||pick(["#f2b441","#e25b8f","#46b39d","#7a6cf0","#fff","#84d3ea"]),
        sz:rand(opt.szMin||2,opt.szMax||5), g:opt.g===undefined?160:opt.g, kind:opt.kind||"conf" }); }
  }
  floater(x,y,text,col){ if(this.parts.length>320) return;
    this.parts.push({ x,y, vx:0, vy:-26, life:1.1, age:0, col:col||"#fff0c0", sz:0, g:0, kind:"score", text }); }

  /* ---- input ---- */
  toLogical(e){ const r=this.cv.getBoundingClientRect();
    return { x:(e.clientX-r.left)/(r.width/this.W), y:(e.clientY-r.top)/(r.height/this.H) }; }
  unitAt(x,y){ for(let i=this.units.length-1;i>=0;i--){ const u=this.units[i]; if(u.delivered)continue;
    if(Math.abs(x-u.x)<u.hw+10 && Math.abs(y-u.y)<u.hh+14) return u; } return null; }
  nearestLane(y){ let best=0,bd=1e9; for(let i=0;i<3;i++){ const d=Math.abs(y-this.LANES[i].y); if(d<bd){bd=d;best=i;} } return best; }
  _onPD(e){ if(this.audio) this.audio.start(); if(this.phase!=="playing")return;
    const p=this.toLogical(e); const u=this.unitAt(p.x,p.y);
    if(u){ try{this.cv.setPointerCapture(e.pointerId);}catch(_){} this.drag={u,dy:u.y}; u.lift=1;
      if(this.audio) this.audio.blip(440,0.05,"sine",0.06); } }
  _onPM(e){ if(this.drag){ const p=this.toLogical(e); this.drag.dy=clamp(p.y,this.S_TOP+8,this.S_BOT-8); } }
  _onPU(){ if(!this.drag)return; const u=this.drag.u; const ln=this.nearestLane(this.drag.dy);
    if(ln!==u.lane && this.audio) this.audio.blip(330,0.07,"sine",0.07);
    u.lane=ln; u.y=this.LANES[ln].y; u.lift=0; this.drag=null; }

  /* ---- phase control ---- */
  setPhase(p){ this.phase=p; if(this.cbs.onPhase) this.cbs.onPhase(p); }
  beginPlay(){ if(this.audio) this.audio.start(); this.resetRound(); this.setPhase("playing"); this.pushStats(true); }
  pause(){ if(this.phase==="playing") this.setPhase("paused"); }
  resume(){ if(this.phase==="paused") this.setPhase("playing"); }
  restart(){ this.resetRound(); this.setPhase("title"); }
  setMuted(m){ if(this.audio) { if(!m) this.audio.start(); this.audio.setMuted(m); } }
  pushStats(){ if(!this.cbs.onStats) return;
    this.cbs.onStats({ joy:this.joy, chaos:this.chaos, score:Math.round(this.score), combo:this.combo,
      mult:this.flowMult, act:Math.max(0,this.actIndex), timeLeft: Math.max(0, this.ROUND-this.t) }); }

  endRound(win){ if(this.phase!=="playing")return;
    this.setPhase(win?"win":"lose");
    const matchPct = this.delivered? this.matched/this.delivered : 0;
    this.score = Math.max(0, Math.round(this.score + this.joy*5 + this.matched*30 + (win?Math.round(matchPct*1200):0) - this.chaos*2));
    const stars = this.score>9000?3 : this.score>5200?2 : 1;
    if(win && this.audio) this.audio.whoosh(); else if(this.audio) this.audio.thud();
    if(win) for(let i=0;i<70;i++) setTimeout(()=>{ if(this.alive) this.addParts(this.BONX,this.S_TOP+this.LH*1.5,null,1,{up:140,spMax:240,lifeMax:2.4}); }, i*14);
    if(this.cbs.onResult) this.cbs.onResult({ win, score:this.score, stars,
      delivered:this.delivered, matched:this.matched, bestCombo:this.bestCombo, matchPct:Math.round(matchPct*100) });
  }

  /* ---- update ---- */
  update(dt) {
    const playing = this.phase==="playing", attract = this.phase==="title";
    if (playing) {
      this.t += dt; this.sun = clamp(this.t/this.ROUND, 0, 1);
      const ai = actIndexFor(this.sun);
      if (ai !== this.actIndex) { this.actIndex = ai; const a=ACTS[ai];
        if(this.cbs.onAct) this.cbs.onAct({ index:ai, name:a.name, sub:a.sub });
        if(this.audio && ai>0) this.audio.blip(523,0.4,"sine",0.12); }
      const act = ACTS[ai]; const a0 = ai===0?0:ACTS[ai-1].until, a1 = act.until;
      const local = clamp((this.sun-a0)/(a1-a0), 0, 1);
      this._dusk=(this._dusk||0)-dt; if(this._dusk<=0){ if(this.audio)this.audio.setDusk(this.sun); this._dusk=0.25; }
      this.nextSpawn -= dt;
      if(this.nextSpawn<=0){ this.spawnUnit(); this.nextSpawn = lerp(act.spawn[0], act.spawn[1], local)*rand(0.85,1.12); }
      if(this.surge){ this.surge.t-=dt; if(this.surge.t<=0) this.surge=null; }
      else if(act.surge){ this.surgeTimer-=dt; if(this.surgeTimer<=0 && this.sun<0.96){
        const lane=(Math.random()*3)|0; const x0=rand(this.GUTTER+120,this.BONX-220);
        this.surge={ lane, x0, x1:x0+rand(80,130), t:rand(4.5,6), pulse:0 };
        this.surgeTimer=rand(act.surge[0], act.surge[1]); } }
      this.updateUnits(dt);
      // a maxed-out parade collapses — judged before recovery softens the blow
      if(this.chaos>=100){ this.endRound(false); }
      else {
        if(this.joy>55) this.score += dt*(this.joy-55)*0.7; // radiance: a joyful parade is worth more
        this.joy = clamp(this.joy - dt*1.1, 0, 100);
        this.chaos = clamp(this.chaos - dt*2.0, 0, 100);
        if(this.sun>=1) this.endRound(true);
      }
      this.statClock-=dt; if(this.statClock<=0){ this.pushStats(); this.statClock=0.05; }
    } else if (attract) {
      this.sun = 0.22; this.actIndex = 0;
      this.nextSpawn -= dt; if(this.nextSpawn<=0){ this.spawnUnit(); this.nextSpawn=rand(1.0,2.0); }
      this.updateUnits(dt, true);
    }
    this.updateParts(dt);
    this.shake=Math.max(0,this.shake-dt*4); this.flash=Math.max(0,this.flash-dt*2.5);
    this.fireFlare=Math.max(0,this.fireFlare-dt*1.6);
    if(this.surge) this.surge.pulse+=dt;
  }
  updateUnits(dt, attract) {
    for(let L=0;L<3;L++){
      const lane=this.units.filter(u=>u.lane===L && !u.delivered && u!==(this.drag&&this.drag.u)).sort((a,b)=>b.x-a.x);
      for(let i=0;i<lane.length;i++){ const u=lane[i];
        const matched=(this.LANES[L].type===u.type); const sp=this.SPEED(u.type, matched);
        let maxX=Infinity;
        if(i>0){ const ah=lane[i-1]; maxX=ah.x-(ah.hw+u.hw+10); }
        if(this.surge && this.surge.lane===L && this.surge.x0>u.x) maxX=Math.min(maxX, this.surge.x0-u.hw-8);
        const want=u.x+sp*dt; const nx=Math.min(want,maxX); u.x=nx;
        if(!attract){
          if(want-nx>0.6) u.blocked+=dt; else u.blocked=Math.max(0,u.blocked-dt*1.5);
          if(u.blocked>0.5){ this.chaos=clamp(this.chaos+dt*(matched?1.1:7),0,100);
            if(Math.random()<dt*2.5) this.addParts(u.x,u.y-u.hh-4,"#e2562b",1,{lifeMax:0.5,szMax:3,g:-40,kind:"spark"});
            if(Math.random()<dt*1.4 && this.audio) this.audio.jam(); }
        }
      }
    }
    if(this.drag){ const u=this.drag.u; u.y=lerp(u.y,this.drag.dy,0.4); }
    for(let i=this.units.length-1;i>=0;i--){ const u=this.units[i];
      if(u!==(this.drag&&this.drag.u)) u.y=lerp(u.y,this.LANES[u.lane].y,0.18);
      u.sway+=dt*(u.type==="puppet"?2.4:1.6); if(u.bloom>0) u.bloom=Math.max(0,u.bloom-dt*1.3);
      if(!u.delivered && u.x>=this.BONX-14){ u.delivered=true;
        const matched=(this.LANES[u.lane].type===u.type);
        if(!attract){
          if(matched){ this.combo++; this.bestCombo=Math.max(this.bestCombo,this.combo); this.matched++;
            const gain=8+Math.min(this.combo,10); this.joy=clamp(this.joy+gain,0,100);
            const amt=Math.round((90+this.actIndex*16)*this.flowMult); this.score+=amt;
            this.floater(u.x,u.y-u.hh-6,"+"+amt, "#ffe9a8");
            if(this.combo===8||this.combo===16||this.combo===24) this.floater(u.x,u.y-u.hh-24,"FLOW ×"+this.flowMult.toFixed(1),"#f2b441");
            this.addParts(u.x,u.y,null,20,{spMax:200,up:70,lifeMax:1.5});
            if(u.type==="cyclist") u.bloom=1.2;
            this.fireFlare=Math.min(1,this.fireFlare+0.3); this.flash=Math.min(0.5,this.flash+0.16);
            if(this.audio)this.audio.arrive(this.combo);
          } else { this.combo=0; this.chaos=clamp(this.chaos+12,0,100);
            this.floater(u.x,u.y-u.hh-6,"wrong lane","#caa");
            this.addParts(u.x,u.y,"#8a7f96",10,{spMax:90,lifeMax:0.8});
            if(this.audio)this.audio.mismatch(); this.shake=Math.min(1,this.shake+0.45); }
          this.delivered++;
        } else { if(matched && u.type==="cyclist") u.bloom=1.0; this.addParts(u.x,u.y,null,8,{spMax:120,up:40,lifeMax:1.1}); }
      }
      if(u.delivered){ u.x+=this.SPEED(u.type,true)*0.4*dt; u.fade=Math.max(0,u.fade-dt*1.6); if(u.fade<=0) this.units.splice(i,1); }
    }
  }
  updateParts(dt){
    for(let i=this.parts.length-1;i>=0;i--){ const p=this.parts[i]; p.age+=dt;
      if(p.age>=p.life){ this.parts.splice(i,1); continue; }
      p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; if(p.kind==="conf") p.vx*=0.99; }
    const lively=(this.phase==="playing"||this.phase==="win"||this.phase==="title");
    if(lively && this.parts.length<260){
      if(this.sun>0.5 && Math.random()<dt*14*(this.sun-0.4))
        this.parts.push({ x:rand(0,this.W), y:rand(80,this.S_TOP), vx:rand(-8,8), vy:rand(-6,4),
          life:rand(2,4), age:0, col:"#ffd27a", sz:rand(1,2.4), g:0, kind:"fly" });
      if(Math.random()<dt*40)
        this.parts.push({ x:this.BONX+rand(-20,20), y:this.S_TOP+this.LH*1.5+rand(-6,10), vx:rand(-14,14), vy:rand(-70,-130),
          life:rand(0.8,1.9), age:0, col:pick(["#f2b441","#e2562b","#fff0c0"]), sz:rand(1.5,3.2), g:-22, kind:"ember" });
    }
  }

  /* ---- loop ---- */
  _loop(ts){ if(!this.alive)return; if(!this.last) this.last=ts; let dt=(ts-this.last)/1000; this.last=ts; if(dt>0.1)dt=0.1;
    if(!this.rd.done){ this.rdRun(RD_CHUNK); this.rd.it+=RD_CHUNK;
      if(this.rd.it>=RD_ITERS){ this.rd.grids.push(this.rd.b.slice()); this.rd.idx++; this.rd.it=0;
        if(this.rd.idx>=RD_PRESETS.length){ this.rd.done=true; this.buildAssets();
          if(this.cbs.onProgress)this.cbs.onProgress(1); this.setPhase("title"); }
        else this.rdInit(); }
      if(!this.rd.done){ const prog=(this.rd.idx*RD_ITERS+this.rd.it)/(RD_PRESETS.length*RD_ITERS);
        if(this.cbs.onProgress)this.cbs.onProgress(prog); this.renderLoading(); }
      this._raf=requestAnimationFrame(this._loop); return; }
    this.timeAll+=dt; this.acc+=dt; const STEP=1/120; let n=0;
    while(this.acc>=STEP && n<8){ this.update(STEP); this.acc-=STEP; n++; }
    this.render();
    this._raf=requestAnimationFrame(this._loop);
  }

  renderLoading(){ const ctx=this.ctx, W=this.W, H=this.H;
    ctx.fillStyle="#070510"; ctx.fillRect(0,0,W,H);
    const cx=W/2, cy=H*0.46, R=Math.min(W,H)*0.30;
    const gl=ctx.createRadialGradient(cx,cy,R*0.2,cx,cy,R*1.7);
    gl.addColorStop(0, rgba(PALETTES[this.rd.idx%PALETTES.length][1],0.20)); gl.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(cx,cy,R*1.7,0,6.2832); ctx.fill();
    const cn=this.rdToCanvas(this.rd.b, PALETTES[this.rd.idx%PALETTES.length], 260);
    ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,R,0,6.2832); ctx.clip();
    ctx.drawImage(cn, cx-R, cy-R, R*2, R*2); ctx.restore();
    ctx.lineWidth=1.5; ctx.strokeStyle="rgba(255,255,255,0.10)"; ctx.beginPath(); ctx.arc(cx,cy,R,0,6.2832); ctx.stroke();
    const vg=ctx.createRadialGradient(cx,cy,R, cx,cy, Math.max(W,H)*0.7);
    vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,0.55)");
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  }

  render(){ const ctx=this.ctx, W=this.W, H=this.H;
    ctx.save(); if(this.shake>0) ctx.translate(rand(-1,1)*this.shake*5, rand(-1,1)*this.shake*5);
    const p=this.sun;
    this.sky(p); this.skyline(p); this.street(p); this.drawSurge();
    const us=this.units.slice().sort((a,b)=> a.y-b.y || a.x-b.x);
    for(const u of us) this.drawUnit(u);
    this.bonfire(p); this.gutter();
    this.drawParts();
    ctx.restore();
    if(this.flash>0){ ctx.fillStyle=rgba("#fff0c0",this.flash*0.22); ctx.fillRect(0,0,W,H); }
    if(this.phase==="title"){ const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,"rgba(8,5,18,0.62)"); g.addColorStop(0.5,"rgba(8,5,18,0.30)"); g.addColorStop(1,"rgba(8,5,18,0.78)");
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
    if(this.phase==="paused"){ ctx.fillStyle="rgba(6,4,14,0.5)"; ctx.fillRect(0,0,W,H); }
  }

  sky(p){ const ctx=this.ctx, W=this.W, ho=this.S_TOP+18;
    const top=ramp(["#5ba8d6","#6e84c4","#3a2a6b","#231a4d"],p);
    const mid=ramp(["#bfe0ee","#e9a45c","#a64a6e","#6b2e63"],p);
    const hor=ramp(["#fce6a8","#f6c25a","#ef7a3a","#e2562b"],p);
    const g=ctx.createLinearGradient(0,0,0,ho); g.addColorStop(0,top); g.addColorStop(0.55,mid); g.addColorStop(1,hor);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,ho);
    const sx=lerp(W*0.30,W*0.72,smooth(p)), sy=lerp(this.S_TOP*0.32, this.S_TOP+38, smooth(p)), sr=lerp(30,46,p);
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,ho); ctx.clip();
    const halo=ctx.createRadialGradient(sx,sy,4,sx,sy,sr*2.6);
    halo.addColorStop(0, rgba(ramp(["#fffdf0","#fff0c0","#ffd27a","#ffb15a"],p),0.9));
    halo.addColorStop(0.5, rgba(ramp(["#ffe9a8","#ffce6a","#ff9d4a","#ff7a3a"],p),0.35));
    halo.addColorStop(1,"rgba(255,160,80,0)");
    ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(sx,sy,sr*2.6,0,6.2832); ctx.fill();
    ctx.fillStyle=ramp(["#fffef5","#fff3cf","#ffd98a","#ffbf6e"],p); ctx.beginPath(); ctx.arc(sx,sy,sr,0,6.2832); ctx.fill();
    ctx.restore();
    if(p>0.5){ const al=clamp((p-0.5)*2,0,1)*0.9;
      for(const s of this.stars){ const x=s.fx*W, y=s.fy*(ho-30)+6; const tw=0.5+0.5*Math.sin(this.timeAll*2+s.ph);
        ctx.globalAlpha=al*tw; ctx.fillStyle="#fffef0"; ctx.fillRect(x,y,1.6,1.6); } ctx.globalAlpha=1; }
  }
  skyline(p){ const ctx=this.ctx, W=this.W, sky=this.S_TOP+2;
    const dark=ramp(["#2c4a63","#3a3358","#241d3e","#15102a"],p); ctx.fillStyle=dark;
    const b=[[0.03,70],[0.10,46],[0.16,96],[0.24,52],[0.30,120],[0.37,50],[0.62,62],[0.70,110],[0.80,46],[0.90,86],[0.96,60]];
    for(const [fx,h] of b){ ctx.fillRect(fx*W, sky-h, W*0.05, h); }
    ctx.strokeStyle=mix(dark,"#000000",0.2); const by=sky-150, bx0=W*0.36, bx1=W*0.60;
    ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(bx0,by); ctx.lineTo(bx1,by); ctx.stroke();
    ctx.lineWidth=5; for(let i=0;i<4;i++){ const px=lerp(bx0+12,bx1-12,i/3); ctx.beginPath(); ctx.moveTo(px,by); ctx.lineTo(px,sky); ctx.stroke(); }
    ctx.lineWidth=2; ctx.beginPath(); for(let x=bx0;x<bx1;x+=20){ ctx.moveTo(x,by); ctx.lineTo(x+20,by+16); ctx.moveTo(x+20,by); ctx.lineTo(x,by+16); } ctx.stroke();
    const tx=lerp(bx0,bx1,0.42), ty=sky-56; ctx.fillStyle=mix(dark,"#000",0.25);
    ctx.beginPath(); ctx.moveTo(tx-40,ty+56); ctx.quadraticCurveTo(tx-52,ty+8,tx-20,ty-8);
    ctx.quadraticCurveTo(tx-26,ty-42,tx+4,ty-46); ctx.quadraticCurveTo(tx+40,ty-52,tx+44,ty-12);
    ctx.quadraticCurveTo(tx+64,ty+4,tx+50,ty+56); ctx.closePath(); ctx.fill();
    ctx.fillStyle=rgba("#ffd27a",0.8); ctx.beginPath(); ctx.arc(tx+6,ty-22,3,0,6.28); ctx.fill();
    ctx.fillStyle=mix(dark,"#000",0.1); ctx.fillRect(tx+28,ty+14,30,12);
  }
  street(p){ const ctx=this.ctx, W=this.W, top=this.S_TOP, bot=this.S_BOT;
    const g=ctx.createLinearGradient(0,top,0,bot); g.addColorStop(0,"#3a3340"); g.addColorStop(1,"#28232f");
    ctx.fillStyle=g; ctx.fillRect(0,top,W,bot-top);
    const wash=ctx.createLinearGradient(W*0.55,0,W,0); wash.addColorStop(0,"rgba(226,86,43,0)"); wash.addColorStop(1,rgba("#e2562b",0.16+0.05*p));
    ctx.fillStyle=wash; ctx.fillRect(W*0.55,top,W*0.45,bot-top);
    const tints={cyclist:"#46b39d",puppet:"#e25b8f",float:"#f2b441"};
    for(let i=0;i<3;i++){ const L=this.LANES[i]; ctx.fillStyle=rgba(tints[L.type],0.085); ctx.fillRect(0,L.y-this.LH/2,W,this.LH); }
    ctx.strokeStyle="rgba(244,238,226,0.16)"; ctx.lineWidth=2; ctx.setLineDash([16,18]);
    for(let i=0;i<2;i++){ const yy=this.LANES[i].y+this.LH/2; ctx.beginPath(); ctx.moveTo(this.GUTTER,yy); ctx.lineTo(this.BONX-30,yy); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  gutter(){ const ctx=this.ctx, top=this.S_TOP, bot=this.S_BOT, gw=this.GUTTER;
    const g=ctx.createLinearGradient(0,0,gw,0); g.addColorStop(0,"#1a1622"); g.addColorStop(1,"rgba(26,22,34,0.92)");
    ctx.fillStyle=g; ctx.fillRect(0,top-2,gw,bot-top+2);
    ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gw,top); ctx.lineTo(gw,bot); ctx.stroke();
    const tints={cyclist:"#46b39d",puppet:"#e25b8f",float:"#f2b441"};
    ctx.textBaseline="middle";
    for(let i=0;i<3;i++){ const L=this.LANES[i]; this.laneIcon(L.type, 26, L.y, tints[L.type]);
      ctx.fillStyle=rgba("#f4eee2",0.6); ctx.font="600 10px ui-monospace,Menlo,monospace"; ctx.textAlign="left";
      ctx.fillText(L.name.toUpperCase(), 46, L.y); }
    ctx.fillStyle="rgba(244,238,226,0.30)"; ctx.font="700 10px ui-monospace,Menlo,monospace"; ctx.textAlign="center";
    ctx.fillText("START", gw/2, top+10);
  }
  laneIcon(type,x,y,col){ const ctx=this.ctx; ctx.save(); ctx.translate(x,y); ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=2;
    if(type==="cyclist"){ ctx.beginPath(); ctx.arc(-6,4,5,0,6.28); ctx.arc(6,4,5,0,6.28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6,4); ctx.lineTo(0,-4); ctx.lineTo(6,4); ctx.moveTo(0,-4); ctx.lineTo(2,-9); ctx.stroke(); }
    else if(type==="puppet"){ ctx.beginPath(); ctx.arc(0,-6,5,0,6.28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,-1); ctx.lineTo(0,9); ctx.moveTo(-7,3); ctx.lineTo(7,3); ctx.stroke(); }
    else { ctx.fillRect(-9,-2,18,7); ctx.beginPath(); ctx.arc(-5,8,3,0,6.28); ctx.arc(5,8,3,0,6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(0,-7,4,0,6.28); ctx.fill(); }
    ctx.restore(); }

  drawUnit(u){ const ctx=this.ctx; ctx.save(); ctx.globalAlpha=clamp(u.fade,0,1);
    const lift=u.lift?9:0, y=u.y-lift;
    ctx.fillStyle="rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(u.x, this.LANES[u.lane].y+u.hh*0.72, u.hw*0.92, 5, 0,0,6.28); ctx.fill();
    if(u.lift){ ctx.shadowColor="rgba(0,0,0,0.45)"; ctx.shadowBlur=16; }
    if(u.type==="cyclist") this.drawCyclist(u,y); else if(u.type==="puppet") this.drawPuppet(u,y); else this.drawFloat(u,y);
    ctx.shadowBlur=0;
    if(u.blocked>0.5 && !u.delivered){ ctx.fillStyle="#ffce53"; ctx.font="700 18px system-ui,sans-serif"; ctx.textAlign="center";
      ctx.globalAlpha=clamp(u.fade,0,1)*(0.6+0.4*Math.sin(this.timeAll*12)); ctx.fillText("!", u.x, y-u.hh-10); }
    ctx.restore();
  }
  drawCyclist(u,y){ const ctx=this.ctx, bob=Math.sin(u.sway)*1.6, x=u.x;
    ctx.strokeStyle="#15111d"; ctx.lineWidth=3.4; ctx.lineCap="round";
    ctx.beginPath(); ctx.arc(x-15,y+18,9,0,6.28); ctx.arc(x+15,y+18,9,0,6.28); ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,0.22)"; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x-15,y+18,9,0,6.28); ctx.arc(x+15,y+18,9,0,6.28); ctx.stroke();
    ctx.strokeStyle="#2a2233"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-15,y+18); ctx.lineTo(x-2,y+9); ctx.lineTo(x+15,y+18); ctx.moveTo(x-2,y+9); ctx.lineTo(x+3,y-2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+3,y-2); ctx.lineTo(x+14,y+4); ctx.stroke();
    const bw=28, bh=30, bx=x-bw/2, by=y-22+bob, r=8;
    ctx.save(); ctx.beginPath(); ctx.moveTo(bx+r,by); ctx.arcTo(bx+bw,by,bx+bw,by+bh,r); ctx.arcTo(bx+bw,by+bh,bx,by+bh,r);
    ctx.arcTo(bx,by+bh,bx,by,r); ctx.arcTo(bx,by,bx+bw,by,r); ctx.closePath(); ctx.clip();
    if(u.pat){ const s=u.bloom>0?1+0.12*Math.sin((1.2-u.bloom)*12):1, dw=bw*1.7*s, dh=bh*1.7*s;
      ctx.drawImage(u.pat, bx+(bw-dw)/2, by+(bh-dh)/2, dw, dh); } else { ctx.fillStyle=u.tint; ctx.fillRect(bx,by,bw,bh); }
    if(u.bloom>0){ ctx.fillStyle=rgba("#ffffff",u.bloom*0.35); ctx.fillRect(bx,by,bw,bh); }
    ctx.restore();
    ctx.strokeStyle="rgba(0,0,0,0.25)"; ctx.lineWidth=1; ctx.beginPath();
    ctx.moveTo(bx+r,by); ctx.arcTo(bx+bw,by,bx+bw,by+bh,r); ctx.arcTo(bx+bw,by+bh,bx,by+bh,r); ctx.arcTo(bx,by+bh,bx,by,r); ctx.arcTo(bx,by,bx+bw,by,r); ctx.closePath(); ctx.stroke();
    ctx.fillStyle="#e8c9a0"; ctx.beginPath(); ctx.arc(x,by-8,8,0,6.28); ctx.fill();
    ctx.fillStyle=u.tint; ctx.beginPath(); ctx.arc(x-3,by-14,2.4,0,6.28); ctx.arc(x+3,by-14,2.4,0,6.28); ctx.arc(x,by-16,2.4,0,6.28); ctx.fill();
    if(u.bloom>0){ ctx.strokeStyle=rgba(PALETTES[u.palIdx][1],u.bloom*0.7); ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(x,y,u.hh+(1.2-u.bloom)*34,0,6.28); ctx.stroke(); }
  }
  drawPuppet(u,y){ const ctx=this.ctx, sway=Math.sin(u.sway)*0.14, x=u.x;
    ctx.save(); ctx.translate(x,y+u.hh); ctx.rotate(sway);
    ctx.strokeStyle="#5a4632"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-u.hh*1.55); ctx.stroke();
    ctx.fillStyle=u.tint; ctx.beginPath(); ctx.moveTo(0,-u.hh*1.5); ctx.lineTo(-20,-2); ctx.quadraticCurveTo(0,-12,20,-2); ctx.closePath(); ctx.fill();
    ctx.fillStyle=rgba("#ffffff",0.85); for(let i=-14;i<=14;i+=9){ ctx.beginPath(); ctx.arc(i,-8,1.8,0,6.28); ctx.fill(); }
    ctx.strokeStyle=mix(u.tint,"#ffffff",0.3); ctx.lineWidth=2.4; ctx.lineCap="round";
    const aw=Math.sin(u.sway*1.3)*6;
    ctx.beginPath(); ctx.moveTo(-8,-u.hh*1.1); ctx.quadraticCurveTo(-22,-u.hh*1.0+aw,-26,-u.hh*0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8,-u.hh*1.1); ctx.quadraticCurveTo(22,-u.hh*1.0-aw,26,-u.hh*0.8); ctx.stroke();
    ctx.fillStyle=mix(u.tint,"#ffffff",0.28); ctx.beginPath(); ctx.arc(0,-u.hh*1.5-4,13,0,6.28); ctx.fill();
    ctx.fillStyle="#221a2e"; ctx.beginPath(); ctx.arc(-4,-u.hh*1.5-5,1.9,0,6.28); ctx.arc(4,-u.hh*1.5-5,1.9,0,6.28); ctx.fill();
    ctx.strokeStyle="#221a2e"; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(0,-u.hh*1.5-2,4,0.2,2.94); ctx.stroke();
    ctx.fillStyle=mix(u.tint,"#000",0.1); ctx.beginPath(); ctx.arc(0,-u.hh*1.5-16,4,0,6.28); ctx.fill();
    ctx.restore();
  }
  drawFloat(u,y){ const ctx=this.ctx, x=u.x;
    ctx.fillStyle="#6b5740"; ctx.fillRect(x-u.hw,y+6,u.hw*2,16); ctx.fillStyle="#4f3f2c"; ctx.fillRect(x-u.hw,y+18,u.hw*2,5);
    ctx.fillStyle="#15111d"; for(const wx of [-u.hw+14,0,u.hw-14]){ ctx.beginPath(); ctx.arc(x+wx,y+26,6,0,6.28); ctx.fill(); }
    ctx.strokeStyle=rgba("#f4eee2",0.5); ctx.lineWidth=1.4; ctx.beginPath();
    for(let i=0;i<6;i++){ const sx=x-u.hw+i*(u.hw*2/5); ctx.moveTo(sx,y+6); ctx.quadraticCurveTo(sx+u.hw/5/2,y+12,sx+u.hw/5,y+6); } ctx.stroke();
    const cx=x, cy=y-8; ctx.save(); ctx.translate(cx,cy); ctx.rotate(u.sway*0.5); ctx.fillStyle=u.tint;
    for(let i=0;i<12;i++){ ctx.rotate(6.2832/12); ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(3.5,-28); ctx.lineTo(-3.5,-28); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle=mix(u.tint,"#fff",0.32); ctx.beginPath(); ctx.arc(cx,cy,13,0,6.28); ctx.fill();
    ctx.strokeStyle=rgba("#000",0.18); ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(cx,cy,13,0,6.28); ctx.stroke();
    ctx.fillStyle=rgba("#fff",0.5); ctx.beginPath(); ctx.arc(cx-4,cy-4,3,0,6.28); ctx.fill();
  }
  drawSurge(){ if(!this.surge)return; const ctx=this.ctx, s=this.surge, L=this.LANES[s.lane];
    ctx.fillStyle=rgba("#e2562b",0.16+0.06*Math.sin(s.pulse*6)); ctx.fillRect(s.x0, L.y-this.LH/2, s.x1-s.x0, this.LH);
    ctx.fillStyle=rgba("#1c1726",0.9);
    for(let x=s.x0;x<s.x1;x+=12){ const yy=L.y-4+Math.sin(x*0.5+s.pulse*3)*3; ctx.beginPath(); ctx.arc(x,yy,8,0,6.28); ctx.fill(); }
    for(let x=s.x0+5;x<s.x1;x+=12){ ctx.fillStyle=rgba("#e8c9a0",0.9); ctx.beginPath(); ctx.arc(x,L.y-15,3.2,0,6.28); ctx.fill(); }
    ctx.fillStyle="#ffce53"; ctx.font="700 11px ui-monospace,Menlo,monospace"; ctx.textAlign="center";
    ctx.fillText("CROWD", (s.x0+s.x1)/2, L.y-this.LH/2-6);
  }
  bonfire(p){ const ctx=this.ctx, x=this.BONX, base=this.S_BOT-16, mid=this.S_TOP+this.LH*1.5;
    const flick=0.85+0.15*Math.sin(this.timeAll*14)+0.05*Math.sin(this.timeAll*23);
    const joyN=(this.phase==="playing"||this.phase==="win")? this.joy/100 : 0.4;
    const joyF=(0.55+joyN*0.7)*(1+this.fireFlare*0.3);
    const big=this.phase==="win"?1.5:1;
    const pool=ctx.createRadialGradient(x,base,6,x,base,150*big*joyF);
    pool.addColorStop(0,rgba("#ffb15a",0.5*flick)); pool.addColorStop(0.5,rgba("#e2562b",0.18*flick)); pool.addColorStop(1,"rgba(226,86,43,0)");
    ctx.save(); ctx.beginPath(); ctx.rect(0,this.S_TOP,this.W,this.S_BOT-this.S_TOP); ctx.clip();
    ctx.fillStyle=pool; ctx.beginPath(); ctx.ellipse(x,base,150*big*joyF,46*big,0,0,6.28); ctx.fill(); ctx.restore();
    const gl=ctx.createRadialGradient(x,mid,8,x,mid,150*big*joyF);
    gl.addColorStop(0,rgba("#ffd27a",0.45*flick)); gl.addColorStop(1,"rgba(255,120,40,0)");
    ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(x,mid,150*big*joyF,0,6.28); ctx.fill();
    ctx.strokeStyle="#3a2a1c"; ctx.lineWidth=7; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(x-26,base+4); ctx.lineTo(x+22,base-10); ctx.moveTo(x+26,base+4); ctx.lineTo(x-22,base-10); ctx.stroke();
    ctx.strokeStyle="#5a3a20"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-26,base+4); ctx.lineTo(x+22,base-10); ctx.stroke();
    const fh=(70+joyN*40+this.fireFlare*22)*big*flick;
    for(let i=0;i<4;i++){ const off=(i-1.5)*11, h=fh*(1-Math.abs(i-1.5)*0.16), w=18-Math.abs(i-1.5)*3;
      const wob=Math.sin(this.timeAll*9+i*1.7)*5;
      const g=ctx.createLinearGradient(0,base-h,0,base);
      g.addColorStop(0,rgba("#fff3c0",0.95)); g.addColorStop(0.45,"#f2a623"); g.addColorStop(1,"#e2562b");
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x+off-w,base);
      ctx.quadraticCurveTo(x+off-w*0.5,base-h*0.55, x+off+wob,base-h);
      ctx.quadraticCurveTo(x+off+w*0.5,base-h*0.55, x+off+w,base); ctx.closePath(); ctx.fill(); }
    const core=ctx.createRadialGradient(x,base-fh*0.28,2,x,base-fh*0.28,18*big);
    core.addColorStop(0,"rgba(255,255,235,0.9)"); core.addColorStop(1,"rgba(255,200,120,0)");
    ctx.fillStyle=core; ctx.beginPath(); ctx.arc(x,base-fh*0.28,18*big,0,6.28); ctx.fill();
  }
  drawParts(){ const ctx=this.ctx;
    for(const p of this.parts){ const a=1-p.age/p.life; ctx.globalAlpha=clamp(a,0,1)*(p.kind==="fly"?0.9:1); ctx.fillStyle=p.col;
      if(p.kind==="score"){ ctx.globalAlpha=clamp(a,0,1); ctx.font="700 13px ui-monospace,Menlo,monospace"; ctx.textAlign="center";
        ctx.fillText(p.text, p.x, p.y); }
      else if(p.kind==="conf"){ ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.age*8); ctx.fillRect(-p.sz,-p.sz*0.5,p.sz*2,p.sz); ctx.restore(); }
      else { ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,6.28); ctx.fill(); } }
    ctx.globalAlpha=1;
  }
}

/* ----------------------------------------------------------------- procedural audio */
function makeAudio(){
  let ctx=null, master=null, padFilter=null, padOscs=[], padGain=null, on=true, started=false;
  let delayNode=null, delayGain=null, seqTimer=null;
  let nextNoteTime = 0, currentBeat = 0;

  const CHORDS = [
    { pad: [311.13, 466.16, 783.99], scale: [311.13, 349.23, 392.00, 466.16, 523.25, 622.25] },
    { pad: [261.63, 392.00, 622.25], scale: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25] },
    { pad: [207.65, 311.13, 523.25], scale: [207.65, 261.63, 311.13, 349.23, 415.30, 466.16] },
    { pad: [233.08, 349.23, 587.33], scale: [233.08, 293.66, 349.23, 392.00, 466.16, 523.25] }
  ];

  function scheduleNote(beat, time) {
    const chordIdx = Math.floor(beat / 8) % CHORDS.length;
    const chord = CHORDS[chordIdx];
    if (beat % 8 === 0) {
      padOscs.forEach((osc, i) => {
        if (osc) osc.frequency.setTargetAtTime(chord.pad[i], time, 0.05);
      });
    }
    const isEven = (beat % 2 === 0);
    const prob = isEven ? 0.6 : 0.2;
    if (Math.random() < prob) {
      const pitch = pick(chord.scale);
      playMelodyNote(pitch, time);
    }
  }

  function playMelodyNote(f, time) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.04, time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.6);
    osc.connect(gain);
    gain.connect(delayNode);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + 1.8);
  }

  const A = {
    start(){ if(started)return; started=true; try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return;
      ctx=new AC();
      master=ctx.createGain(); master.gain.value=on?0.25:0; master.connect(ctx.destination);
      delayNode = ctx.createDelay(1.0); delayNode.delayTime.value = 0.45;
      delayGain = ctx.createGain(); delayGain.gain.value = 0.35;
      const delayFilter = ctx.createBiquadFilter(); delayFilter.type = "lowpass"; delayFilter.frequency.value = 600;
      delayNode.connect(delayFilter); delayFilter.connect(delayGain); delayGain.connect(delayNode); delayGain.connect(master);
      padFilter = ctx.createBiquadFilter(); padFilter.type = "lowpass"; padFilter.frequency.value = 800; padFilter.Q.value = 1.0;
      padGain = ctx.createGain(); padGain.gain.value = 0.04;
      const initialChord = CHORDS[0];
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = initialChord.pad[i];
        osc.connect(padFilter); osc.start(); padOscs.push(osc);
      }
      padFilter.connect(padGain); padGain.connect(master);
      nextNoteTime = ctx.currentTime; currentBeat = 0;
      seqTimer = setInterval(() => {
        while (nextNoteTime < ctx.currentTime + 0.15) {
          scheduleNote(currentBeat, nextNoteTime); currentBeat++; nextNoteTime += 0.45;
        }
      }, 50);
    }catch(e){ ctx=null; } },
    stop(){ try{ if(ctx) ctx.close(); if(seqTimer) clearInterval(seqTimer); }catch(e){} },
    setMuted(m){ on=!m; if(master) master.gain.value=on?0.25:0; },
    setDusk(p){ if(!ctx||!padFilter)return; const t=ctx.currentTime; padFilter.frequency.setTargetAtTime(lerp(800,400,p),t,1.5); },
    blip(f,d=0.16,type="triangle",v=0.22){ if(!ctx||!on)return; const t=ctx.currentTime; const o=ctx.createOscillator(),g=ctx.createGain();
      o.type=type; o.frequency.value=f; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g); g.connect(master); o.start(t); o.stop(t+d+0.02); },
    noise(d=0.3,v=0.18,lp=900){ if(!ctx||!on)return; const t=ctx.currentTime; const n=Math.floor(ctx.sampleRate*d);
      const buf=ctx.createBuffer(1,n,ctx.sampleRate); const dd=buf.getChannelData(0); for(let i=0;i<n;i++)dd[i]=(Math.random()*2-1)*(1-i/n);
      const src=ctx.createBufferSource(); src.buffer=buf; const f=ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.value=lp;
      const g=ctx.createGain(); g.gain.value=v; src.connect(f); f.connect(g); g.connect(master); src.start(); },
    arrive(c){ this.blip(523.25*Math.pow(1.0595,clamp(c,0,12)),0.2,"triangle",0.2); this.blip(659.25*Math.pow(1.0595,clamp(c,0,12)),0.22,"sine",0.1); },
    mismatch(){ this.noise(0.18,0.12,520); this.blip(150,0.14,"sine",0.12); },
    jam(){ this.noise(0.1,0.06,300); },
    whoosh(){ this.noise(1.4,0.3,1600); },
    thud(){ this.noise(0.8,0.2,240); },
  };
  return A;
}


export { ParadeGame, makeAudio, ACTS, actIndexFor, PALETTES, RD_PRESETS, clamp, lerp, mix, rgba, ramp };
