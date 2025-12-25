const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

let blinkSpeed = 500;
let scale = 1;
let lightsOn = true;
let lastBlink = Date.now();

function drawTree(cx, by, s, lights) {
  const h = 220 * s;
  const w = 140 * s;

  ctx.fillStyle = "#0a7a28";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, by - h + i * 70);
    ctx.lineTo(cx - w + i * 30, by - i * 70);
    ctx.lineTo(cx + w - i * 30, by - i * 70);
    ctx.closePath();
    ctx.fill();
  }

  // thân cây
  ctx.fillStyle = "#6b3e26";
  ctx.fillRect(cx - 15 * s, by, 30 * s, 40 * s);

  // đèn
  if (lights) {
    for (let i = 0; i < 25; i++) {
      ctx.fillStyle = ["red", "yellow", "cyan", "magenta"][Math.floor(Math.random() * 4)];
      ctx.beginPath();
      ctx.arc(
        cx + (Math.random() - 0.5) * w * 1.4,
        by - Math.random() * h,
        4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

function countFingers(landmarks) {
  const tips = [8, 12, 16, 20];
  let open = 0;
  tips.forEach(tip => {
    if (landmarks[tip].y < landmarks[tip - 2].y) open++;
  });
  return open;
}

const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(results => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks) {
    results.multiHandLandmarks.forEach(hand => {
      const fingers = countFingers(hand);

      blinkSpeed = fingers >= 4 ? 200 : 800;
      scale = Math.min(1.5, Math.max(0.6, 1.4 - hand[0].y));
    });
  }

  if (Date.now() - lastBlink > blinkSpeed) {
    lightsOn = !lightsOn;
    lastBlink = Date.now();
  }

  drawTree(canvas.width / 2, canvas.height - 80, scale, lightsOn);
});

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

camera.start();
