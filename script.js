const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

/* ========= STATE ========= */
let fireworks = [];
let fireworkCount = 0;
const MAX_FIREWORKS = 20;

let lastGestureTime = Date.now();
let lastFireworkTime = 0;
let textShown = false;
let cameraStarted = false;

/* ========= CAMERA ========= */
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream)
  .catch(err => console.error('Camera error:', err));

/* ========= FIREWORK ========= */
class Firework {
  constructor(x, y) {
    this.life = 160;
    this.particles = [];

    for (let i = 0; i < 120; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.5) * 9,
        a: 1,
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255
      });
    }
  }

  update() {
    this.life--;
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.a -= 0.006;
    });
  }

  draw() {
    this.particles.forEach(p => {
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a})`;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
  }
}

/* ========= MEDIAPIPE ========= */
const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(res => {
  if (!res.multiHandLandmarks) return;

  const now = Date.now();
  if (now - lastFireworkTime < 300) return; // 🔒 CHỐNG LAG

  const tip = res.multiHandLandmarks[0][8];
  fireworks.push(new Firework(
    tip.x * canvas.width,
    tip.y * canvas.height
  ));

  fireworkCount++;
  lastGestureTime = now;
  lastFireworkTime = now;
});

/* ========= START ========= */
document.getElementById('startButton').onclick = () => {
  if (cameraStarted) return;

  const cam = new Camera(video, {
    onFrame: async () => {
      if (video.readyState >= 2) {
        await hands.send({ image: video });
      }
    },
    width: 640,
    height: 480
  });

  cam.start();
  cameraStarted = true;
  document.getElementById('startButton').style.display = 'none';
  animate();
};

/* ========= ANIMATE ========= */
function animate() {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  fireworks.forEach(f => {
    f.update();
    f.draw();
  });

  fireworks = fireworks.filter(f => f.life > 0);

  /* 🎉 HIỆN CHỮ CHẮC CHẮN */
  if (
    !textShown &&
    fireworkCount >= MAX_FIREWORKS &&
    Date.now() - lastGestureTime > 3000
  ) {
    document.getElementById('happyNewYear').className = 'visible';
    textShown = true;
  }

  requestAnimationFrame(animate);
}

/* ========= RESIZE ========= */
window.addEventListener('resize', () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});
