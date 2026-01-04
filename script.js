import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- SETUP SCENE ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.set(0, 0, 20);

// --- PHÁO HOA ---
const fireworks = [];
let fireworkCounter = 0;
const MAX_FIREWORKS = 15; // Giới hạn số lượng pháo hoa
let hasShownNewYearText = false; // Cờ hiệu để chỉ hiện chữ 1 lần

function createFirework(x, y, z) {
    const particleCount = 100 + Math.floor(Math.random() * 50);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const material = new THREE.PointsMaterial({
        size: 0.5,
        color: color,
        transparent: true,
        blending: THREE.AdditiveBlending, // Hiệu ứng sáng rực
        depthWrite: false
    });

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        velocities.push(velocity);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    fireworks.push({
        points: points,
        velocities: velocities,
        startTime: Date.now(),
        lifeTime: 1500 + Math.random() * 1000 // Tồn tại 1.5 đến 2.5 giây
    });
}

// --- NHẬN DIỆN BÀN TAY (MEDIAPIPE) ---
const videoElement = document.createElement('video');
// Thay thế đoạn khởi tạo hands cũ bằng đoạn này
const hands = new window.Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8
});

let lastHandPosition = new THREE.Vector2();
let gestureDetected = false; // Tránh bắn quá nhiều pháo hoa liên tục

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const hand = results.multiHandLandmarks[0];
        const indexFinger = hand[8]; // Đầu ngón trỏ

        // Chuyển đổi tọa độ MediaPipe (0-1) sang tọa độ Three.js
        // Scale theo kích thước màn hình và vị trí camera
        const targetX = (indexFinger.x - 0.5) * (camera.aspect * 15) * -1; // Đảo ngược X
        const targetY = (indexFinger.y - 0.5) * 15 * -1; // Đảo ngược Y (y MediaPipe từ trên xuống)
        const targetZ = -5; // Cho pháo hoa bay ra phía trước

        // Phát hiện cử chỉ "Bắn": Ví dụ: ngón trỏ di chuyển nhanh hoặc vẫy tay
        const currentHandPosition = new THREE.Vector2(targetX, targetY);
        const distanceMoved = currentHandPosition.distanceTo(lastHandPosition);

        if (distanceMoved > 2 && !gestureDetected) { // Nếu di chuyển đủ nhanh
            if (fireworkCounter < MAX_FIREWORKS) {
                createFirework(targetX, targetY, targetZ);
                fireworkCounter++;
                gestureDetected = true; // Đánh dấu đã bắn, đợi cử chỉ tiếp theo
            }
        } else if (distanceMoved < 0.5) { // Nếu tay đứng yên, reset gesture
            gestureDetected = false;
        }
        lastHandPosition.copy(currentHandPosition);

    } else {
        // Không có tay, reset gesture
        gestureDetected = false;
    }
});

const cameraUtils = new Camera(videoElement, {
    onFrame: async () => { await hands.send({ image: videoElement }); },
    width: 640,
    height: 480
});

// --- HIỆN CHỮ HAPPY NEW YEAR ---
const newYearText = document.getElementById('newYearText');
function showNewYearText() {
    if (!hasShownNewYearText) {
        newYearText.classList.remove('hidden');
        newYearText.classList.add('visible');
        hasShownNewYearText = true;
    }
}

// --- ANIMATION LOOP ---
const startButton = document.getElementById('startButton');
const bgMusic = document.getElementById('bgMusic');

startButton.addEventListener('click', () => {
    bgMusic.play().catch(e => console.error("Could not play music:", e));
    cameraUtils.start();
    startButton.style.display = 'none';
    // Đảm bảo animate chạy sau khi MediaPipe và Camera khởi tạo
    animate();
});

let animationFrameId; // Để quản lý requestAnimationFrame

function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // Cập nhật pháo hoa
    const currentTime = Date.now();
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        const positions = fw.points.geometry.attributes.position.array;

        if (currentTime - fw.startTime > fw.lifeTime) {
            scene.remove(fw.points);
            fireworks.splice(i, 1);
            fireworkCounter--; // Giảm số lượng pháo hoa đang hoạt động
        } else {
            for (let j = 0; j < positions.length / 3; j++) {
                positions[j * 3] += fw.velocities[j].x * 0.05;
                positions[j * 3 + 1] += fw.velocities[j].y * 0.05;
                positions[j * 3 + 2] += fw.velocities[j].z * 0.05;
                fw.velocities[j].y -= 0.01; // Hiệu ứng trọng lực
            }
            fw.points.geometry.attributes.position.needsUpdate = true;
            fw.points.material.opacity = 1 - (currentTime - fw.startTime) / fw.lifeTime;
        }
    }

    // Nếu đã hết pháo hoa và đã bắn đủ số lượng, hiện chữ
    if (fireworks.length === 0 && fireworkCounter >= MAX_FIREWORKS) {
        showNewYearText();
        // Sau khi hiện chữ, có thể dừng animation nếu muốn
        // cancelAnimationFrame(animationFrameId); 
    }
    
    renderer.render(scene, camera);
}

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Chạy animate lần đầu (sẽ bị pause cho đến khi nhấn nút)
// animate(); // Bỏ comment nếu muốn scene chạy liên tục từ đầu

