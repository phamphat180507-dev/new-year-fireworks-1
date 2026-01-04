// ================= SETUP =================
import * as THREE from 'three';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 10;

// ================= FIREWORK DATA =================
const fireworks = [];
let fireworkCounter = 0;
const MAX_FIREWORKS = 10;
let hasShownNewYearText = false;

// ================= CREATE FIREWORK =================
function createFirework(x, y, z) {
  const count = 100;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    velocities.push({
      x: (Math.random() - 0.5) * 2,
      y: Math.random() * 2,
      z: (Math.random() - 0.5) * 2,
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: Math.random() * 0xffffff,
    size: 0.1,
    transparent: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  fireworks.push({
    points,
    velocities,
    startTime: Date.now(),
    lifeTime: 2000,
  });

  fireworkCounter++;
}

// ================= SHOW TEXT =================
function showHappyNewYear() {
  if (hasShownNewYearText) return;
  const text = document.getElementById('happyNewYear');
  text.classList.remove('hidden');
  text.classList.add('visible');
  hasShownNewYearText = true;
}

// ================= ANIMATE =================
function animate() {
  requestAnimationFrame(animate);

  const now = Date.now();

  for (let i = fireworks.length - 1; i >= 0; i--) {
    const fw = fireworks[i];
    const pos = fw.points.geometry.attributes.position.array;

    if (now - fw.startTime > fw.lifeTime) {
      scene.remove(fw.points);
      fireworks.splice(i, 1);
    } else {
      for (let j = 0; j < pos.length / 3; j++) {
        pos[j * 3] += fw.velocities[j].x * 0.05;
        pos[j * 3 + 1] += fw.velocities[j].y * 0.05;
        pos[j * 3 + 2] += fw.velocities[j].z * 0.05;
        fw.velocities[j].y -= 0.02;
      }
      fw.points.geometry.attributes.position.needsUpdate = true;
      fw.points.material.opacity =
        1 - (now - fw.startTime) / fw.lifeTime;
    }
  }

  // ✅ ĐIỀU KIỆN HIỆN CHỮ
  if (fireworks.length === 0 && fireworkCounter >= MAX_FIREWORKS) {
    showHappyNewYear();
  }

  renderer.render(scene, camera);
}

// ================= START BUTTON =================
document.getElementById('startButton').addEventListener('click', () => {
  document.getElementById('bgMusic')?.play().catch(() => {});
  animate();

  // bắn thử 10 pháo (thay bằng gesture nếu muốn)
  for (let i = 0; i < MAX_FIREWORKS; i++) {
    setTimeout(() => {
      createFirework(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        0
      );
    }, i * 400);
  }
});

// ================= RESIZE =================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
