/* ========= Elements ========= */
const surpriseBtn = document.getElementById('surprise-btn');
const saitama = document.getElementById('saitama');
const punchArm = document.getElementById('punch-arm');
const impact = document.getElementById('impact');
const cake = document.getElementById('cake');
const finalMsg = document.getElementById('final-msg');
const titleStatic = document.getElementById('title-static');
const confettiCanvas = document.getElementById('confetti');
const ctx = confettiCanvas.getContext('2d');

/* ======= Canvas size ======= */
function resizeCanvas(){
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ========= CONFETTI ========= */
let confettis = [];
function random(min,max){return Math.random()*(max-min)+min}
function randInt(min,max){return Math.floor(random(min,max+1))}

function createConfettiBurst(count=120){
  for(let i=0;i<count;i++){
    confettis.push({
      x: random(0, confettiCanvas.width),
      y: random(-confettiCanvas.height*0.2, 0),
      size: random(6,12),
      gravity: random(0.6,1.6),
      vy: random(1,4),
      vx: random(-3,3),
      rot: random(0,360),
      vr: random(-8,8),
      color: ['#FF5F5F', '#FFBE0B', '#3A86FF', '#8338EC', '#FF006E', '#FB5607'][randInt(0,5)]
    });
  }
  runConfetti();
}

let confettiRunning = false;
function runConfetti(){
  if(confettiRunning) return;
  confettiRunning = true;
  const loop = ()=>{
    ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    for(let i=confettis.length-1;i>=0;i--){
      const p = confettis[i];
      p.vy += p.gravity*0.02;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI/180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
      ctx.restore();
      if(p.y > confettiCanvas.height + 50) confettis.splice(i,1);
    }
    if(confettis.length>0) requestAnimationFrame(loop);
    else confettiRunning = false;
  };
  requestAnimationFrame(loop);
}

/* ========= WEB AUDIO - Impact Sound (synthesized) ========= */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playPunchSound(){
  const now = audioCtx.currentTime;

  // low thud using oscillator + noise burst for "impact"
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

  // noise (short) for punch texture
  const bufferSize = audioCtx.sampleRate * 0.2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++){
    data[i] = (Math.random()*2-1) * (1 - i/bufferSize);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 800;

  // filter + gain envelope
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  const master = audioCtx.createGain();
  master.gain.value = 0.9;

  // combine
  osc.connect(gain);
  noise.connect(noiseFilter);
  noiseFilter.connect(gain);
  gain.connect(master);
  master.connect(audioCtx.destination);

  osc.start(now);
  noise.start(now);
  osc.stop(now + 0.4);
  noise.stop(now + 0.06);
}

/* ========= Animation sequence ========= */
let locked = false;
surpriseBtn.addEventListener('click', async () => {
  if(locked) return;
  locked = true;

  // if audio context is suspended (autoplay policies), resume on user gesture
  if(audioCtx.state === 'suspended') await audioCtx.resume();

  // small UI feedback
  surpriseBtn.disabled = true;
  surpriseBtn.style.transform = 'scale(0.98)';

  // 1) Arm punch animation
  punchArm.classList.add('arm-punch');
  saitama.classList.add('punch-saitama');

  // 2) play sound
  playPunchSound();

  // 3) show impact wave
  impact.classList.remove('impact-pop');
  // force reflow to restart animation
  void impact.offsetWidth;
  impact.classList.add('impact-pop');

  // short delay to sync cake reveal
  setTimeout(() => {
    // reveal cake and message
    cake.classList.remove('hidden');
    cake.classList.add('visible');
    cake.style.opacity = '1';
    cake.style.transform = 'translateX(-50%) scale(1)';
    finalMsg.classList.remove('hidden');
    finalMsg.classList.add('visible');

    // change static title to final (fade)
    titleStatic.textContent = '';

    // Confetti burst
    createConfettiBurst(160);
  }, 330);

  // cleanup animations
  setTimeout(() => {
    punchArm.classList.remove('arm-punch');
    saitama.classList.remove('punch-saitama');
    surpriseBtn.style.transform = '';
    surpriseBtn.disabled = false;
    locked = false;
  }, 900);
});

/* ========= Initial states: cake and final message hidden, prepare transitions ========= */
cake.classList.add('hidden');
finalMsg.classList.add('hidden');

/* Small entrance animation for Saitama when page loads */
window.addEventListener('load', () => {
  saitama.style.transform = 'translateY(6px)';
  setTimeout(()=>{ saitama.style.transition = 'transform 450ms cubic-bezier(.2,.9,.2,1)'; saitama.style.transform = 'translateY(0)'; }, 120);
});

/* make cake and final message visible style adjustments when not hidden */
const obs = new MutationObserver(() => {
  if(!cake.classList.contains('hidden')) {
    cake.style.opacity = '1';
    cake.style.transform = 'translateX(-50%) scale(1)';
  }
  if(!finalMsg.classList.contains('hidden')){
    finalMsg.style.opacity = '1';
    finalMsg.style.transform = 'translateX(-50%) translateY(0) scale(1)';
  }
});
obs.observe(cake, { attributes: true, attributeFilter: ['class'] });
obs.observe(finalMsg, { attributes: true, attributeFilter: ['class'] });

/* Optional: allow pressing Enter/Space to trigger button for accessibility */
document.addEventListener('keydown', (e) => {
  if(e.code === 'Space' || e.code === 'Enter'){
    e.preventDefault();
    surpriseBtn.click();
  }
});
