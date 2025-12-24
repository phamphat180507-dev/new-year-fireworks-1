import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.set(0, 3, 8);

// Tạo cây thông & Ngôi sao
const tree = new THREE.Group();
const greenMat = new THREE.MeshStandardMaterial({ color: 0x064e3b });
for(let i=0; i<4; i++) {
    const layer = new THREE.Mesh(new THREE.ConeGeometry(2-i*0.4, 1.5, 32), greenMat);
    layer.position.y = i * 0.9;
    tree.add(layer);
}
scene.add(tree);

const star = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
star.position.y = 3.6;
scene.add(star);

const particles = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 0.05, color: 0xffffff }));
const posArray = new Float32Array(1500 * 3);
for(let i=0; i<4500; i++) posArray[i] = (Math.random() - 0.5) * 20;
particles.geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
scene.add(particles, new THREE.AmbientLight(0xffffff, 0.5));

// Nhận diện tay (MediaPipe)
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 1, minDetectionConfidence: 0.7 });
hands.onResults((res) => {
    if (res.multiHandLandmarks?.[0]) {
        const finger = res.multiHandLandmarks[0][8];
        particles.material.color.setRGB(finger.x, 1-finger.y, 0.5);
        // Chạm ngôi sao
        if (finger.y < 0.3 && finger.x > 0.4 && finger.x < 0.6) {
            star.scale.set(2, 2, 2); star.material.color.setHex(0xffffff);
        } else {
            star.scale.set(1, 1, 1); star.material.color.setHex(0xffff00);
        }
    }
});

const cam = new Camera(document.createElement('video'), { onFrame: async () => await hands.send({image: cam.video}), width: 640, height: 480 });

document.getElementById('playButton').onclick = () => {
    const audio = document.getElementById('bgMusic');
    
    // Cố gắng phát nhạc, nếu lỗi thì chỉ in ra log chứ không dừng cả chương trình
    audio.play().catch(e => console.log("Nhạc bị chặn, nhưng phép màu vẫn tiếp tục!"));

    // Luôn luôn khởi chạy Camera và Animation
    if (typeof cam !== 'undefined') cam.start();
    
    document.getElementById('playButton').style.display = 'none';
    
    // Đảm bảo vòng lặp animate đã chạy
    animate(); 
};
function animate() {
    requestAnimationFrame(animate);
    tree.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();


