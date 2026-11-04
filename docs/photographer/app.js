/* Trackside: a motorsports photographer experience.
   Follows the Week 7 Figma flow:
     Start ─ Trackside ─ Panning shot ─ telephoto? ─ Yes: Great shot / No: Weak shot
                       └ Sharp action ─ telephoto? ─ Yes: Great shot / No: Weak shot
           └ Podium ─── Team ─ whole team fits?     ─ Yes: Great shot / No: Weak shot
                       └ Driver ─ right settings?   ─ Yes: Great shot / No: Weak shot
   Every result card's button returns to Start. Between the last answer and the result
   you take the shot in the viewfinder, with the settings and lens you chose. */

(() => {
  'use strict';
  const IMG = (n) => `img/${n}.jpg`;

  // ---------- Decision screens (copy from the Figma cards) ----------
  const NODES = {
    start: {
      crumb:'Start', tag:'Media pass · No. 270', img:'race-field', start:true,
      title:'You’re a race photographer',
      body:'One race weekend, one camera bag. Every choice you make decides what ends up on the memory card.',
      q:'What moment do you want to capture?',
      options:[ { label:'Trackside', to:'trackside', img:'f1-panning' }, { label:'Possible Podium', to:'podium', img:'nurburgring-podium' } ],
    },
    trackside: {
      crumb:'Trackside', tag:'Trackside', motion:'pan', img:'f1-panning',
      title:'Trackside',
      body:'Cars are coming through at full speed. You get one pass at this.',
      q:'What type of settings do I need?',
      options:[ { label:'Panning Shot', to:'panning', img:'astemo-panning' }, { label:'Sharp Action Shot', to:'sharp', img:'corner' } ],
    },
    panning: {
      crumb:'Panning shot', motion:'pan', tag:'Trackside · Panning shot', img:'astemo-panning',
      title:'Panning shot',
      body:'Track smoothly. Use a slower shutter speed to follow the car’s movement.',
      q:'Do you have a long telephoto lens?',
      options:[ { label:'Yes', shot:'panningGreat' }, { label:'No', shot:'panningWeak' } ],
    },
    sharp: {
      crumb:'Sharp action shot', motion:'pan', tag:'Trackside · Sharp action', img:'corner',
      title:'Sharp action shot',
      body:'Faster shutter speed. Use burst mode.',
      q:'Do you have a long telephoto lens?',
      options:[ { label:'Yes', shot:'sharpGreat' }, { label:'No', shot:'sharpWeak' } ],
    },
    podium: {
      crumb:'Podium', tag:'Possible podium', img:'podium-champagne',
      title:'Possible podium',
      body:'The race is over and the celebrations are starting. It’s crowded and it’s chaotic.',
      q:'Who should I focus on?',
      options:[ { label:'The Team', to:'team', img:'team-confetti' }, { label:'Driver', to:'driver', img:'driver-helmet', pos:'center 25%' } ],
    },
    team: {
      crumb:'Team', tag:'Podium · Team', img:'pit-crew',
      title:'Team',
      body:'Faster shutter speed and burst mode to capture the chaos.',
      q:'Can you fit the entire team in the frame?',
      options:[ { label:'Yes', shot:'teamGreat' }, { label:'No', shot:'teamWeak' } ],
    },
    driver: {
      crumb:'Driver', tag:'Podium · Driver', img:'driver-helmet', pos:'center 22%',
      title:'Driver',
      body:'Switch to a shorter lens and a smaller f-stop in time.',
      q:'Do you have the right settings and lens?',
      options:[ { label:'Yes, I’m prepared', shot:'driverGreat' }, { label:'No', shot:'driverWeak' } ],
    },
  };

  // ---------- Shots and their results ----------
  // img/zoom/c: which photo the viewfinder sees, how far it's zoomed in, and where it's centred.
  // af: where the focus box sits in the frame. cam: shutter, aperture, lens.
  const SHOTS = {
    panningGreat: { grade:'great', img:'astemo-panning', zoom:1.15, c:[0.58,0.62], af:[0.54,0.47],
      cam:['1/60','f/8','400mm'], burst:false,
      text:'The car is sharp, background has motion blur.', action:'Your photo gets reposted' },
    panningWeak:  { grade:'weak', img:'weak-tiny-car', zoom:1, c:[0.5,0.5], af:[0.5,0.6],
      cam:['1/60','f/8','70mm'], burst:false,
      text:'The car is a tiny dot.', action:'Might as well have not shot it' },
    sharpGreat:   { grade:'great', img:'corner', zoom:1.5, c:[0.42,0.56], af:[0.46,0.45],
      cam:['1/2000','f/4','400mm'], burst:true,
      text:'Frozen mid-corner: every detail of the car is crisp.', action:'Your photo gets reposted' },
    sharpWeak:    { grade:'weak', img:'weak-wide-turn', zoom:1, c:[0.5,0.5], af:[0.31,0.64],
      cam:['1/2000','f/4','70mm'], burst:true,
      text:'The car is a tiny dot.', action:'Might as well have not shot it' },
    teamGreat:    { grade:'great', img:'team-confetti', zoom:1, c:[0.5,0.5], af:[0.5,0.35],
      cam:['1/1000','f/5.6','24mm'], burst:true,
      text:'The whole team is visible and the composition captures the celebration.', action:'Your photograph gets noticed by the team and they want to hire you!' },
    teamWeak:     { grade:'weak', img:'team-confetti', zoom:2.6, c:[0.5,0.55], af:[0.5,0.5],
      cam:['1/1000','f/5.6','200mm'], burst:true,
      text:'Team members are cropped out. The lens wasn’t wide enough.', action:'Throw away image' },
    driverGreat:  { grade:'great', img:'driver-champagne', zoom:1.15, c:[0.48,0.45], af:[0.27,0.3],
      cam:['1/1000','f/2.8','85mm'], burst:false,
      text:'The driver is sharp, background is clean, subject stands out.', action:'Your photo is used for advertisement worldwide' },
    driverWeak:   { grade:'weak', img:'nurburgring-podium', zoom:1, c:[0.5,0.5], af:[0.62,0.3],
      cam:['1/250','f/11','70mm'], burst:false,
      text:'Busy background, can’t tell what the focus is.', action:'Are you even a motorsports photographer at this point ;(' },
  };
  const ALL_SHOTS = Object.keys(SHOTS);

  const $ = (id) => document.getElementById(id);
  const el = {
    crumbs:$('crumbs'), ask:$('ask'), shoot:$('shoot'), result:$('result'),
    askHero:$('askHero'), askHeroImg:$('askHeroImg'), askTag:$('askTag'), askTitle:$('askTitle'), askBody:$('askBody'), askQ:$('askQ'),
    askOptions:$('askOptions'), back:$('back'), collect:$('collect'),
    shootTag:$('shootTag'), shootBody:$('shootBody'), vf:$('vf'), vfImg:$('vfImg'), af:$('af'), afgrid:$('afgrid'),
    ovf:$('ovf'), ovfShutter:$('ovfShutter'), ovfAp:$('ovfAp'), ovfShots:$('ovfShots'),
    lcdShutter:$('lcdShutter'), lcdAp:$('lcdAp'), lcdDrive:$('lcdDrive'), lcdLens:$('lcdLens'),
    flash:$('flash'), hint:$('hint'), shutter:$('shutter'), sound:$('sound'),
    printFrame:$('printFrame'), printImg:$('printImg'), resPath:$('resPath'), resStamp:$('resStamp'),
    resTitle:$('resTitle'), resText:$('resText'), resAction:$('resAction'), announce:$('announce'),
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sizes = {};   // natural image sizes, read at load

  function announce(msg){ el.announce.textContent = ''; requestAnimationFrame(() => { el.announce.textContent = msg; }); }

  /* ---------- Shots found (kept in this browser only) ---------- */
  let found = new Set();
  try { found = new Set(JSON.parse(localStorage.getItem('trackside-found') || '[]')); } catch {}
  function remember(id){ found.add(id); try { localStorage.setItem('trackside-found', JSON.stringify([...found])); } catch {} }
  function renderCollect(){
    el.collect.innerHTML = `<b>Shots found ${found.size}/${ALL_SHOTS.length}</b>` +
      ALL_SHOTS.map((id) => `<i title="${found.has(id) ? SHOTS[id].text : 'Not found yet'}" data-grade="${found.has(id) ? SHOTS[id].grade : ''}"></i>`).join('');
  }

  /* ---------- Painting a crop ---------- */
  function paint(layer, frame, shot, blurFrac, move = { x:0, y:0, z:1 }){
    const fw = frame.clientWidth, fh = frame.clientHeight;
    const pad = (layer.offsetWidth - fw) / 2;
    const { w, h } = sizes[shot.img];
    const s = Math.max(fw / w, fh / h) * shot.zoom * move.z, W = w * s, H = h * s;
    const cx = Math.min(1 - fw/2/W, Math.max(fw/2/W, shot.c[0])) + move.x * fw / W;
    const cy = Math.min(1 - fh/2/H, Math.max(fh/2/H, shot.c[1])) + move.y * fw / H;
    layer.style.backgroundImage = `url("${IMG(shot.img)}")`;
    layer.style.backgroundSize = `${W}px ${H}px`;
    layer.style.backgroundPosition = `${pad + fw/2 - cx*W}px ${pad + fh/2 - cy*H}px`;
    layer._geo = { W, H, ox: pad + fw/2 - cx*W, oy: pad + fh/2 - cy*H };   // for the live-photo layer
    const b = blurFrac * fw;
    layer.style.filter = b > 0.3 ? `blur(${b.toFixed(1)}px)` : 'none';
  }

  /* ---------- Sound (made on the fly) ---------- */
  let ctx = null, soundOn = true;
  function audio(){
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return soundOn ? ctx : null;
  }
  function click(at, len, freq, gain){
    const a = audio(); if (!a) return;
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * len), a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 3);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = a.createGain(); g.gain.value = gain;
    src.connect(f).connect(g).connect(a.destination);
    src.start(a.currentTime + at);
  }
  // A DSLR frame: mirror flips up (low thump), the shutter curtains run (sharp tick), mirror drops back.
  const shutterSound = (at = 0) => { click(at, 0.035, 700, 1.1); click(at + 0.012, 0.02, 3800, 0.6); click(at + 0.055, 0.04, 1100, 0.8); };
  function beep(){
    const a = audio(); if (!a) return;
    [0, 0.09].forEach((t) => {
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = 2200;
      g.gain.setValueAtTime(0.0001, a.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.12, a.currentTime + t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + 0.06);
      o.connect(g).connect(a.destination); o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.07);
    });
  }

  /* ---------- Live photos ----------
     A canvas over certain photos brings one thing in them to life:
     the champagne bottles tilt and spray, and the confetti keeps falling.
     Bottle outlines and pivots are fractions of the photo's width and height. */
  const FX = {
    'podium-champagne': { bottles:[
      { poly:[[0.328,0.435],[0.362,0.450],[0.472,0.647],[0.438,0.713],[0.375,0.698],[0.338,0.563],[0.320,0.478]], pivot:[0.335,0.435], amp:5, speed:2.4, phase:0,   patch:[0.11,0],  mouth:[0.304,0.355], spray:[-0.35,-1] },
      { poly:[[0.606,0.492],[0.632,0.478],[0.603,0.619],[0.557,0.773],[0.505,0.777],[0.482,0.724],[0.525,0.600]], pivot:[0.619,0.484], amp:5, speed:2.1, phase:1.7, patch:[-0.1,0],  mouth:[0.634,0.411], spray:[0.25,-1] },
    ] },
    'driver-champagne': { bottles:[
      { poly:[[0.537,0.178],[0.588,0.103],[0.625,0.034],[0.652,0.015],[0.665,0.084],[0.632,0.161],[0.578,0.218],[0.555,0.229]], pivot:[0.494,0.263], amp:2, speed:1.1, phase:0, patch:[-0.12,0] },
    ] },
    'team-confetti': { confetti:true },
  };
  const photos = {};
  const photo = (name) => {
    if (!photos[name]) { photos[name] = new Image(); photos[name].src = IMG(name); }
    return photos[name].complete && photos[name].naturalWidth ? photos[name] : null;
  };
  // Where a background-size:cover photo sits inside its box.
  function coverGeo(host, name, pos = 'center'){
    const p = pos.split(' ').map((v) => v === 'center' ? 0.5 : parseFloat(v) / 100);
    const px = p[0] ?? 0.5, py = p[1] ?? 0.5;
    return () => {
      const im = photo(name); if (!im) return null;
      const cw = host.clientWidth, ch = host.clientHeight;
      const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight), W = im.naturalWidth * s, H = im.naturalHeight * s;
      return { W, H, ox:(cw - W) * px, oy:(ch - H) * py };
    };
  }
  const liveHosts = new Set();
  function setFx(host, name, geo){
    const spec = FX[name];
    if (!spec || reduceMotion) { host._fx?.canvas.remove(); host._fx = null; liveHosts.delete(host); return; }
    photo(name);
    if (!host._fx) {
      const canvas = document.createElement('canvas');
      canvas.className = 'live'; canvas.setAttribute('aria-hidden', 'true');
      host.appendChild(canvas);
      host._fx = { canvas, ctx:canvas.getContext('2d') };
    }
    Object.assign(host._fx, { name, spec, geo, t:Math.random() * 10, drops:[], confetti:null });
    liveHosts.add(host);
  }

  const CONFETTI = ['#2f63d6','#6fa3ff','#dce8ff','#1b47a8','#ffffff','#9cc2ff'];
  function drawFx(host, dt){
    const f = host._fx, cv = f.canvas, ctx = f.ctx;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h || !host.offsetParent) return;           // not on screen
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); f.confetti = null; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    f.t += dt;

    if (f.spec.confetti) {
      if (!f.confetti) {
        const n = Math.max(24, Math.min(240, Math.round(w * h / 2200)));
        f.confetti = Array.from({ length:n }, () => newPiece(w, h, true));
      }
      const k = Math.max(0.5, w / 700);
      for (const c of f.confetti) {
        c.y += c.vy * k * dt; c.x += Math.sin(f.t * c.sway + c.ph) * 22 * k * dt; c.spin += c.vs * dt;
        if (c.y > h + 20) Object.assign(c, newPiece(w, h, false));
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot + c.spin * 0.3);
        ctx.scale(1, Math.cos(c.spin));                      // flutter: the piece flips as it falls
        ctx.fillStyle = c.col; ctx.fillRect(-c.w * k / 2, -c.h * k / 2, c.w * k, c.h * k);
        ctx.restore();
      }
      return;
    }

    const g = f.geo(), im = photo(f.name);
    if (!g || !im) return;
    const P = ([x, y]) => [g.ox + x * g.W, g.oy + y * g.H];
    const path = (poly) => { ctx.beginPath(); poly.forEach((pt, i) => { const [x, y] = P(pt); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); };
    for (const b of f.spec.bottles) {
      // 1. paper over the bottle with nearby background, so the moving bottle leaves no ghost
      ctx.save(); path(b.poly); ctx.clip(); ctx.filter = 'blur(6px)';
      ctx.drawImage(im, g.ox + b.patch[0] * g.W, g.oy + b.patch[1] * g.H, g.W, g.H);
      ctx.restore();
      // 2. the bottle itself, tilting around the hand that holds it
      const a = (b.amp * Math.PI / 180) * (Math.sin(f.t * b.speed + b.phase) + 0.35 * Math.sin(f.t * b.speed * 2.7));
      const [px, py] = P(b.pivot);
      ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.translate(-px, -py);
      path(b.poly); ctx.clip(); ctx.drawImage(im, g.ox, g.oy, g.W, g.H);
      ctx.restore();
      // 3. champagne spraying out of the neck, in pulses as the bottle is shaken
      if (b.mouth) {
        const [mx, my] = P(b.mouth), k = g.W / 800;
        const rate = 160 * (0.4 + 0.6 * Math.max(0, Math.sin(f.t * b.speed * 1.3 + b.phase)));
        for (let i = 0; i < rate * dt; i++) {
          const ang = Math.atan2(b.spray[1], b.spray[0]) + a + (Math.random() - 0.5) * 0.7;
          const sp = (140 + Math.random() * 220) * k;
          f.drops.push({ x:mx, y:my, vx:Math.cos(ang) * sp, vy:Math.sin(ang) * sp, life:0, max:0.5 + Math.random() * 0.6, r:(0.8 + Math.random() * 1.8) * Math.max(0.6, k) });
        }
        ctx.fillStyle = '#fffaf0';
        f.drops = f.drops.filter((d) => {
          d.life += dt; d.vy += 420 * k * dt; d.x += d.vx * dt; d.y += d.vy * dt;
          if (d.life > d.max) return false;
          ctx.globalAlpha = 0.85 * (1 - d.life / d.max);
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
          return true;
        });
        ctx.globalAlpha = 1;
      }
    }
  }
  function newPiece(w, h, anywhere){
    return { x:Math.random() * w, y:anywhere ? Math.random() * h : -10 - Math.random() * 40,
      vy:40 + Math.random() * 70, sway:1 + Math.random() * 2, ph:Math.random() * 6, rot:Math.random() * 6,
      spin:Math.random() * 6, vs:3 + Math.random() * 6, w:4 + Math.random() * 4, h:8 + Math.random() * 6,
      col:CONFETTI[(Math.random() * CONFETTI.length) | 0] };
  }
  let fxLast = performance.now();
  function fxLoop(now){
    const dt = Math.min(0.05, (now - fxLast) / 1000); fxLast = now;
    for (const host of liveHosts) { if (!host.isConnected) { liveHosts.delete(host); continue; } drawFx(host, dt); }
    requestAnimationFrame(fxLoop);
  }
  requestAnimationFrame(fxLoop);

  /* ---------- Navigation ---------- */
  let path = [];          // node ids from Start to here
  let shotId = null;
  let mode = 'ask';

  function show(screen){
    ['ask','shoot','result'].forEach((s) => { el[s].hidden = s !== screen; });
    mode = screen;
    window.scrollTo({ top:0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function renderCrumbs(extra){
    const parts = path.map((id) => NODES[id].crumb);
    if (extra) parts.push(extra);
    el.crumbs.innerHTML = parts.map((p) => `<span>${p}</span>`).join('');
  }

  function goNode(id, push = true){
    if (push) path.push(id);
    const n = NODES[id];
    el.ask.dataset.start = n.start ? 'true' : 'false';
    el.askHeroImg.style.backgroundImage = `url("${IMG(n.img)}")`;
    el.askHeroImg.style.backgroundPosition = n.pos || 'center';
    setFx(el.askHeroImg, n.img, coverGeo(el.askHeroImg, n.img, n.pos));
    // restart the camera move for each new screen
    el.askHero.dataset.motion = '';
    void el.askHero.offsetWidth;
    el.askHero.dataset.motion = n.motion || 'push';
    el.askTag.textContent = n.tag;
    el.askTitle.textContent = n.title;
    el.askBody.textContent = n.body;
    el.askQ.textContent = n.q;
    el.askOptions.innerHTML = n.options.map((o, i) => o.img
      ? `<button class="opt" data-i="${i}"><span class="thumb" data-img="${o.img}" data-pos="${o.pos || 'center'}" style="background-image:url('${IMG(o.img)}');background-position:${o.pos || 'center'}"></span><span class="lbl">${o.label}</span></button>`
      : `<button class="opt yn" data-i="${i}"><span class="lbl">${o.label}</span></button>`).join('');
    el.askOptions.querySelectorAll('.thumb').forEach((t) => setFx(t, t.dataset.img, coverGeo(t, t.dataset.img, t.dataset.pos)));
    el.back.hidden = path.length <= 1;
    renderCrumbs();
    renderCollect();
    show('ask');
    announce(`${n.title}. ${n.q}`);
  }

  el.askOptions.addEventListener('click', (e) => {
    const b = e.target.closest('.opt'); if (!b) return;
    audio();
    const o = NODES[path[path.length - 1]].options[+b.dataset.i];
    if (o.to) goNode(o.to); else goShoot(o.shot);
  });
  el.back.addEventListener('click', () => { if (path.length > 1) { path.pop(); goNode(path[path.length - 1], false); } });

  /* ---------- Taking the shot (works like a DSLR) ----------
     Half-press (hold the button or Space): the lens focuses on the active AF point.
     Full press (push the button down, or Enter): takes the picture. The camera is in
     focus priority (AF-S / One Shot), so a full press only fires once focus is locked;
     a quick stab does both in one go. Letting go of a half-press cancels focus. */
  const live = { focus:0, half:false, full:false, locked:false, firing:false, downAt:0, startY:0, t:0 };
  let shotsLeft = 312;
  const HINT = 'Half-press to focus, then press all the way to take the picture.';

  // Etched AF points on the focusing screen (a 5 × 3 grid around the centre).
  el.afgrid.innerHTML = [0.3,0.4,0.5,0.6,0.7].flatMap((x) => [0.36,0.5,0.64].map((y) =>
    `<i style="left:${x*100}%;top:${y*100}%"></i>`)).join('');

  const fmtShutter = (v) => v.replace('1/', '');            // viewfinders show 1/60 as "60"
  const fmtAp = (v) => v.replace('f/', '').replace(/^(\d+)$/, '$1.0');

  function goShoot(id){
    shotId = id;
    const s = SHOTS[id], n = NODES[path[path.length - 1]];
    el.vf.style.setProperty('--ar', s.ar || 1.5);
    el.af.style.left = `${s.af[0]*100}%`; el.af.style.top = `${s.af[1]*100}%`;
    el.shootTag.textContent = n.tag;
    el.shootBody.textContent = `${n.body} Lens: ${s.cam[2]}.`;
    const [sh, ap, lens] = s.cam;
    el.ovfShutter.textContent = fmtShutter(sh);
    el.ovfAp.textContent = fmtAp(ap);
    el.lcdShutter.textContent = sh;
    el.lcdAp.textContent = 'F' + fmtAp(ap);
    el.lcdLens.textContent = lens;
    el.lcdDrive.textContent = s.burst ? 'Burst · 10 fps' : 'Single';
    el.ovfShots.textContent = shotsLeft;
    el.hint.textContent = HINT;
    Object.assign(live, { focus:0, half:false, full:false, locked:false, firing:false });
    el.shutter.dataset.stage = 'idle';
    renderCrumbs('Take the shot');
    show('shoot');
    setFx(el.vfImg, s.img, () => el.vfImg._geo);
    announce(`Take the shot. ${s.cam.join(', ')}. ${HINT}`);
  }

  let last = performance.now();
  function tick(now){
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (mode === 'shoot' && !live.firing) {
      const s = SHOTS[shotId];
      const focusing = live.half || live.full;
      if (focusing) live.focus = Math.min(1, live.focus + dt / 0.55);
      else live.focus = Math.max(0, live.focus - dt / 0.4);
      const locked = live.focus >= 0.98;
      if (locked && !live.locked) beep();
      live.locked = locked;
      // Handheld sway (wider sideways on a panning shot); the lens breathes as it racks focus.
      live.t += dt;
      const t = live.t, pan = shotId.startsWith('panning') ? 2.2 : 1;
      const move = reduceMotion ? { x:0, y:0, z:1 } : {
        x: (0.006*Math.sin(t*1.3) + 0.003*Math.sin(t*3.7)) * pan,
        y: 0.004*Math.sin(t*1.1 + 1) + 0.002*Math.sin(t*4.3),
        z: 1 + 0.035 * (1 - live.focus),
      };
      paint(el.vfImg, el.vf, s, (1 - live.focus) * 0.02, move);
      const state = locked ? 'lock' : focusing ? 'hunt' : 'idle';
      if (el.af.dataset.state !== state) el.af.dataset.state = state;
      el.ovf.dataset.focus = state;
      el.shutter.dataset.stage = live.full ? 'full' : live.half ? 'half' : 'idle';
      if (locked && live.full) fire();
    }
    requestAnimationFrame(tick);
  }

  function halfPress(){ if (mode === 'shoot' && !live.firing) { audio(); live.half = true; el.hint.textContent = HINT; } }
  function fullPress(){
    if (mode !== 'shoot' || live.firing) return;
    audio(); live.half = true; live.full = true;
    if (!live.locked) el.hint.textContent = 'Focusing… the camera fires as soon as focus locks.';
  }
  function letGo(){
    if (mode !== 'shoot' || live.firing || live.full) return;   // a full press always completes
    live.half = false;
  }

  function fire(){
    live.firing = true;
    const s = SHOTS[shotId], n = s.burst ? 6 : 1, gap = 0.1;   // burst at 10 frames per second
    el.shutter.dataset.stage = 'full';
    for (let i = 0; i < n; i++) {
      shutterSound(i * gap);
      setTimeout(() => {
        el.flash.classList.remove('on'); void el.flash.offsetWidth; el.flash.classList.add('on');   // mirror-up blackout
        el.ovf.classList.add('dark'); setTimeout(() => el.ovf.classList.remove('dark'), 80);
        shotsLeft = Math.max(0, shotsLeft - 1); el.ovfShots.textContent = shotsLeft;
      }, i * gap * 1000);
    }
    el.hint.textContent = n > 1 ? `${n} frames in burst.` : 'Frame taken.';
    setTimeout(showResult, (n * gap + 0.45) * 1000);
  }

  // Pointer: press and hold = half-press. Push down (drag down) = full press. A quick stab = full press.
  el.shutter.addEventListener('pointerdown', (e) => {
    e.preventDefault(); el.shutter.setPointerCapture(e.pointerId);
    live.downAt = performance.now(); live.startY = e.clientY; halfPress();
  });
  el.shutter.addEventListener('pointermove', (e) => {
    if (live.half && !live.full && e.clientY - live.startY > 10) fullPress();
  });
  el.shutter.addEventListener('pointerup', () => {
    if (live.half && !live.full && performance.now() - live.downAt < 220) fullPress(); else letGo();
  });
  el.shutter.addEventListener('pointercancel', letGo);
  el.shutter.addEventListener('contextmenu', (e) => e.preventDefault());
  el.shutter.addEventListener('click', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    if (mode !== 'shoot' || e.target === el.sound || e.repeat) return;
    if (e.key === ' ') { e.preventDefault(); halfPress(); }
    else if (e.key === 'Enter') { e.preventDefault(); fullPress(); }
  });
  document.addEventListener('keyup', (e) => {
    if (mode === 'shoot' && e.key === ' ' && e.target !== el.sound) { e.preventDefault(); letGo(); }
  });
  window.addEventListener('blur', letGo);
  el.sound.addEventListener('click', () => {
    soundOn = !soundOn;
    el.sound.setAttribute('aria-pressed', String(soundOn));
    el.sound.textContent = soundOn ? 'Sound on' : 'Sound off';
  });

  /* ---------- Result ---------- */
  function showResult(){
    const s = SHOTS[shotId];
    remember(shotId);
    el.printFrame.style.setProperty('--ar', s.ar || 1.5);
    el.resStamp.dataset.grade = s.grade;
    el.resStamp.textContent = s.grade === 'great' ? 'Great shot' : 'Weak shot';
    el.resTitle.textContent = s.grade === 'great' ? 'Great shot' : 'Weak shot';
    el.resText.textContent = s.text;
    el.resAction.textContent = s.action;
    el.resPath.textContent = path.slice(1).map((id) => NODES[id].crumb).join(' › ') + ` · ${s.cam[2]}`;
    renderCrumbs(s.grade === 'great' ? 'Great shot' : 'Weak shot');
    show('result');
    requestAnimationFrame(() => {
      paint(el.printImg, el.printFrame, s, 0);
      setFx(el.printImg, s.img, () => el.printImg._geo);
      // a weak shot prints a little flat
      if (s.grade === 'weak') el.printImg.style.filter = 'saturate(.75) contrast(.92)';
    });
    announce(`${el.resTitle.textContent}. ${s.text}`);
    el.resAction.focus({ preventScroll:true });
  }
  el.resAction.addEventListener('click', () => { path = []; goNode('start'); });

  /* ---------- Load ---------- */
  // Read each photo's real size, so a photo can be swapped for another saved under the same name.
  const names = [...new Set(Object.values(SHOTS).map((s) => s.img))];
  Promise.all(names.map((name) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { sizes[name] = { w:im.naturalWidth, h:im.naturalHeight }; res(); };
    im.onerror = () => { sizes[name] = { w:1500, h:1000 }; res(); };
    im.src = IMG(name);
  }))).then(() => {
    goNode('start');
    requestAnimationFrame(tick);
  });
})();
