const canvas = document.getElementById("saitamaCanvas");
const ctx = canvas.getContext("2d");
const btn = document.getElementById("surprise-btn");
const msg = document.getElementById("birthday-msg");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.7;

// Variables del personaje
let punchActive = false;
let frame = 0;

// 🎨 Dibuja Saitama
function drawSaitama() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 + 50;
  const scale = Math.min(canvas.width / 600, 1);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);

  // Cabeza
  ctx.fillStyle = "#fbd5b0";
  ctx.beginPath();
  ctx.arc(0, -150, 60, 0, Math.PI * 2);
  ctx.fill();

  // Cuerpo
  ctx.fillStyle = "#ffcc00";
  ctx.beginPath();
  ctx.moveTo(-60, -90);
  ctx.lineTo(60, -90);
  ctx.lineTo(80, 80);
  ctx.lineTo(-80, 80);
  ctx.closePath();
  ctx.fill();

  // Capa
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-80, -90);
  ctx.quadraticCurveTo(0, -40, 80, -90);
  ctx.lineTo(100, 120);
  ctx.lineTo(-100, 120);
  ctx.closePath();
  ctx.fill();

  // Guantes
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  const handX = punchActive ? 130 : 80;
  ctx.arc(handX, -20, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-80, -20, 20, 0, Math.PI * 2);
  ctx.fill();

  // Cara (ojos)
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(-20, -160, 6, 0, Math.PI * 2);
  ctx.arc(20, -160, 6, 0, Math.PI * 2);
  ctx.fill();

  // Boca seria
  ctx.beginPath();
  ctx.moveTo(-15, -135);
  ctx.lineTo(15, -135);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#000";
  ctx.stroke();

  // Efecto de onda
  if (punchActive && frame < 15) {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(handX + 10, -20, frame * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Pastel (solo después del golpe)
  if (!punchActive && frame > 30) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(-40, -10, 80, 30);
    ctx.fillStyle = "#ff66aa";
    ctx.fillRect(-40, -10, 80, 10);
    ctx.fillStyle = "#ffaa00";
    ctx.fillRect(-5, -25, 10, 15);
  }

  ctx.restore();
}

// ⚙️ Animación
function animate() {
  frame++;
  drawSaitama();
  requestAnimationFrame(animate);
}
animate();

// 🎁 Botón sorpresa
btn.addEventListener("click", () => {
  if (punchActive) return;
  punchActive = true;
  frame = 0;
  playPunchSound();
  setTimeout(() => {
    punchActive = false;
    msg.classList.remove("hidden");
    startConfetti();
  }, 1000);
});

// 🔊 Web Audio API (efecto golpe)
function playPunchSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(80, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}

// 🎊 Confeti
let confetti = [];
function startConfetti() {
  for (let i = 0; i < 100; i++) {
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

setInterval(drawConfetti, 30);
