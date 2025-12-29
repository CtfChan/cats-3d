import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Cat } from './Cat';
import './style.css';

/**
 * Three.js Cat Sound Toy
 *
 * A simple interactive 3D scene with colorful cats that meow when clicked.
 * Demonstrates: Scene setup, lighting, raycasting, audio, and animation.
 */

// ============================================
// SCENE SETUP
// ============================================

// The Scene is the container for all 3D objects, lights, and cameras
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// PerspectiveCamera simulates human eye perspective
// Parameters: FOV (degrees), aspect ratio, near clip, far clip
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

// WebGLRenderer draws the scene to a canvas using WebGL
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true; // Enable shadow rendering
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadow edges

// Append canvas to the DOM
const appElement = document.querySelector<HTMLDivElement>('#app')!;
appElement.appendChild(renderer.domElement);

// ============================================
// CONTROLS
// ============================================

// OrbitControls allow the user to rotate, pan, and zoom the camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent camera going below ground

// ============================================
// LIGHTING
// ============================================

// AmbientLight provides even illumination from all directions
// Without it, shadowed areas would be completely black
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// DirectionalLight simulates sunlight - parallel rays from a direction
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;

// Configure shadow quality
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;

scene.add(directionalLight);

// ============================================
// GROUND PLANE
// ============================================

// Create a ground plane so cats have something to stand on
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x7cba3d, // Grass green
  roughness: 0.8
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
ground.receiveShadow = true;
scene.add(ground);

// ============================================
// AUDIO SETUP
// ============================================

// AudioListener is attached to the camera - it's the "ears" in 3D space
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

// AudioLoader loads audio files asynchronously
const audioLoader = new THREE.AudioLoader();
let meowBuffer: AudioBuffer | null = null;

// Load the meow sound (will fail gracefully if file doesn't exist)
audioLoader.load(
  '/sounds/meow.mp3',
  (buffer) => {
    meowBuffer = buffer;
    console.log('Meow sound loaded successfully!');
    // Recreate cats with audio now that it's loaded
    createCats();
  },
  undefined,
  (error) => {
    console.warn('Could not load meow.mp3 - cats will be silent:', error);
    // Still create cats, just without sound
    createCats();
  }
);

// ============================================
// CAT CREATION
// ============================================

// Array to hold all cat instances for updating
const cats: Cat[] = [];

// Colors for our 5 cats
const catColors = [
  0xff6b6b, // Coral red
  0x4ecdc4, // Teal
  0xffe66d, // Yellow
  0x95e1d3, // Mint
  0xdda0dd  // Plum
];

/**
 * Creates 5 cats with random positions and different colors
 */
function createCats(): void {
  // Clear existing cats
  cats.forEach(cat => scene.remove(cat.mesh));
  cats.length = 0;

  catColors.forEach((color, index) => {
    // Random position within a reasonable area
    // We offset by index to ensure some spread even with same random seed
    const x = (Math.random() - 0.5) * 12 + (index - 2) * 2;
    const z = (Math.random() - 0.5) * 12;
    const y = 0.4; // Slightly above ground (half the cat's height)

    const position = new THREE.Vector3(x, y, z);
    const cat = new Cat(color, position, audioListener, meowBuffer);

    // Random rotation to make them face different directions
    cat.mesh.rotation.y = Math.random() * Math.PI * 2;

    cats.push(cat);
    scene.add(cat.mesh);
  });
}

// ============================================
// RAYCASTING (Click Detection)
// ============================================

// Raycaster casts a ray from camera through mouse position to detect objects
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/**
 * Handle mouse clicks to detect cat interactions
 */
function onMouseClick(event: MouseEvent): void {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Cast ray from camera through mouse position
  raycaster.setFromCamera(mouse, camera);

  // Get all cat meshes for intersection testing
  const catMeshes = cats.map(cat => cat.mesh);
  const intersects = raycaster.intersectObjects(catMeshes, true); // true = check children too

  if (intersects.length > 0) {
    // Find the parent mesh that has our Cat reference
    let clickedMesh = intersects[0].object;
    while (clickedMesh.parent && !clickedMesh.userData.cat) {
      clickedMesh = clickedMesh.parent as THREE.Object3D;
    }

    // Trigger the cat's click behavior
    const cat = clickedMesh.userData.cat as Cat | undefined;
    if (cat) {
      cat.onClick();
    }
  }
}

window.addEventListener('click', onMouseClick);

// ============================================
// WINDOW RESIZE HANDLING
// ============================================

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // Must call after changing camera properties
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

// ============================================
// ANIMATION LOOP
// ============================================

// Clock tracks time for frame-independent animation
const clock = new THREE.Clock();

/**
 * Main render loop - runs every frame (~60fps)
 */
function animate(): void {
  // Request next frame first (ensures smooth animation even if rest takes time)
  requestAnimationFrame(animate);

  // Get time since last frame for smooth animation
  const deltaTime = clock.getDelta();

  // Update all cats (handles bounce animation)
  cats.forEach(cat => cat.update(deltaTime));

  // Update orbit controls (required for damping to work)
  controls.update();

  // Render the scene from the camera's perspective
  renderer.render(scene, camera);
}

// Start the animation loop
animate();

// Add a helpful instruction overlay
const instructions = document.createElement('div');
instructions.style.cssText = `
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  font-family: sans-serif;
  font-size: 14px;
  background: rgba(0,0,0,0.5);
  padding: 10px 15px;
  border-radius: 5px;
  pointer-events: none;
`;
instructions.textContent = 'Click on a cat to make it meow! Drag to orbit, scroll to zoom.';
document.body.appendChild(instructions);
