/* Pit stop training drill.
   The three interaction studies (studies/pit-stop-studies/index.html) wired into one
   linear sequence: Start -> Fit (drag) -> Drop (swipe) -> Send (pull) -> Result.
   Each study keeps its original behaviour and tuning; the "previous step complete"
   checkboxes are replaced by the Drill controller, which unlocks the next step when
   the current one succeeds. */

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=ms=>(ms/1000).toFixed(2)+' s';

/* ---------- Step 1: Fit the wheel (drag) ---------- */
const Fit=(function(){
const $=id=>document.getElementById(id);
const field=$('field'),tire=$('tire');
const halo=$('halo'),socket=$('socket');
const stateEl=$('state1'),gapEl=$('gap1');
const next=$('next1'),nextText=$('nextText1');
const PULL=95,DROP=40;
let W=0,H=0,hx=0,hy=0,homeX=0,homeY=0,cx=0,cy=0,tx=0,ty=0,mode='rack',dragging=false,offX=0,offY=0,px=0,py=0,seatT=null,missT=null;
let enabled=false;
const dist=(x,y)=>Math.hypot(x-hx,y-hy);

function layout(){
  W=field.clientWidth;H=field.clientHeight;
  hx=W*0.66;hy=H/2;homeX=W*0.17;homeY=H/2;
  [halo,socket].forEach(el=>{el.style.left=hx+'px';el.style.top=hy+'px';});
  if(mode==='fitted'){cx=hx;cy=hy;}
  else if(mode==='rack'){cx=homeX;cy=homeY;}
  tx=cx;ty=cy;place();
}
function place(){
  tire.style.transform='translate('+cx+'px,'+cy+'px)';
  const v=clamp((cx-homeX)/Math.max(1,hx-homeX),0,1);
  tire.setAttribute('aria-valuenow',Math.round(v*100));
}
/* The pointer sets a target. The tire trails behind it, so it feels heavy. */
function carry(){
  const d=dist(px,py);
  if(d<PULL){
    const k=Math.pow(d/PULL,1.6);
    tx=hx+(px-hx)*k;ty=hy+(py-hy)*k;
  }else{tx=px;ty=py;}
  const level=d<=DROP?'ready':d<PULL?'near':'far';
  halo.dataset.level=level;
  stateEl.textContent=level==='ready'?'Lined up with the studs. Let go.':level==='near'?'The hub is pulling it in':'Carrying';
  gapEl.textContent=level==='ready'?'0 px off':Math.round(d)+' px off';
}
let last=performance.now();
function frame(t){
  const dt=Math.min(50,t-last);last=t;
  if(mode==='carry'&&!tire.classList.contains('anim')){
    const k=1-Math.exp(-dt/70);
    cx+=(tx-cx)*k;cy+=(ty-cy)*k;place();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function drop(){
  tire.classList.add('anim');
  if(dist(px,py)<=DROP){
    mode='fitted';cx=hx;cy=hy;tx=cx;ty=cy;place();
    tire.classList.add('locked','seat');
    tire.setAttribute('aria-disabled','true');
    socket.style.display='none';
    stateEl.textContent='Seating...';gapEl.textContent='';
    clearTimeout(seatT);
    seatT=setTimeout(()=>{
      if(mode!=='fitted')return;
      halo.dataset.level='fitted';
      stateEl.textContent='Fitted';gapEl.textContent='locked';
      next.dataset.open='true';nextText.textContent='Jack open';
      enabled=false;
      Drill.complete(1);
    },260);
  }else{
    mode='rack';cx=homeX;cy=homeY;tx=cx;ty=cy;place();
    halo.dataset.level='far';
    stateEl.textContent='Missed. It dropped back to the rack.';gapEl.textContent='';
    clearTimeout(missT);
    missT=setTimeout(()=>{if(mode==='rack'&&enabled)stateEl.textContent='On the rack';},900);
  }
}
function begin(){if(enabled)Drill.firstTouch();}
tire.addEventListener('pointerdown',e=>{
  if(!enabled||mode==='fitted')return;
  begin();
  dragging=true;mode='carry';tire.setPointerCapture(e.pointerId);
  const r=field.getBoundingClientRect();
  offX=e.clientX-r.left-cx;offY=e.clientY-r.top-cy;
  px=cx;py=cy;tx=cx;ty=cy;
  tire.classList.remove('anim');tire.classList.add('grab');
  stateEl.textContent='Carrying';
});
tire.addEventListener('pointermove',e=>{
  if(!dragging)return;
  const r=field.getBoundingClientRect();
  px=clamp(e.clientX-r.left-offX,44,W-44);
  py=clamp(e.clientY-r.top-offY,44,H-44);
  carry();
});
function end(){
  if(!dragging)return;
  dragging=false;tire.classList.remove('grab');drop();
}
tire.addEventListener('pointerup',end);
tire.addEventListener('pointercancel',end);
tire.addEventListener('keydown',e=>{
  if(!enabled||mode==='fitted')return;
  const keys=['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Enter',' '];
  if(!keys.includes(e.key))return;
  e.preventDefault();
  begin();
  if(mode!=='carry'){mode='carry';px=cx;py=cy;tx=cx;ty=cy;}
  tire.classList.remove('anim');
  const s=12;
  if(e.key==='ArrowRight')px=clamp(px+s,44,W-44);
  else if(e.key==='ArrowLeft')px=clamp(px-s,44,W-44);
  else if(e.key==='ArrowUp')py=clamp(py-s,44,H-44);
  else if(e.key==='ArrowDown')py=clamp(py+s,44,H-44);
  else{drop();return;}
  carry();
});
window.addEventListener('resize',layout);
layout();

return{
  el:tire,
  unlock(){
    enabled=true;tire.classList.remove('off');
    tire.tabIndex=0;tire.removeAttribute('aria-disabled');
    stateEl.textContent='On the rack';
  },
  /* Back to the starting state: tire on the rack, not yet available. */
  reset(){
    clearTimeout(seatT);clearTimeout(missT);
    enabled=false;dragging=false;
    mode='rack';cx=homeX;cy=homeY;tx=cx;ty=cy;
    tire.classList.add('anim','off');tire.classList.remove('locked','seat','grab');
    tire.tabIndex=-1;tire.setAttribute('aria-disabled','true');
    halo.dataset.level='far';socket.style.display='';
    next.dataset.open='false';nextText.textContent='Jack locked';
    stateEl.textContent="Locked. The car isn't in yet.";gapEl.textContent='';place();
  },
  layout
};
})();

/* ---------- Step 2: Drop the jack (swipe) ---------- */
const Drop=(function(){
const $=id=>document.getElementById(id);
const zone=$('zone'),car=$('car'),jack=$('jack');
const stateEl=$('state2');
const next=$('next2'),nextText=$('nextText2');
const chevs=[...zone.querySelectorAll('.chev')];
const LIFT=100,MIN_DIST=55,MIN_V=0.9;
let state='locked',dragging=false,startY=0,dy=0,samples=[];

function setState(s){state=s;zone.dataset.state=s;}
function show(disp){
  const h=LIFT-clamp(disp,0,LIFT);
  jack.style.height=h+'px';car.style.bottom=(h+14)+'px';
}
/* Speed is shown by the chevrons themselves. All three lit means fast enough. */
function setArrows(v){
  const n=Math.min(3,Math.floor(v/MIN_V*3));
  chevs.forEach((c,i)=>c.classList.toggle('on',i<n));
}
function speed(){
  if(samples.length<2)return 0;
  const a=samples[0],b=samples[samples.length-1],dt=b.t-a.t;
  return dt>0?Math.max(0,(b.y-a.y)/dt):0;
}
function resetPose(animate){
  zone.classList.remove('anim','back');
  if(animate)zone.classList.add('back');
  show(0);
}
function lock(){
  setState('locked');dragging=false;resetPose(true);setArrows(0);
  zone.tabIndex=-1;zone.setAttribute('aria-disabled','true');
  stateEl.textContent='Locked. Fit the tire first.';
  next.dataset.open='false';nextText.textContent='Release locked';
}
function unlock(){
  setState('ready');setArrows(0);
  zone.tabIndex=0;zone.removeAttribute('aria-disabled');
  stateEl.textContent='Ready. Flick down on the car.';
}
function drop(){
  setState('dropped');zone.classList.remove('back');zone.classList.add('anim');show(LIFT);
  zone.tabIndex=-1;zone.setAttribute('aria-disabled','true');
  stateEl.textContent='Car down';
  next.dataset.open='true';nextText.textContent='Release open';
  Drill.complete(2);
}
function reject(msg){
  setState('ready');resetPose(true);setArrows(0);stateEl.textContent=msg;
}
zone.addEventListener('pointerdown',e=>{
  if(state!=='ready')return;
  dragging=true;zone.setPointerCapture(e.pointerId);zone.classList.add('grab');zone.classList.remove('anim','back');
  startY=e.clientY;dy=0;samples=[{t:e.timeStamp,y:e.clientY}];
  stateEl.textContent='Swiping';
});
zone.addEventListener('pointermove',e=>{
  if(!dragging)return;
  dy=e.clientY-startY;
  samples.push({t:e.timeStamp,y:e.clientY});
  while(samples.length>2&&e.timeStamp-samples[0].t>100)samples.shift();
  show(dy);
  const v=speed();setArrows(v);
  stateEl.textContent=v>=MIN_V?'Fast enough. Keep going and let go.':'Faster';
});
function end(){
  if(!dragging)return;
  dragging=false;zone.classList.remove('grab');
  const v=speed();
  if(dy<MIN_DIST)reject('Too short. The jack caught it. Swipe farther.');
  else if(v<MIN_V)reject('Too slow. The jack caught it. Flick faster.');
  else drop();
}
zone.addEventListener('pointerup',end);
zone.addEventListener('pointercancel',end);
zone.addEventListener('keydown',e=>{
  if(state!=='ready')return;
  if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){e.preventDefault();setArrows(MIN_V);drop();}
});
show(0);setArrows(0);

return{el:zone,unlock,reset:lock};
})();

/* ---------- Step 3: Send the car (pull) ---------- */
const Send=(function(){
const $=id=>document.getElementById(id);
const track=$('track'),handle=$('handle'),fill=$('fill');
const commit=$('commit'),mini=$('mini'),hlabel=$('hlabel');
const stateEl=$('state3');
const next=$('next3'),nextText=$('nextText3');
const H=56,TRACK_H=216;
const MAX=TRACK_H-H,THRESH=Math.round(MAX*0.85);
const G=0.0035; // gravity, px per ms squared
commit.style.bottom=(THRESH+H/2)+'px';
let lift=0,tLift=0,vel=0,mode='idle',slamStart=0,slamT=0;
let unlocked=false,done=false,dragging=false,startY=0,startLift=0,launchT=null;

function render(){
  handle.style.transform='translateY('+(-lift)+'px)';
  fill.style.height=(lift+H/2)+'px';
  handle.setAttribute('aria-valuenow',Math.round(lift/MAX*100));
}
function setHandle(s){
  handle.dataset.state=s;
  hlabel.textContent={locked:'Locked',ready:'Pull',armed:'Let go',released:'Gone'}[s];
}
function clearCar(){
  clearTimeout(launchT);
  mini.style.transition='none';mini.classList.remove('go');
  void mini.offsetWidth;mini.style.transition='';
}
function preview(){
  if(!unlocked||done)return;
  const a=tLift>=THRESH;
  setHandle(a?'armed':'ready');
  stateEl.textContent=a?'Past the line. Let go to release.':'Ready. Pull up past the line.';
}
/* One loop drives all lever motion: lag while held, gravity when dropped, a hard slam on commit. */
let last=performance.now();
function loop(t){
  const dt=Math.min(40,t-last);last=t;
  if(mode==='drag'){
    lift+=(tLift-lift)*(1-Math.exp(-dt/90));render();
  }else if(mode==='fall'){
    lift-=vel*dt;vel+=G*dt;
    if(lift<=0){
      lift=0;
      if(vel>0.18){vel=-vel*0.3;}else{vel=0;mode='idle';}
    }
    render();
  }else if(mode==='slam'){
    slamT+=dt;const p=Math.min(1,slamT/170);
    lift=slamStart+(MAX-slamStart)*p*p;render();
    if(p>=1)impact();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function impact(){
  mode='idle';done=true;
  Drill.stopClock();
  setHandle('released');
  handle.tabIndex=-1;handle.setAttribute('aria-disabled','true');
  track.classList.remove('thud');void track.offsetWidth;track.classList.add('thud');
  stateEl.textContent='Released';
  next.dataset.open='true';nextText.textContent='Car gone';
  launchT=setTimeout(()=>{mini.classList.add('go');Drill.complete(3);},110);
}
function finish(){
  if(tLift>=THRESH){
    mode='slam';slamStart=lift;slamT=0;
    stateEl.textContent='Releasing...';
  }else{
    tLift=0;vel=0;mode='fall';preview();
    stateEl.textContent='Not committed. The lever dropped back.';
  }
}
function lock(){
  unlocked=false;done=false;clearCar();
  tLift=0;vel=0;mode='fall';setHandle('locked');
  handle.tabIndex=-1;handle.setAttribute('aria-disabled','true');
  stateEl.textContent='Locked. Lower the car first.';
  next.dataset.open='false';nextText.textContent='Car held';
}
function unlock(){
  unlocked=true;setHandle('ready');
  handle.tabIndex=0;handle.removeAttribute('aria-disabled');
  stateEl.textContent='Ready. Pull up past the line.';
}
handle.addEventListener('pointerdown',e=>{
  if(!unlocked||done||mode==='slam')return;
  dragging=true;handle.setPointerCapture(e.pointerId);
  startY=e.clientY;startLift=lift;tLift=lift;vel=0;mode='drag';
  handle.style.cursor='grabbing';
});
handle.addEventListener('pointermove',e=>{
  if(!dragging)return;
  tLift=clamp(startLift+(startY-e.clientY),0,MAX);preview();
});
function end(){
  if(!dragging)return;dragging=false;handle.style.cursor='';finish();
}
handle.addEventListener('pointerup',end);
handle.addEventListener('pointercancel',end);
handle.addEventListener('keydown',e=>{
  if(!unlocked||done||mode==='slam')return;
  if(mode!=='drag'){tLift=lift;vel=0;mode='drag';}
  if(e.key==='ArrowUp'){tLift=clamp(tLift+10,0,MAX);preview();e.preventDefault();}
  else if(e.key==='ArrowDown'){tLift=clamp(tLift-10,0,MAX);preview();e.preventDefault();}
  else if(e.key==='Enter'||e.key===' '){finish();e.preventDefault();}
});
render();setHandle('locked');

return{el:handle,unlock,reset:lock};
})();

/* ---------- Drill: the sequence controller ---------- */
const Drill=(function(){
const $=id=>document.getElementById(id);
const steps=[0,1,2,3].map(i=>$('step'+i));
const pills=[...document.querySelectorAll('.progress li')];
const clockEl=$('clock'),announce=$('announce');
const pitbox=$('pitbox'),startBtn=$('start'),state0=$('state0');
const result=$('result'),againBtn=$('again');
const studies={1:Fit,2:Drop,3:Send};
const NAMES={1:'Fit the wheel',2:'Drop the jack',3:'Send the car'};
const BEST_KEY='pitstop-drill-best';
let current=0,t0=0,running=false,tick=null,marks={},timers=[];

function setStatus(i,s){steps[i].dataset.status=s;pills[i].dataset.status=s;}
function later(fn,ms){timers.push(setTimeout(fn,reduceMotion?Math.min(ms,30):ms));}
function say(msg){announce.textContent=msg;}
function bring(el,focusEl){
  el.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'});
  if(focusEl)focusEl.focus({preventScroll:true});
}
function readBest(){try{const v=parseFloat(localStorage.getItem(BEST_KEY));return isFinite(v)?v:null;}catch(e){return null;}}
function writeBest(ms){try{localStorage.setItem(BEST_KEY,String(ms));}catch(e){}}

/* Start: the car rolls in and is raised on the jack; then the tire becomes available. */
startBtn.addEventListener('click',()=>{
  if(current!==0)return;
  startBtn.hidden=true;
  state0.textContent='Car coming in...';
  pitbox.dataset.phase='arriving';
  later(()=>{
    pitbox.dataset.phase='up';
    state0.textContent='Car up on the jack. Old wheel off.';
  },1000);
  later(()=>complete(0),1500);
});

function firstTouch(){
  if(running||current!==1)return;
  running=true;t0=performance.now();marks={};
  clearInterval(tick);
  tick=setInterval(()=>{clockEl.textContent=fmt(performance.now()-t0);},50);
}
function stopClock(){
  if(!running)return;
  running=false;clearInterval(tick);
  marks[3]=performance.now()-t0;clockEl.textContent=fmt(marks[3]);
}
function complete(i){
  if(i!==current)return;
  setStatus(i,'done');
  if(i>0&&i<3)marks[i]=performance.now()-t0;
  if(i===2){pitbox.dataset.phase='down';state0.textContent='Car down on four wheels.';}
  if(i===3){pitbox.dataset.phase='gone';state0.textContent='Car gone. Pit box clear.';}
  if(i<3){
    current=i+1;setStatus(current,'active');
    const s=studies[current];s.unlock();
    say('Step '+current+' unlocked: '+NAMES[current]+'.');
    if(current===1)Fit.layout();
    later(()=>bring(steps[current],s.el),i===0?0:450);
  }else{
    current=4;
    later(showResult,650);
  }
}
function showResult(){
  const total=marks[3];
  $('rTotal').textContent=(total/1000).toFixed(2);
  $('rFit').textContent=fmt(marks[1]);
  $('rDrop').textContent=fmt(marks[2]-marks[1]);
  $('rSend').textContent=fmt(marks[3]-marks[2]);
  const prev=readBest();
  const isBest=prev===null||total<prev;
  if(isBest)writeBest(total);
  $('rBest').textContent=fmt(isBest?total:prev);
  $('rBadge').hidden=!isBest;
  result.hidden=false;
  say('Drill complete in '+fmt(total)+(isBest?'. New best.':'.'));
  bring(result,againBtn);
}

/* Run it again: back to the starting state, car out of the pit box. */
againBtn.addEventListener('click',()=>{
  timers.forEach(clearTimeout);timers=[];
  clearInterval(tick);running=false;marks={};
  clockEl.textContent=fmt(0);
  Fit.reset();Drop.reset();Send.reset();
  result.hidden=true;
  [1,2,3].forEach(i=>setStatus(i,'locked'));
  setStatus(0,'active');current=0;
  pitbox.dataset.phase='empty';
  state0.textContent='Pit box empty. Waiting for the car.';
  startBtn.hidden=false;
  say('Drill reset.');
  bring(steps[0],startBtn);
  window.scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'});
});

return{complete,firstTouch,stopClock};
})();
