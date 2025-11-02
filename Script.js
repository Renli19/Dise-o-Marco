const canvas = document.getElementById("saitamaCanvas");
const ctx = canvas.getContext("2d");
const btn = document.getElementById("surprise-btn");
const msg = document.getElementById("birthday-msg");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight * 0.7;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let punchActive = false;
let frame = 0;

// ---- Dibujar a Saitama ----
function drawSaitama() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2 + 50;
  const scale = Math.min(canvas.width / 600, 1);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Cabeza
  ctx.fillStyle = "#fbd5b0";
  ctx.beginPath();
  ctx.arc(0, -150, 60, 0, Math.PI * 2);
  ctx.fill();

  // Traje
  ctx.fillStyle = "#ffcc00";
  ctx.beginPath();
  ctx.moveTo(-60, -90);
  ctx.lineTo(60, -90);
  ctx.lineTo(70, 80);
  ctx.lineTo(-70, 80);
  ctx.closePath();
  ctx.fill();

  // Capa
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(-70, -90);
  ctx.quadraticCurveTo(0, -40, 70, -90);
  ctx.lineTo(80, 100);
  ctx.lineTo(-80, 100);
  ctx.closePath();
  ctx.fill();

  // Guantes
  ctx.fillStyle = "#f00";
  const handX = punchActive ? 130 : 80;
  ctx.beginPath();
  ctx.arc(handX, -20, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-80, -20, 20, 0, Math.PI * 2);
  ctx.fill();

  // Ojos
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(-20, -160, 5, 0, Math.PI * 2);
  ctx.arc(20, -160, 5, 0, Math.PI * 2);
  ctx.fill();

  // Boca
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-15, -135);
  ctx.lineTo(15, -135);
  ctx.strokeStyle = "#000";
  ctx.stroke();

  // Efecto de onda
  if (punchActive && frame < 15) {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(handX + 10, -20, frame * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Pastel después del golpe
  if (!punchActive && frame > 40) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(-40, -10, 80, 25);
    ctx.fillStyle = "#ff66aa";
    ctx.fillRect(-40, -10, 80, 8);
    ctx.fillStyle = "#ffaa00";
    ctx.fillRect(-5, -25, 10, 15);
  }

  ctx.restore();
}

// ---- Animación continua ----
function loop() {
  frame++;
  drawSaitama();
  drawConfetti();
  requestAnimationFrame(loop);
}
loop();

// ---- Evento botón ----
btn.addEventListener("click", () => {
  if (punchActive) return;
  punchActive = true;
  frame = 0;
  playPunchSound();

  setTimeout(() => {
    punchActive = false;
    msg.classList.remove("hidden");
    startConfetti();
  }, 700);
});

// ---- Sonido del golpe (Web Audio API) ----
function playPunchSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(120, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

// ---- Confeti ----
let confetti = [];
function startConfetti() {
  for (let i = 0; i < 150; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 6 + 4,
      color: `hsl(${Math.random() * 360},100%,60%)`,
      speed: Math.random() * 3 + 2,
    });
  }
}
function drawConfetti() {
  confetti.forEach((c) => {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.size, c.size);
    c.y += c.speed;
    if (c.y > canvas.height) c.y = -10;
  });
}
