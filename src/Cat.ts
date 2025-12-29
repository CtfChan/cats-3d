import * as THREE from 'three';

/**
 * Cat class - represents a clickable 3D cat in the scene.
 * Uses simple geometry for now, can be replaced with a proper model later.
 */
export class Cat {
  // The main mesh that represents the cat visually
  mesh: THREE.Mesh;

  // Audio for the meow sound - attached to this specific cat
  private sound: THREE.PositionalAudio | null = null;

  // Animation state
  private isAnimating = false;
  private animationProgress = 0;
  private originalScale: THREE.Vector3;

  constructor(
    color: THREE.ColorRepresentation,
    position: THREE.Vector3,
    audioListener: THREE.AudioListener,
    audioBuffer: AudioBuffer | null
  ) {
    // Create cat body using a simple box geometry
    // BoxGeometry(width, height, depth) creates a rectangular box
    const bodyGeometry = new THREE.BoxGeometry(1, 0.8, 1.5);

    // MeshStandardMaterial responds to lights (unlike MeshBasicMaterial)
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,  // How rough the surface appears (0 = mirror, 1 = diffuse)
      metalness: 0.1   // How metallic the surface appears
    });

    this.mesh = new THREE.Mesh(bodyGeometry, material);
    this.mesh.position.copy(position);

    // Enable shadow casting and receiving for more realistic rendering
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Store reference to this Cat instance on the mesh for raycasting
    // This allows us to get the Cat object when we detect a click on the mesh
    this.mesh.userData.cat = this;

    // Store original scale for animation
    this.originalScale = this.mesh.scale.clone();

    // Add simple "ears" using smaller boxes
    this.addEars(color);

    // Setup positional audio if buffer is available
    // PositionalAudio is 3D audio that changes based on listener position
    if (audioBuffer) {
      this.sound = new THREE.PositionalAudio(audioListener);
      this.sound.setBuffer(audioBuffer);
      this.sound.setRefDistance(5);  // Distance at which volume starts to decrease
      this.sound.setVolume(0.8);
      this.mesh.add(this.sound);  // Attach sound to the mesh so it moves with it
    }
  }

  /**
   * Add ear geometry to make it look more cat-like
   */
  private addEars(color: THREE.ColorRepresentation): void {
    const earGeometry = new THREE.BoxGeometry(0.25, 0.3, 0.25);
    const earMaterial = new THREE.MeshStandardMaterial({ color });

    // Left ear
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.3, 0.5, 0.4);
    leftEar.castShadow = true;
    this.mesh.add(leftEar);

    // Right ear
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.3, 0.5, 0.4);
    rightEar.castShadow = true;
    this.mesh.add(rightEar);
  }

  /**
   * Called when the cat is clicked - plays sound and triggers animation
   */
  onClick(): void {
    // Play meow sound if available and not already playing
    if (this.sound && !this.sound.isPlaying) {
      this.sound.play();
    }

    // Start bounce animation
    this.isAnimating = true;
    this.animationProgress = 0;
  }

  /**
   * Update animation state - should be called every frame
   * @param deltaTime - time since last frame in seconds
   */
  update(deltaTime: number): void {
    if (!this.isAnimating) return;

    // Animation duration in seconds
    const duration = 0.3;
    this.animationProgress += deltaTime / duration;

    if (this.animationProgress >= 1) {
      // Animation complete - reset to original scale
      this.mesh.scale.copy(this.originalScale);
      this.isAnimating = false;
      this.animationProgress = 0;
    } else {
      // Bounce animation using sine wave for smooth up-and-down motion
      // Math.sin gives us a smooth curve, PI gives us one complete "bump"
      const bounce = Math.sin(this.animationProgress * Math.PI);
      const scaleMultiplier = 1 + bounce * 0.3;  // Scale up to 130% at peak

      this.mesh.scale.set(
        this.originalScale.x * scaleMultiplier,
        this.originalScale.y * (1 + bounce * 0.5),  // More vertical bounce
        this.originalScale.z * scaleMultiplier
      );

      // Also bounce the cat up a little
      this.mesh.position.y = this.originalScale.y * 0.4 + bounce * 0.5;
    }
  }
}
