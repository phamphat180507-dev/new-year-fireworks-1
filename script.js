import * as THREE from 'three';

let fireworkCount = 0;
const goalCount = 10; 
const fireworks = [];

// 1. Khởi tạo Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 30; // Đưa camera ra xa một chút để dễ thấy pháo hoa

// 2. Hàm tạo pháo hoa
function createFirework(x, y) {
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = 0;
        velocities.push(new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 0.3, color: new THREE.Color(Math.random(), Math.random(), Math.random()), transparent: true });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    fireworks.push({ points, velocities, startTime: Date.now(), lifeTime: 2000 });

    fireworkCount++;
    if (fireworkCount >= goalCount) {
        const text = document.getElementById('newYearText');
        if (text) text.classList.add('visible');
    }
}

// 3. Nhận diện tay (MediaPipe) - Tối ưu tọa độ
const hands = new window.Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 1, minDetectionConfidence: 0.6 }); // Hạ thấp tự tin xuống 0.6 để nhạy hơn

hands.onResults((res) => {
    if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
        const point = res.multiHandLandmarks[0][8]; // Đầu ngón trỏ
        
        // Chuyển đổi tọa độ khớp với màn hình Three.js
        const x = (point.x - 0.5) * -50; 
        const y = (0.5 - point.y) * 40;

        // Vẫy tay là bắn (Tăng tần suất xuất hiện)
        if (Math.random() > 0.7) createFirework(x, y);
    }
});

// 4. Khởi động Camera & Nút bấm
const video = document.createElement('video');
const cam = new window.Camera(video, {
    onFrame: async () => { await hands.send({ image: video }); },
    width: 1280, height: 720
});

document.getElementById('startButton').onclick = () => {
    document.getElementById('bgMusic').play().catch(() => {});
    cam.start();
    document.getElementById('startButton').style.display = 'none';
};

// 5. Vòng lặp hiển thị
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
                fw.velocities[j].y -= 0.005; // Rơi xuống nhẹ
            }
            fw.points.geometry.attributes.position.needsUpdate = true;
            fw.points.material.opacity -= 0.01; // Mờ dần
        }
    }
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
