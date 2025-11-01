const surpriseBtn = document.getElementById('surprise-btn');
const saitama = document.getElementById('saitama');
const punchSound = document.getElementById('punch-sound');

surpriseBtn.addEventListener('click', () => {
  saitama.classList.add('punch');
  punchSound.currentTime = 0; // Reinicia el sonido si ya se reprodujo
  punchSound.play();
  startConfetti();

  setTimeout(() => {
    saitama.classList.remove('punch');
  }, 500);
});

// 🎊 Confeti
const confettiCanvas = document.getElementById('confetti');
const ctx = confettiCanvas.getContext('2d');
confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;

let confettis = [];

function randomColor() {
  const colors = ['#FF5F5F', '#FFBE0B', '#3A86FF', '#8338EC', '#FF006E', '#FB5607'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createConfetti() {
  const confetti = {
    x: Math.random() * confettiCanvas.width,
    y: 0,
    size: Math.random() * 8 + 4,
    color: randomColor(),
    speed: Math.random() * 3 + 2,
  };
  confettis.push(confetti);
}

function drawConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettis.forEach((c, i) => {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.size, c.size);
    c.y += c.speed;
    if (c.y > confettiCanvas.height) confettis.splice(i, 1);
  });
}

function startConfetti() {
  for (let i = 0; i < 150; i++) createConfetti();
  let duration = 1500;
  let start = Date.now();

  function animate() {
    drawConfetti();
    if (Date.now() - start < duration) {
      requestAnimationFrame(animate);
    }
  }
  animate();
}
