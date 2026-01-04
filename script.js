import * as THREE from 'three';

// --- KHAI BÁO BIẾN ĐẾM ---
let fireworkCount = 0;
const goalCount = 10; // Bắn 10 phát sẽ hiện chữ

// --- SETUP SCENE ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 20;

const fireworks = [];

// --- HÀM TẠO PHÁO HOA ---
function createFirework(x, y, z) {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        velocities.push(new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 0.2, color: new THREE.Color(Math.random(), Math.random(), Math.random()) });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    fireworks.push({ points, velocities, startTime: Date.now(), lifeTime: 2000 });

    // TĂNG BỘ ĐẾM
    fireworkCount++;
    if (fireworkCount >= goalCount) {
        showNewYearMessage();
    }
}

function showNewYearMessage() {
    const text = document.getElementById('newYearText');
    if (text) text.classList.add('visible');
}

// --- NHẬN DIỆN TAY ---
const hands = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({ maxNumHands: 1, minDetectionConfidence: 0.7 });

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const point = results.multiHandLandmarks[0][8];
        const x = (point.x - 0.5) * -30;
        const y = (0.5 - point.y) * 20;
        if (Math.random() > 0.9) createFirework(x, y, 0);
    }
});

const video = document.createElement('video');
const cam = new window.Camera(video, {
    onFrame: async () => { await hands.send({ image: video }); }
});

// --- ĐIỀU KHIỂN ---
document.getElementById('startButton').onclick = () => {
    document.getElementById('bgMusic').play().catch(() => {});
    cam.start();
    document.getElementById('startButton').style.display = 'none';
};

// --- VÒNG LẶP ANIMATION ---
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
                pos[j * 3] += fw.velocities[j].x;
                pos[j * 3 + 1] += fw.velocities[j].y;
                pos[j * 3 + 2] += fw.velocities[j].z;
                fw.velocities[j].y -= 0.001; // Trọng lực
            }
            fw.points.geometry.attributes.position.needsUpdate = true;
        }
    }
    renderer.render(scene, camera);
}

animate();
