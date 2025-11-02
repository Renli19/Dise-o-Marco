// script.js - Canvas Saitama + punch animation + WebAudio + confetti
// Guarda los 3 archivos juntos y abre index.html

/* ---------- Elements ---------- */
const heroCanvas = document.getElementById('hero-canvas');
const confettiCanvas = document.getElementById('confetti-canvas');
const surpriseBtn = document.getElementById('surprise-btn');
const preTitle = document.getElementById('pre-title');
const finalMsg = document.getElementById('final-msg');

const heroCtx = heroCanvas.getContext('2d');
const confettiCtx = confettiCanvas.getContext('2d');

let DPR = Math.max(window.devicePixelRatio || 1, 1);

/* ---------- Sizing & responsive (we frame torso-up) ---------- */
function resizeCanvases(){
  // width base is wrapper's computed width
  const wrap = document.querySelector('.canvas-wrap');
  const displayW = Math.min(860, wrap.clientWidth);
  // we choose a portrait-ish height to show torso-up: height = displayW * 0.82 (adjust)
  const displayH = Math.round(displayW * 0.82);

  // set CSS size
  heroCanvas.style.width = displayW + 'px';
  heroCanvas.style.height = displayH + 'px';
  confettiCanvas.style.width = displayW + 'px';
  confettiCanvas.style.height = displayH + 'px';

  // set real pixel size for sharpness
  heroCanvas.width = Math.round(displayW * DPR);
  heroCanvas.height = Math.round(displayH * DPR);
  confettiCanvas.width = Math.round(displayW * DPR);
  confettiCanvas.height = Math.round(displayH * DPR);

  // scale contexts
  heroCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  confettiCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

  // redraw character in new size
  drawStaticFrame();
}
window.addEventListener('resize', () => {
  DPR = Math.max(window.devicePixelRatio || 1, 1);
  resizeCanvases();
});
resizeCanvases();

/* ---------- Character model (relative coordinates) ---------- */
/*
 We'll draw a stylized but recognizable Saitama:
 - head (circle) with subtle gradient
 - eyes narrow, small mouth (anime)
 - collar, torso yellow, belt, cape back
 - arms (left relaxed, right ready to punch) with glove
 We'll place all in a coordinate system centered horizontally.
 Dimensions scale with canvas width.
*/
function drawSaitamaBase(ctx, w, h, state){
  // state: { armProgress:0..1, recoil:0..1, showCake:bool, impactScale:0..}
  ctx.clearRect(0,0,w,h);

  // scaled measurements
  const cx = w/2;
  const top = h * 0.06; // top margin
  const scale = w / 420; // design reference width 420
  const headR = 70 * scale;
  const headX = cx;
  const headY = top + headR;

  // Draw cape (behind)
  const capeW = 260 * scale;
  const capeH = 200 * scale;
  ctx.save();
  ctx.translate(headX, headY + 40*scale);
  ctx.beginPath();
  ctx.ellipse(0, capeH*0.08, capeW*0.6, capeH, 0, 0, Math.PI*2);
  const capeGrad = ctx.createLinearGradient(-capeW/2, -capeH, capeW/2, capeH);
  capeGrad.addColorStop(0, '#ffd9d9');
  capeGrad.addColorStop(1, '#f0cfcf');
  ctx.fillStyle = capeGrad;
  ctx.fill();
  ctx.restore();

  // Torso
  const torsoW = 220 * scale;
  const torsoH = 130 * scale;
  const torsoX = cx - torsoW/2;
  const torsoY = headY + headR*0.6;
  const torsoGrad = ctx.createLinearGradient(torsoX, torsoY, torsoX+torsoW, torsoY+torsoH);
  torsoGrad.addColorStop(0, '#f6d34d');
  torsoGrad.addColorStop(1, '#e6c83a');
  roundRect(ctx, torsoX, torsoY, torsoW, torsoH, 14*scale);
  ctx.fillStyle = torsoGrad;
  ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 10 * scale;
  ctx.shadowOffsetY = 6 * scale;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Belt
  ctx.fillStyle = '#b53c2c';
  roundRect(ctx, torsoX + 14*scale, torsoY + torsoH*0.38, torsoW - 28*scale, 28*scale, 8*scale);
  ctx.fillStyle = '#d83b3b';
  roundRect(ctx, torsoX + torsoW/2 - 28*scale, torsoY + torsoH*0.38 + 6*scale, 56*scale, 18*scale, 6*scale);
  ctx.fill();

  // Collar
  ctx.fillStyle = '#fff';
  roundRect(ctx, headX - 62*scale, torsoY - 12*scale, 124*scale, 34*scale, 18*scale);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(headX - 62*scale, torsoY - 4*scale, 124*scale, 6*scale);

  // Arms - left relaxed
  const armW = 38*scale;
  const armH = 110*scale;
  const leftArmX = torsoX - 16*scale;
  const leftArmY = torsoY + 18*scale;
  drawArm(ctx, leftArmX, leftArmY, armW, armH, 10*scale, false);

  // Right arm - animated punch
  const rightArmX = torsoX + torsoW - (armW - 16*scale);
  const rightArmY = torsoY + 18*scale;
  // armProgress 0..1 pushes the glove forward
  const ap = state.armProgress || 0;
  drawArm(ctx, rightArmX, rightArmY, armW, armH, 10*scale, true, ap, scale);

  // Head (front)
  // head shadow
  ctx.beginPath();
  ctx.arc(headX, headY, headR + 2*scale, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fill();

  // head circle
  const headGrad = ctx.createLinearGradient(headX - headR, headY - headR, headX + headR, headY + headR);
  headGrad.addColorStop(0, '#fff1e0');
  headGrad.addColorStop(1, '#ffd9bd');
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI*2);
  ctx.fillStyle = headGrad;
  ctx.fill();
  ctx.lineWidth = 3*scale;
  ctx.strokeStyle = '#f2d2b9';
  ctx.stroke();

  // Eyes (anime narrow)
  ctx.fillStyle = '#221f1f';
  const eyeW = 20*scale, eyeH = 6*scale;
  ctx.fillRect(headX - 36*scale, headY + 8*scale, eyeW, eyeH); // left
  ctx.fillRect(headX + 16*scale, headY + 8*scale, eyeW, eyeH); // right

  // Mouth
  ctx.fillStyle = '#2d1f1f';
  ctx.fillRect(headX - 22*scale, headY + 36*scale, 44*scale, 8*scale);

  // subtle blush/shading
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  ctx.beginPath();
  ctx.ellipse(headX - 30*scale, headY + 24*scale, 10*scale, 6*scale, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headX + 30*scale, headY + 24*scale, 10*scale, 6*scale, 0, 0, Math.PI*2);
  ctx.fill();

  // If impact happening, draw a white flash near right side
  if(state.impactScale && state.impactScale > 0){
    const s = state.impactScale;
    const ix = headX + 110*scale;
    const iy = headY + 20*scale;
    const grad = ctx.createRadialGradient(ix, iy, 2*scale, ix, iy, 140*scale*s);
    grad.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - s)})`);
    grad.addColorStop(0.3, `rgba(255,255,255,${0.6 * (1 - s)})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ix, iy, 140*scale*s, 0, Math.PI*2);
    ctx.fill();
  }

  // If cake should show, draw a cake that pops in right side
  if(state.showCake){
    drawCake(ctx, headX + 138*scale, torsoY + torsoH*0.18, scale, state.cakePop || 1);
  }
}

/* --------- Helpers for shapes ---------- */
function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* draw one arm; if isRight and progress > 0, extend glove */
function drawArm(ctx, x, y, w, h, radius, isRight=false, progress=0, scale=1){
  ctx.save();
  ctx.translate(x + w/2, y);
  // if right arm and progress, translate forward and rotate slightly
  if(isRight){
    const rot = (progress > 0) ? (Math.min(progress,1) * -0.35) : -0.17; // radians
    const tx = (progress > 0) ? (progress * 86 * scale) : 0;
    ctx.rotate(rot);
    ctx.translate(tx, 0);
  }

  // arm sleeve
  ctx.fillStyle = '#e9c541';
  roundRect(ctx, -w/2, 0, w, h, radius);
  ctx.fill();

  // glove at bottom
  ctx.save();
  ctx.translate(0, h - 6*scale);
  const gloveW = 64 * (scale);
  const gloveH = 48 * (scale);
  ctx.beginPath();
  ctx.ellipse(0, 0, gloveW/2, gloveH/2, 0, 0, Math.PI*2);
  ctx.fillStyle = '#b82f2f';
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/* cake drawing - simple layered cake */
function drawCake(ctx, x, y, scale, pop){
  // pop: 0..1 grows to 1
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pop, pop);
  // cake body
  ctx.fillStyle = '#f3c7d6';
  roundRect(ctx, -70*scale, -20*scale, 140*scale, 80*scale, 10*scale);
  ctx.fill();
  // icing
  ctx.fillStyle = '#fff';
  roundRect(ctx, -70*scale, -34*scale, 140*scale, 34*scale, 8*scale);
  ctx.fill();
  // candles
  for(let i= -1; i<=1; i++){
    ctx.fillStyle = '#ffd77a';
    ctx.fillRect(i*24*scale - 4*scale, -48*scale, 8*scale, 24*scale);
    // flame
    const fx = i*24*scale;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,200,80,1)';
    ctx.ellipse(fx, -56*scale, 5*scale, 8*scale, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

/* ---------- Static draw helper ---------- */
let currentState = {
  armProgress:0,
  impactScale:0,
  showCake:false,
  cakePop:0
};

function drawStaticFrame(){
  const cw = heroCanvas.width / DPR;
  const ch = heroCanvas.height / DPR;
  drawSaitamaBase(heroCtx, cw, ch, currentState);
}

/* initial draw */
drawStaticFrame();

/* ---------- Animation sequence logic ---------- */
let busy = false;
let lastTime = 0;

function animatePunchSequence(){
  if(busy) return;
  busy = true;

  // Timeline:
  // 0 - 120ms : wind-up minor (arm moves back)
  // 120 - 320ms : punch forward (armProgress 0->1)
  // 180ms : play sound and show impact ripple
  // 340ms : reveal cake & message (pop animation)
  // 340 - 900ms : confetti burst and settle
  const start = performance.now();

  // start small preload of audio (resume user gesture)
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  function frame(t){
    const dt = t - start;
    // wind-up back (-0.15), then forward to 1
    if(dt < 120){
      const p = easeOutCubic(dt/120);
      currentState.armProgress = -0.12 * (1 - p); // slight back
      currentState.impactScale = 0;
    } else if(dt < 320){
      const p = easeOutCubic((dt - 120) / 200);
      currentState.armProgress = p * 1.0; // forward
      // trigger sound/impact when around 180ms (early in forward)
      if(!playedSound && dt >= 180){
        playedSound = true;
        playPunchSound();
        // visual impact impulse
        startImpactPulse();
      }
    } else {
      currentState.armProgress = 0;
    }

    // draw hero with current state
    drawStaticFrame();

    // cake/pop reveal after punch
    if(dt > 320 && !cakeShown){
      cakeShown = true;
      // animate cake pop (0 -> 1)
      animateCakePop();
      // show final message
      finalMsg.classList.add('visible');
      preTitle.textContent = '';
      // confetti burst
      createConfettiBurst(160);
    }

    // continue animation for 1100ms total then stop
    if(dt < 1100){
      requestAnimationFrame(frame);
    } else {
      busy = false;
      playedSound = false;
    }
  }

  // start
  playedSound = false;
  cakeShown = false;
  requestAnimationFrame(frame);
}

/* ---------- Impact pulse effect ---------- */
let impactPulse = { active:false, start:0, duration:420 };
function startImpactPulse(){
  impactPulse.active = true;
  impactPulse.start = performance.now();
  // small flash drawing by controlling currentState.impactScale
  function ipFrame(t){
    const elapsed = t - impactPulse.start;
    const s = Math.min(1, elapsed / impactPulse.duration);
    // ease: pop then fade
    currentState.impactScale = Math.sin(s * Math.PI);
    drawStaticFrame();
    if(elapsed < impactPulse.duration){
      requestAnimationFrame(ipFrame);
    } else {
      impactPulse.active = false;
      currentState.impactScale = 0;
      drawStaticFrame();
    }
  }
  requestAnimationFrame(ipFrame);
}

/* ---------- Cake pop animation ---------- */
function animateCakePop(){
  const dur = 420;
  const start = performance.now();
  currentState.showCake = true;
  function cp(t){
    const p = Math.min(1, (t - start) / dur);
    // pop easing
    currentState.cakePop = easeOutBack(p);
    drawStaticFrame();
    if(p < 1) requestAnimationFrame(cp);
  }
  requestAnimationFrame(cp);
}

/* easing helpers */
function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }
function easeOutBack(x){ const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

/* ---------- Web Audio - synthesized punch ---------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playPunchSound(){
  const now = audioCtx.currentTime;

  // main oscillator (thud)
  const osc = audioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.16);

  // gain envelope
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(1.0, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  // short noise burst for texture
  const bufferSize = audioCtx.sampleRate * 0.06;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++){
    data[i] = (Math.random()*2 - 1) * (1 - i / bufferSize);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 900;

  // master chain
  const master = audioCtx.createGain();
  master.gain.value = 0.9;

  osc.connect(g);
  noise.connect(noiseFilter);
  noiseFilter.connect(g);
  g.connect(master);
  master.connect(audioCtx.destination);

  osc.start(now);
  noise.start(now);
  osc.stop(now + 0.42);
  noise.stop(now + 0.06);
}

/* ---------- CONFETTI (canvas) ---------- */
let confettis = [];
function createConfettiBurst(n=120){
  const W = confettiCanvas.width / DPR;
  const H = confettiCanvas.height / DPR;
  for(let i=0;i<n;i++){
    confettis.push({
      x: Math.random() * W,
      y: Math.random() * -H * 0.2,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 10 + 6,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 10,
      color: ['#FF5F5F', '#FFBE0B', '#3A86FF', '#8338EC', '#FF006E', '#FB5607'][Math.floor(Math.random() * 6)]
    });
  }
  if(!confettiLoopRunning) confettiLoop();
}

let confettiLoopRunning = false;
function confettiLoop(){
  confettiLoopRunning = true;
  const W = confettiCanvas.width / DPR;
  const H = confettiCanvas.height / DPR;
  confettiCtx.clearRect(0,0,W,H);

  for(let i=confettis.length - 1; i>=0; i--){
    const p = confettis[i];
    p.vy += 0.06;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot * Math.PI / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
    confettiCtx.restore();
    if(p.y > H + 100) confettis.splice(i,1);
  }

  if(confettis.length > 0){
    requestAnimationFrame(confettiLoop);
  } else {
    confettiLoopRunning = false;
    confettiCtx.clearRect(0,0,confettiCanvas.width / DPR, confettiCanvas.height / DPR);
  }
}

/* ---------- Button wiring & accessibility ---------- */
let playedSound = false;
surpriseBtn.addEventListener('click', async () => {
  // resume audio context per autoplay policy
  if(audioCtx.state === 'suspended') await audioCtx.resume();
  // simple debounce
  if(busy) return;
  surpriseBtn.disabled = true;
  surpriseBtn.style.transform = 'scale(0.98)';

  // run sequence
  animatePunchSequence();

  // re-enable after sequence
  setTimeout(()=>{ surpriseBtn.disabled = false; surpriseBtn.style.transform = ''; }, 1200);
});

/* Allow keyboard activation */
document.addEventListener('keydown', (e) => {
  if(e.code === 'Enter' || e.code === 'Space'){ e.preventDefault(); surpriseBtn.click(); }
});

/* ---------- Initial small entrance + draw ---------- */
(function intro(){
  currentState.armProgress = 0;
  currentState.impactScale = 0;
  currentState.showCake = false;
  currentState.cakePop = 0;
  drawStaticFrame();
})();

/* ---------- End of file ---------- */
