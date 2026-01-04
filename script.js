const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

/* ====== STATE ====== */
let fireworks = [];
let fireworkCounter = 0;
const MAX_FIREWORKS = 25;
let lastGestureTime = Date.now();
let textShown = false;

/* ====== CAMERA ====== */
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream);

/* ====== FIREWORK ====== */
class Firework {
  constructor(x, y) {
    this.particles = [];
    this.life = 140;

    const colors = ['red','orange','yellow','lime','cyan','blue','magenta','white'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < 120; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        alpha: 1,
        color
      });
    }
  }

  update() {
    this.life--;
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.alpha -= 0.008;
    });
  }

  draw() {
    this.particles.forEach(p => {
      ctx.fillStyle = `rgba(${getRGB(p.color)},${p.alpha})`;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
  }
}

function getRGB(color) {
  const map = {
    red: '255,0,0',
    orange: '255,140,0',
    yellow: '255,255,0',
    lime: '0,255,0',
    cyan: '0,255,255',
    blue: '0,100,255',
    magenta: '255,0,255',
    white: '255,255,255'
  };
  return map[color];
}

/* ====== MEDIAPIPE ====== */
const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(res => {
  if (res.multiHandLandmarks) {
    const p = res.multiHandLandmarks[0][8];

    fireworks.push(new Firework(
      p.x * canvas.width,
      p.y * canvas.height
    ));

    fireworkCounter++;
    lastGestureTime = Date.now();
  }
});

/* ====== CAMERA LOOP ====== */
const cam = new Camera(video, {
  onFrame: async () => await hands.send({ image: video }),
  width: 640,
  height: 480
});

/* ====== START ====== */
document.getElementById('startButton').onclick = () => {
  cam.start();
  document.getElementById('startButton').style.display = 'none';
  animate();
};

/* ====== ANIMATE ====== */
function animate() {
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  fireworks.forEach(f => {
    f.update();
    f.draw();
  });

  fireworks = fireworks.filter(f => f.life > 0);

  /* 🎉 HIỆN CHỮ SAU 3 GIÂY KHÔNG CỬ CHỈ */
  if (
    Date.now() - lastGestureTime > 3000 &&
    fireworkCounter >= MAX_FIREWORKS &&
    !textShown
  ) {
    document.getElementById('happyNewYear').className = 'visible';
    textShown = true;
  }

  requestAnimationFrame(animate);
}
