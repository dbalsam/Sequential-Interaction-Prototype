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
      crumb:'Trackside', tag:'Trackside', img:'f1-panning',
      title:'Trackside',
      body:'Cars are coming through at full speed. You get one pass at this.',
      q:'What type of settings do I need?',
      options:[ { label:'Panning Shot', to:'panning', img:'astemo-panning' }, { label:'Sharp Action Shot', to:'sharp', img:'corner' } ],
    },
    panning: {
      crumb:'Panning shot', tag:'Trackside · Panning shot', img:'astemo-panning',
      title:'Panning shot',
      body:'Track smoothly. Use a slower shutter speed to follow the car’s movement.',
      q:'Do you have a long telephoto lens?',
      options:[ { label:'Yes', shot:'panningGreat' }, { label:'No', shot:'panningWeak' } ],
    },
    sharp: {
      crumb:'Sharp action shot', tag:'Trackside · Sharp action', img:'corner',
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
    askHero:$('askHero'), askTag:$('askTag'), askTitle:$('askTitle'), askBody:$('askBody'), askQ:$('askQ'),
    askOptions:$('askOptions'), back:$('back'), collect:$('collect'),
    shootTag:$('shootTag'), shootBody:$('shootBody'), vf:$('vf'), vfImg:$('vfImg'), af:$('af'),
    modeTag:$('modeTag'), roShutter:$('roShutter'), roAp:$('roAp'), roLens:$('roLens'),
    meterFill:$('meterFill'), focusWord:$('focusWord'), flash:$('flash'), hint:$('hint'),
    shutter:$('shutter'), sound:$('sound'),
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
  function paint(layer, frame, shot, blurFrac){
    const fw = frame.clientWidth, fh = frame.clientHeight;
    const pad = (layer.offsetWidth - fw) / 2;
    const { w, h } = sizes[shot.img];
    const s = Math.max(fw / w, fh / h) * shot.zoom, W = w * s, H = h * s;
    const cx = Math.min(1 - fw/2/W, Math.max(fw/2/W, shot.c[0]));
    const cy = Math.min(1 - fh/2/H, Math.max(fh/2/H, shot.c[1]));
    layer.style.backgroundImage = `url("${IMG(shot.img)}")`;
    layer.style.backgroundSize = `${W}px ${H}px`;
    layer.style.backgroundPosition = `${pad + fw/2 - cx*W}px ${pad + fh/2 - cy*H}px`;
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
  const shutterSound = (at = 0) => { click(at, 0.04, 2400, 0.9); click(at + 0.06, 0.05, 1500, 0.7); };
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
    el.askHero.style.backgroundImage = `url("${IMG(n.img)}")`;
    el.askHero.style.backgroundPosition = n.pos || 'center';
    el.askTag.textContent = n.tag;
    el.askTitle.textContent = n.title;
    el.askBody.textContent = n.body;
    el.askQ.textContent = n.q;
    el.askOptions.innerHTML = n.options.map((o, i) => o.img
      ? `<button class="opt" data-i="${i}"><span class="thumb" style="background-image:url('${IMG(o.img)}');background-position:${o.pos || 'center'}"></span><span class="lbl">${o.label}</span></button>`
      : `<button class="opt yn" data-i="${i}"><span class="lbl">${o.label}</span></button>`).join('');
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

  /* ---------- Taking the shot ---------- */
  const live = { focus:0, holding:false, locked:false, firing:false };

  function goShoot(id){
    shotId = id;
    const s = SHOTS[id], n = NODES[path[path.length - 1]];
    el.vf.style.setProperty('--ar', s.ar || 1.5);
    el.af.style.left = `${s.af[0]*100}%`; el.af.style.top = `${s.af[1]*100}%`;
    el.shootTag.textContent = n.tag;
    el.shootBody.textContent = `${n.body} Lens: ${s.cam[2]}.`;
    [el.roShutter.textContent, el.roAp.textContent, el.roLens.textContent] = s.cam;
    el.modeTag.hidden = !s.burst;
    el.hint.textContent = 'Hold the shutter (or Space) until it beeps, then let go.';
    Object.assign(live, { focus:0, holding:false, locked:false, firing:false });
    el.shutter.disabled = false;
    renderCrumbs('Take the shot');
    show('shoot');
    announce(`Take the shot. ${s.cam.join(', ')}. Hold the shutter until it beeps, then let go.`);
  }

  let last = performance.now();
  function tick(now){
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (mode === 'shoot' && !live.firing) {
      const s = SHOTS[shotId];
      if (live.holding) live.focus = Math.min(1, live.focus + dt / 0.6);
      else live.focus = Math.max(0, live.focus - dt / 0.5);
      const locked = live.focus >= 0.98;
      if (locked && !live.locked) beep();
      live.locked = locked;
      paint(el.vfImg, el.vf, s, (1 - live.focus) * 0.02);
      el.af.dataset.state = locked ? 'lock' : live.holding ? 'hunt' : 'idle';
      el.vf.dataset.focus = locked ? 'lock' : '';
      el.meterFill.style.width = `${Math.round(live.focus * 100)}%`;
      el.focusWord.textContent = locked ? 'AF ●' : live.holding ? 'AF…' : 'MF';
      el.shutter.classList.toggle('held', live.holding);
      el.shutter.classList.toggle('lock', locked);
    }
    requestAnimationFrame(tick);
  }

  function press(){ if (mode === 'shoot' && !live.firing) { audio(); live.holding = true; } }
  function release(){
    if (mode !== 'shoot' || !live.holding || live.firing) return;
    live.holding = false;
    if (!live.locked) { el.hint.textContent = 'Too early. Keep holding until you hear the beep.'; return; }
    live.firing = true; el.shutter.disabled = true;
    const s = SHOTS[shotId], n = s.burst ? 4 : 1, gap = 0.11;
    for (let i = 0; i < n; i++) {
      shutterSound(i * gap);
      setTimeout(() => { el.flash.classList.remove('on'); void el.flash.offsetWidth; el.flash.classList.add('on'); }, i * gap * 1000);
    }
    setTimeout(showResult, (n * gap + 0.35) * 1000);
  }

  el.shutter.addEventListener('pointerdown', (e) => { e.preventDefault(); el.shutter.setPointerCapture(e.pointerId); press(); });
  el.shutter.addEventListener('pointerup', release);
  el.shutter.addEventListener('pointercancel', () => { live.holding = false; });
  el.shutter.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    if (mode === 'shoot' && (e.key === ' ' || e.key === 'Enter') && e.target !== el.sound) { e.preventDefault(); if (!e.repeat) press(); }
  });
  document.addEventListener('keyup', (e) => {
    if (mode === 'shoot' && (e.key === ' ' || e.key === 'Enter') && e.target !== el.sound) { e.preventDefault(); release(); }
  });
  window.addEventListener('blur', () => { live.holding = false; });
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
