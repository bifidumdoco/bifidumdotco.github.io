import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
// No background color set here, we use CSS for transparency/gradient
// scene.background = new THREE.Color(0x050510); 

const container = document.getElementById('canvas-container');
const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000); // FOV 35 for cinematic look
camera.position.set(4, 2, 4); // Start position for normalized model

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

const spotLight = new THREE.SpotLight(0x0044cc, 5); // Blue rim light
spotLight.position.set(-5, 0, -5);
spotLight.lookAt(0, 0, 0);
scene.add(spotLight);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;

// --- Load Model ---
const loader = new GLTFLoader();
const loaderUI = document.getElementById('loader');

loader.load(
    'panel saklar jendela 3d.glb',
    (gltf) => {
        const model = gltf.scene;

        // Auto-center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Reset position to center group
        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        // Scale to fit! (Make max dimension 4 units)
        const maxAxis = Math.max(size.x, size.y, size.z);
        const scaleFactor = 4.0 / maxAxis;
        model.scale.multiplyScalar(scaleFactor);

        scene.add(model);

        // Hide loader
        loaderUI.classList.add('hidden');
    },
    (xhr) => { },
    (error) => {
        console.error('An error happened', error);
        loaderUI.innerHTML = '<div style="color:red">ERROR LOADING MODEL</div>';
    }
);

// --- Camera Logic ---
window.setCamera = function (view) {
    controls.autoRotate = false; // Stop rotation when user interacts

    // Positions optimized for Normalized Size (4.0)
    const positions = {
        'side': { x: 5, y: 0.5, z: 0 },
        'top': { x: 0, y: 5, z: 0 },
        'front': { x: 0, y: 0.5, z: 5 },
        'iso': { x: 3.5, y: 2.5, z: 3.5 }
    };

    const target = positions[view] || positions['iso'];

    // Simple tween-like movement (using GSAP would be better but keeping it vanilla-ish)
    // We'll just snap for now or do a smooth interpolation in the animate loop if we had a state machine
    // For simplicity:
    camera.position.set(target.x, target.y, target.z);
    camera.lookAt(0, 0, 0);
    controls.update();

    playSound('select');
};

// --- Audio Logic ---
function playSound(type) {
    const id = type === 'select' ? 'sfx-select' : 'sfx-hover';
    const audio = document.getElementById(id);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio blocked', e));
    }
}

// Add hover sounds to buttons
document.querySelectorAll('button, .menu-item').forEach(el => {
    el.addEventListener('mouseenter', () => playSound('hover'));
});

// --- Window Resize ---
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();
