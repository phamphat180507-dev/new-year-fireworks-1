/* ========= BASIC CANVAS FIREWORK ========= */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const fireworks = [];
const MAX_FIREWORKS = 8;
let fireworkCounter = 0;
let hasShownText = false;

/* ========= FIREWORK CLASS ========= */
class Firework {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    this.life = 100;

    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        alpha: 1
      });
    }
  }

  update() {
    this.life--;
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.alpha -= 0.01;
    });
  }

  draw() {
    this.particles.forEach(p => {
      ctx.fillStyle = `rgba(255,200,0,${p.alpha})`;
      ctx.fillRect(p.x, p.y, 2, 2);
    });
  }
}

/* ========= SHOW TEXT ========= */
function showHappyNewYear() {
  if (hasShownText) return;
  document.getElementById('happyNewYear').className = 'visible';
  hasShownText = true;
}

/* ========= ANIMATE ========= */
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].draw();

    if (fireworks[i].life <= 0) {
      fireworks.splice(i, 1);
    }
  }

  if (fireworks.length === 0 && fireworkCounter >= MAX_FIREWORKS) {
    showHappyNewYear();
  }

  requestAnimationFrame(animate);
}

/* ========= START BUTTON ========= */
document.getElementById('startButton').addEventListener('click', () => {
  document.getElementById('startButton').style.display = 'none';

  for (let i = 0; i < MAX_FIREWORKS; i++) {
    setTimeout(() => {
      fireworks.push(
        new Firework(
          Math.random() * canvas.width,
          Math.random() * canvas.height * 0.6
        )
      );
      fireworkCounter++;
    }, i * 500);
  }

  animate();
});

/* ========= RESIZE ========= */
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
