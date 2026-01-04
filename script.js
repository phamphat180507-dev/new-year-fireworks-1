const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

let fireworks = [];
let fireworkCounter = 0;
const MAX_FIREWORKS = 8;
let gestureActive = false;
let shown = false;

/* ========= CAMERA ========= */
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream);

/* ========= FIREWORK ========= */
class Firework {
  constructor(x, y) {
    this.p = [];
    this.life = 80;
    for (let i = 0; i < 60; i++) {
      this.p.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        a: 1
      });
    }
  }
  update() {
    this.life--;
    this.p.forEach(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.05;
      pt.a -= 0.015;
    });
  }
  draw() {
    this.p.forEach(pt => {
      ctx.fillStyle = `rgba(255,200,0,${pt.a})`;
      ctx.fillRect(pt.x, pt.y, 2, 2);
    });
  }
}

/* ========= MEDIAPIPE ========= */
const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(res => {
  if (res.multiHandLandmarks) {
    gestureActive = true;

    const p = res.multiHandLandmarks[0][8]; // ngón trỏ
    fireworks.push(new Firework(
      p.x * canvas.width,
      p.y * canvas.height
    ));
    fireworkCounter++;
  } else {
    gestureActive = false;
  }
});

/* ========= CAMERA LOOP ========= */
const cam = new Camera(video, {
  onFrame: async () => await hands.send({ image: video }),
  width: 640,
  height: 480
});

/* ========= START ========= */
document.getElementById('startButton').onclick = () => {
  cam.start();
  document.getElementById('startButton').style.display = 'none';
  animate();
};

/* ========= ANIMATE ========= */
function animate() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  fireworks.forEach(f => {
    f.update();
    f.draw();
  });

  fireworks = fireworks.filter(f => f.life > 0);

  if (!gestureActive && fireworkCounter >= MAX_FIREWORKS && !shown) {
    document.getElementById('happyNewYear').className = 'visible';
    shown = true;
  }

  requestAnimationFrame(animate);
}
