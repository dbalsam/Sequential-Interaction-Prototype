/* Trackside: a motorsports photographer experience.
   One linear sequence of ten frames. Each frame: pan the viewfinder to put the
   subject in the focus point, hold the shutter to focus, release to shoot.
   Captions (title + Context / Theme) come from the Week 7 Figma board. */

(() => {
  'use strict';

  // target: where the subject sits in the photo, as fractions of width/height.
  // af: where the focus point sits in the viewfinder (rule-of-thirds lines), as fractions of the frame.
  //     Moving cars sit on the left third so they have room to drive into.
  // drift: moving cars keep sliding forward through the frame (frame widths per second).
  const SHOTS = [
    { file:'img/01.jpg', session:'Arrival',
      title:'Race field approaching the pit straight',
      brief:'Wide establishing shot. Put the leading pack in the focus point.',
      label:'Context', text:'Establishes the racing environment and the pressure of an approaching pit stop.',
      target:[0.30,0.72], af:[0.333,0.667], zoom:1.45, exp:['1/800','f/5.6'] },
    { file:'img/02.jpg', session:'Arrival',
      title:'Blue-and-red GT car',
      brief:'The #270 car is coming past. Pan with it and keep the door number in the point.',
      label:'Context', text:'Introduces the vehicle at the center of the interaction.',
      target:[0.38,0.62], af:[0.333,0.5], zoom:1.6, drift:0.16, exp:['1/125','f/8'] },
    { file:'img/03.jpg', session:'Arrival', ar:2/3,
      title:'Driver preparing between sessions',
      brief:'Portrait. Get the helmet visor in the point before the driver turns away.',
      label:'Context', text:'Establishes the human stakes behind the decisions made by the crew.',
      target:[0.50,0.22], af:[0.5,0.3], zoom:1.5, exp:['1/1000','f/2.8'] },
    { file:'img/04.jpg', session:'Pit lane',
      title:'Pit crew at work',
      brief:'The stop is live. Focus on the front tire as the gun goes on.',
      label:'Conceptual themes', text:'Represents the choice between a full-service stop and a faster tire-only stop.',
      target:[0.23,0.70], af:[0.333,0.667], zoom:1.6, exp:['1/2000','f/4'] },
    { file:'img/05.jpg', session:'Pit lane',
      title:'Team communication',
      brief:'Crew leaning into the cockpit. Put the driver’s helmet in the point.',
      label:'Conceptual themes', text:'Represents coordination, information-sharing, and choosing a response under pressure.',
      target:[0.50,0.32], af:[0.5,0.4], zoom:1.6, exp:['1/1600','f/4'] },
    { file:'img/06.jpg', session:'Trackside',
      title:'Race car captured in motion',
      brief:'Shooting through the trees. Track the car and hold it in the point.',
      label:'Conceptual themes', text:'Communicates urgency and the limited time to make a decision.',
      target:[0.50,0.60], af:[0.333,0.5], zoom:1.7, drift:0.2, exp:['1/60','f/11'] },
    { file:'img/07.jpg', session:'Trackside',
      title:'Speed and visual pressure',
      brief:'Low and fast on the straight. Pan with the red car.',
      label:'Conceptual themes', text:'Connects the speed of the race to the consequences of delays and mistakes.',
      target:[0.38,0.56], af:[0.333,0.5], zoom:1.6, drift:0.24, exp:['1/80','f/9'] },
    { file:'img/08.jpg', session:'Trackside',
      title:'Car navigating a corner',
      brief:'From above the apex. Put the car in the point as it clips the curb.',
      label:'Visual themes', text:'Provides a strong angle, track geometry, and visual direction for framing.',
      target:[0.43,0.50], af:[0.5,0.5], zoom:1.6, drift:0.14, exp:['1/250','f/7.1'] },
    { file:'img/09.jpg', session:'Trackside',
      title:'Car dropping through the downhill turn',
      brief:'Elevation change. Focus on the car committing to its line.',
      label:'Visual themes', text:'Uses elevation and track shape to show a car committing to its line.',
      target:[0.31,0.64], af:[0.333,0.667], zoom:1.6, exp:['1/1000','f/5.6'] },
    { file:'img/10.jpg', session:'Podium',
      title:'Nürburgring podium celebration',
      brief:'The finish. Put the driver celebrating on the podium in the point.',
      label:'Visual themes', text:'The payoff: the result every decision in the sequence was building toward.',
      target:[0.35,0.55], af:[0.5,0.5], zoom:1.5, exp:['1/500','f/4'] },
  ];

  const NOTES = {
    keeper:'Sharp, and the subject sits right on the point. That’s the frame the team will use.',
    usable:'In focus, but the subject is drifting off the point. Usable with a crop.',
    soft:'Focus never locked on the subject. Soft frame.',
    softMotion:'The car slid out of the point while you were focusing. Keep panning until you let go.',
    missed:'Fired before the lens found focus. Nothing’s sharp.',
  };
  const GRADE_WORD = { keeper:'Keeper', usable:'Usable', soft:'Soft', missed:'Missed' };

  const $ = (id) => document.getElementById(id);
  const el = {
    intro:$('intro'), shoot:$('shoot'), sheet:$('sheet'), begin:$('begin'),
    roll:$('roll'), session:$('session'), counter:$('counter'), title:$('shotTitle'), brief:$('brief'),
    vf:$('vf'), vfImg:$('vfImg'), af:$('af'), motionTag:$('motionTag'), meterFill:$('meterFill'),
    focusWord:$('focusWord'), exp:$('exp'), ap:$('ap'), flash:$('flash'), hint:$('hint'),
    shutter:$('shutter'), sound:$('sound'), announce:$('announce'),
    contact:$('contact'), tally:$('tally'), again:$('again'),
    print:$('print'), printImg:$('printImg'), printNo:$('printNo'), printStamp:$('printStamp'),
    printTitle:$('printTitle'), printNote:$('printNote'), printLabel:$('printLabel'), printText:$('printText'),
    reshoot:$('reshoot'), next:$('next'),
  };

  function afName([x, y]){
    const h = x < 0.45 ? 'left third' : x > 0.55 ? 'right third' : '';
    const v = y < 0.45 ? 'upper third' : y > 0.55 ? 'lower third' : '';
    if (h && v) return `${v.split(' ')[0]}-${h}`;
    return h || v || 'center';
  }
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad2 = (n) => String(n).padStart(2,'0');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Image geometry ---------- */
  // Scale so the photo covers the frame, times the shot's zoom.
  function geom(shot, fw, fh){
    const s = Math.max(fw / shot.w, fh / shot.h) * shot.zoom;
    return { W: shot.w * s, H: shot.h * s };
  }
  function limits(shot, fw, fh){
    const { W, H } = geom(shot, fw, fh);
    return { x0: fw/2/W, x1: 1 - fw/2/W, y0: fh/2/H, y1: 1 - fh/2/H };
  }
  // Paint a crop centred on (cx, cy) into a layer that overhangs its frame (for blur edges).
  function paint(layer, frame, shot, cx, cy, blurFrac){
    const fw = frame.clientWidth, fh = frame.clientHeight;
    const pad = (layer.offsetWidth - fw) / 2;
    const { W, H } = geom(shot, fw, fh);
    layer.style.backgroundImage = `url("${shot.file}")`;
    layer.style.backgroundSize = `${W}px ${H}px`;
    layer.style.backgroundPosition = `${pad + fw/2 - cx*W}px ${pad + fh/2 - cy*H}px`;
    const b = blurFrac * fw;
    layer.style.filter = b > 0.3 ? `blur(${b.toFixed(1)}px)` : 'none';
  }

  /* ---------- Sound (Web Audio, made on the fly) ---------- */
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
  function shutterSound(){ click(0, 0.04, 2400, 0.9); click(0.07, 0.05, 1500, 0.7); }
  function beep(){
    const a = audio(); if (!a) return;
    [0, 0.09].forEach((t) => {
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = 2200; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, a.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.12, a.currentTime + t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + 0.06);
      o.connect(g).connect(a.destination); o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.07);
    });
  }

  /* ---------- State ---------- */
  const results = [];        // per shot: { cx, cy, blur, grade }
  let idx = 0;
  let mode = 'intro';        // intro | shoot | review | sheet
  const live = { cx:.5, cy:.5, focus:0, holding:false, locked:false, t:0, keys:new Set() };

  function announce(msg){ el.announce.textContent = ''; requestAnimationFrame(() => { el.announce.textContent = msg; }); }

  function buildRoll(){
    el.roll.innerHTML = SHOTS.map((_, i) => `<li data-i="${i}" aria-label="Frame ${i+1}"></li>`).join('');
  }
  function updateRoll(){
    [...el.roll.children].forEach((li, i) => {
      const r = results[i];
      li.dataset.state = i === idx && mode === 'shoot' ? 'current' : r ? 'done' : '';
      if (r) { li.dataset.grade = r.grade; li.style.backgroundImage = `url("${SHOTS[i].file}")`; }
      else { delete li.dataset.grade; li.style.backgroundImage = ''; }
    });
  }

  function startShot(i){
    idx = i; mode = 'shoot';
    const s = SHOTS[i];
    el.vf.style.setProperty('--ar', s.ar || 1.5);
    el.session.textContent = s.session;
    el.counter.textContent = `FR ${pad2(i+1)}/${pad2(SHOTS.length)}`;
    el.title.textContent = s.title;
    el.brief.textContent = s.brief;
    el.exp.textContent = s.exp[0]; el.ap.textContent = s.exp[1];
    el.motionTag.hidden = !s.drift;
    el.af.style.left = `${s.af[0]*100}%`; el.af.style.top = `${s.af[1]*100}%`;
    el.hint.textContent = `Focus point: ${afName(s.af)}. ` + (s.drift ? 'The car is moving, so keep dragging with it while you hold.' : 'Drag to frame, then hold the shutter.');

    // Start with the subject off the point so there's framing to do.
    requestAnimationFrame(() => {
      const L = limits(s, el.vf.clientWidth, el.vf.clientHeight);
      const fw = el.vf.clientWidth, fh = el.vf.clientHeight, { W, H } = geom(s, fw, fh);
      const [ax, ay] = s.af;
      // Moving cars enter from behind the focus point; still subjects start off to one side.
      const sx = s.drift ? ax - 0.14 : ax + (ax <= 0.5 ? 0.24 : -0.24);
      const sy = ay + (s.drift ? 0 : ay <= 0.5 ? 0.16 : -0.16);
      live.cx = clamp(s.target[0] + (0.5 - sx) * fw / W, L.x0, L.x1);
      live.cy = clamp(s.target[1] + (0.5 - sy) * fh / H, L.y0, L.y1);
      live.focus = 0; live.holding = false; live.locked = false;
    });
    updateRoll();
    announce(`Frame ${i+1} of ${SHOTS.length}. ${s.title}. ${s.brief}`);
    el.vf.focus({ preventScroll:true });
    window.scrollTo({ top:0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* ---------- The live loop ---------- */
  let last = performance.now();
  function shake(t){ return reduceMotion ? [0,0] : [0.004*Math.sin(t*7.1) + 0.003*Math.sin(t*12.7), 0.004*Math.sin(t*5.3+1) + 0.002*Math.sin(t*15.1)]; }

  function distance(s, cx, cy, fw, fh){
    const { W, H } = geom(s, fw, fh);
    const px = fw/2 + (s.target[0] - cx) * W, py = fh/2 + (s.target[1] - cy) * H;   // subject, in frame px
    return Math.hypot(px - s.af[0] * fw, py - s.af[1] * fh) / fw;
  }

  function frame(now){
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (mode === 'shoot') {
      const s = SHOTS[idx];
      const fw = el.vf.clientWidth, fh = el.vf.clientHeight;
      const { W, H } = geom(s, fw, fh);
      const L = limits(s, fw, fh);
      live.t += dt;

      // Arrow keys pan at a steady rate (frame widths per second).
      const k = live.keys, step = 0.45 * fw * dt;
      if (k.has('ArrowLeft')) live.cx -= step / W;
      if (k.has('ArrowRight')) live.cx += step / W;
      if (k.has('ArrowUp')) live.cy -= step / H;
      if (k.has('ArrowDown')) live.cy += step / H;

      // Moving subject: the view keeps sliding off it, unevenly.
      if (s.drift) live.cx -= s.drift * (1 + 0.35*Math.sin(live.t*2.3)) * fw * dt / W;
      live.cx = clamp(live.cx, L.x0, L.x1); live.cy = clamp(live.cy, L.y0, L.y1);

      const [sx, sy] = shake(live.t);
      const vx = live.cx + sx * fw / W, vy = live.cy + sy * fw / H;
      const d = distance(s, vx, vy, fw, fh);
      const inPoint = d < 0.085;

      if (live.holding) {
        if (inPoint) live.focus = Math.min(1, live.focus + dt / 0.55);
        else live.focus += (0.22 - live.focus) * Math.min(1, dt * (s.drift ? 1.5 : 4));   // lens hunts
      } else {
        live.focus = Math.max(0, live.focus - dt / 0.5);
      }
      const nowLocked = live.focus >= 0.98;
      if (nowLocked && !live.locked) beep();
      live.locked = nowLocked;

      paint(el.vfImg, el.vf, s, vx, vy, (1 - live.focus) * 0.022);
      el.af.dataset.state = live.locked ? 'lock' : live.holding && !inPoint ? 'hunt' : inPoint ? 'on' : d < 0.18 ? 'near' : 'idle';
      el.vf.dataset.focus = live.locked ? 'lock' : '';
      el.vf.dataset.d = d.toFixed(3);   // distance from subject to the focus point (handy for testing)
      el.meterFill.style.width = `${Math.round(live.focus*100)}%`;
      el.focusWord.textContent = live.locked ? 'AF ●' : live.holding ? 'AF…' : 'MF';
      el.shutter.classList.toggle('held', live.holding);
      el.shutter.classList.toggle('lock', live.locked);
      live.view = [vx, vy, d];
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Firing ---------- */
  function press(){
    if (mode !== 'shoot' || live.holding) return;
    audio();
    live.holding = true;
  }
  function release(){
    if (mode !== 'shoot' || !live.holding) return;
    live.holding = false;
    const [vx, vy, d] = live.view || [live.cx, live.cy, 1];
    const f = live.focus;
    const grade = f >= 0.95 && d < 0.085 ? 'keeper'
                : f >= 0.95 && d < 0.15 ? 'usable'
                : f >= 0.45 ? 'soft' : 'missed';
    results[idx] = { cx:vx, cy:vy, blur:(1 - f) * 0.022, grade };
    mode = 'review';
    shutterSound();
    el.flash.classList.remove('on'); void el.flash.offsetWidth; el.flash.classList.add('on');
    updateRoll();
    setTimeout(() => showPrint(idx, true), reduceMotion ? 0 : 320);
  }

  function showPrint(i, afterShot){
    const s = SHOTS[i], r = results[i];
    el.print.style.setProperty('--ar', s.ar || 1.5);
    el.printNo.textContent = `FR ${pad2(i+1)} · ${s.session}`;
    el.printStamp.dataset.grade = r.grade;
    el.printStamp.textContent = GRADE_WORD[r.grade];
    el.printTitle.textContent = s.title;
    el.printNote.textContent = r.grade === 'soft' && s.drift ? NOTES.softMotion : NOTES[r.grade];
    el.printLabel.textContent = s.label;
    el.printText.textContent = s.text;
    el.reshoot.hidden = !afterShot;
    el.next.textContent = afterShot ? (i === SHOTS.length - 1 ? 'See the contact sheet' : 'Next frame') : 'Close';
    el.print.dataset.after = afterShot ? '1' : '';
    el.print.showModal();
    paint(el.printImg, el.printImg.parentElement, s, r.cx, r.cy, r.blur);
    announce(`${GRADE_WORD[r.grade]}. ${el.printNote.textContent}`);
    el.next.focus();
  }

  el.next.addEventListener('click', () => {
    const after = el.print.dataset.after === '1';
    el.print.close();
    if (!after) return;
    if (idx < SHOTS.length - 1) startShot(idx + 1); else showSheet();
  });
  el.reshoot.addEventListener('click', () => { el.print.close(); results[idx] = undefined; startShot(idx); });
  el.print.addEventListener('cancel', (e) => { if (el.print.dataset.after === '1') e.preventDefault(); });

  /* ---------- Contact sheet ---------- */
  function showSheet(){
    mode = 'sheet';
    el.shoot.hidden = true; el.sheet.hidden = false;
    const keepers = results.filter((r) => r.grade === 'keeper').length;
    const usable = results.filter((r) => r.grade === 'usable').length;
    el.tally.textContent = `${keepers} keeper${keepers === 1 ? '' : 's'} and ${usable} usable out of ${SHOTS.length} frames. Tap a frame to see the print.`;
    el.contact.innerHTML = SHOTS.map((s, i) => `
      <li>
        <button data-i="${i}" aria-label="Frame ${i+1}: ${s.title}, ${GRADE_WORD[results[i].grade]}">
          <span class="tb" style="position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%);height:100%;aspect-ratio:${s.ar || 1.5};overflow:hidden"><span class="t"></span></span>
        </button>
        <span class="cap"><b>${pad2(i+1)}</b><span data-grade="${results[i].grade}">${GRADE_WORD[results[i].grade]}</span></span>
      </li>`).join('');
    requestAnimationFrame(() => {
      el.contact.querySelectorAll('button').forEach((b) => {
        const i = +b.dataset.i, r = results[i];
        paint(b.querySelector('.t'), b.querySelector('.tb'), SHOTS[i], r.cx, r.cy, r.blur);
      });
    });
    window.scrollTo({ top:0 });
    el.sheet.querySelector('h2').focus?.();
    announce(el.tally.textContent);
  }
  el.contact.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (b) showPrint(+b.dataset.i, false);
  });
  el.again.addEventListener('click', () => {
    results.length = 0;
    el.sheet.hidden = true; el.shoot.hidden = false;
    startShot(0);
  });

  /* ---------- Input ---------- */
  let drag = null;
  el.vf.addEventListener('pointerdown', (e) => {
    if (mode !== 'shoot') return;
    drag = { id:e.pointerId, x:e.clientX, y:e.clientY };
    el.vf.setPointerCapture(e.pointerId); el.vf.classList.add('dragging');
  });
  el.vf.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id || mode !== 'shoot') return;
    const s = SHOTS[idx], { W, H } = geom(s, el.vf.clientWidth, el.vf.clientHeight);
    live.cx -= (e.clientX - drag.x) / W; live.cy -= (e.clientY - drag.y) / H;
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const endDrag = (e) => { if (drag && e.pointerId === drag.id) { drag = null; el.vf.classList.remove('dragging'); } };
  el.vf.addEventListener('pointerup', endDrag);
  el.vf.addEventListener('pointercancel', endDrag);

  el.shutter.addEventListener('pointerdown', (e) => { e.preventDefault(); el.shutter.setPointerCapture(e.pointerId); press(); });
  el.shutter.addEventListener('pointerup', release);
  el.shutter.addEventListener('pointercancel', release);
  el.shutter.addEventListener('contextmenu', (e) => e.preventDefault());

  const ARROWS = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
  document.addEventListener('keydown', (e) => {
    if (mode !== 'shoot' || el.print.open) return;
    if (ARROWS.includes(e.key)) { e.preventDefault(); live.keys.add(e.key); }
    else if ((e.key === ' ' || e.key === 'Enter') && e.target !== el.sound) { e.preventDefault(); if (!e.repeat) press(); }
  });
  document.addEventListener('keyup', (e) => {
    if (ARROWS.includes(e.key)) live.keys.delete(e.key);
    else if ((e.key === ' ' || e.key === 'Enter') && e.target !== el.sound) { e.preventDefault(); release(); }
  });
  window.addEventListener('blur', () => { live.keys.clear(); if (live.holding) live.holding = false; });

  el.sound.addEventListener('click', () => {
    soundOn = !soundOn;
    el.sound.setAttribute('aria-pressed', String(soundOn));
    el.sound.textContent = soundOn ? 'Sound on' : 'Sound off';
  });

  el.begin.addEventListener('click', () => {
    audio();
    el.intro.hidden = true; el.shoot.hidden = false;
    startShot(0);
  });

  /* ---------- Load the roll ---------- */
  // Read each photo's real size, so higher-resolution exports can be dropped in with the same names.
  Promise.all(SHOTS.map((s) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { s.w = im.naturalWidth; s.h = im.naturalHeight; res(); };
    im.onerror = () => { s.w = 1500; s.h = 1000; res(); };
    im.src = s.file;
  }))).then(() => {
    buildRoll();
    el.begin.disabled = false;
    el.begin.textContent = 'Load the roll';
    requestAnimationFrame(frame);
  });
})();
