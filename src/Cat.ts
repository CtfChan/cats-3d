import * as THREE from 'three';

/**
 * Cat class - represents a clickable 3D cat in the scene.
 * Built from multiple sphere/cylinder geometries for a more lifelike appearance.
 */
export class Cat {
  // The main group that contains all cat parts
  mesh: THREE.Group;

  // Audio for the meow sound - attached to this specific cat
  private sound: THREE.PositionalAudio | null = null;

  // Animation state
  private isAnimating = false;
  private animationProgress = 0;
  private originalY: number;

  // Reference to the tail for animation
  private tail: THREE.Mesh | null = null;

  // Reference to mouth for meow animation
  private mouth: THREE.Mesh | null = null;
  private mouthClosedScaleY = 0.3;
  private mouthOpenScaleY = 1.2;

  // Walking state
  private walkSpeed = 0.8;
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private walkTime = 0;
  private idleTime = 0;
  private isIdle = false;
  private idleDuration = 0;
  private boundaryRadius = 10; // How far cat can wander from center

  // Obstacles to avoid (circular zones defined by position and radius)
  private obstacles: Array<{ position: THREE.Vector3; radius: number }> = [];

  // Leg references for walk animation
  private frontLeftLeg: THREE.Mesh | null = null;
  private frontRightLeg: THREE.Mesh | null = null;
  private backLeftLeg: THREE.Mesh | null = null;
  private backRightLeg: THREE.Mesh | null = null;

  constructor(
    position: THREE.Vector3,
    audioListener: THREE.AudioListener,
    audioBuffer: AudioBuffer | null
  ) {
    // Use a Group to hold all the cat's body parts
    // This lets us move/rotate the entire cat as one unit
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);

    // Grey color palette for the cat
    const bodyColor = 0xb0b0b0;
    const darkColor = 0x808080;
    const pinkColor = 0xffb6c1;

    // Material for most body parts
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.8,
      metalness: 0.1
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
      color: darkColor,
      roughness: 0.8,
      metalness: 0.1
    });

    // ============================================
    // BODY - elongated sphere
    // ============================================
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 12);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 0.8, 1.4); // Stretch to make oval body
    body.position.set(0, 0.5, 0);
    body.castShadow = true;
    this.mesh.add(body);

    // ============================================
    // HEAD - sphere
    // ============================================
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 12);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.75, 0.6);
    head.castShadow = true;
    this.mesh.add(head);

    // ============================================
    // EARS - cone geometry for pointed ears
    // ============================================
    const earGeometry = new THREE.ConeGeometry(0.12, 0.25, 4);

    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(-0.2, 1.1, 0.55);
    leftEar.rotation.z = -0.2;
    leftEar.castShadow = true;
    this.mesh.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
    rightEar.position.set(0.2, 1.1, 0.55);
    rightEar.rotation.z = 0.2;
    rightEar.castShadow = true;
    this.mesh.add(rightEar);

    // Inner ears (pink)
    const innerEarGeometry = new THREE.ConeGeometry(0.06, 0.15, 4);
    const innerEarMaterial = new THREE.MeshStandardMaterial({ color: pinkColor });

    const leftInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
    leftInnerEar.position.set(-0.2, 1.05, 0.58);
    leftInnerEar.rotation.z = -0.2;
    this.mesh.add(leftInnerEar);

    const rightInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
    rightInnerEar.position.set(0.2, 1.05, 0.58);
    rightInnerEar.rotation.z = 0.2;
    this.mesh.add(rightInnerEar);

    // ============================================
    // EYES - spheres with pupils
    // ============================================
    const eyeWhiteGeometry = new THREE.SphereGeometry(0.08, 12, 8);
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const leftEye = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    leftEye.position.set(-0.15, 0.82, 0.95);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    rightEye.position.set(0.15, 0.82, 0.95);
    this.mesh.add(rightEye);

    // Pupils
    const pupilGeometry = new THREE.SphereGeometry(0.04, 8, 6);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.15, 0.82, 1.0);
    this.mesh.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.15, 0.82, 1.0);
    this.mesh.add(rightPupil);

    // ============================================
    // NOSE - small pink sphere
    // ============================================
    const noseGeometry = new THREE.SphereGeometry(0.05, 8, 6);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: pinkColor });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.7, 1.0);
    this.mesh.add(nose);

    // ============================================
    // MOUTH - oval that scales to open/close
    // ============================================
    const mouthGeometry = new THREE.SphereGeometry(0.06, 8, 6);
    const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    this.mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    this.mouth.position.set(0, 0.62, 0.98);
    this.mouth.scale.set(1, this.mouthClosedScaleY, 0.5); // Start closed (flattened)
    this.mesh.add(this.mouth);

    // ============================================
    // LEGS - four cylinders (stored for walk animation)
    // ============================================
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8);

    // Front left leg
    this.frontLeftLeg = new THREE.Mesh(legGeometry, darkMaterial);
    this.frontLeftLeg.position.set(-0.25, 0.2, 0.35);
    this.frontLeftLeg.castShadow = true;
    this.mesh.add(this.frontLeftLeg);

    // Front right leg
    this.frontRightLeg = new THREE.Mesh(legGeometry, darkMaterial);
    this.frontRightLeg.position.set(0.25, 0.2, 0.35);
    this.frontRightLeg.castShadow = true;
    this.mesh.add(this.frontRightLeg);

    // Back left leg
    this.backLeftLeg = new THREE.Mesh(legGeometry, darkMaterial);
    this.backLeftLeg.position.set(-0.25, 0.2, -0.35);
    this.backLeftLeg.castShadow = true;
    this.mesh.add(this.backLeftLeg);

    // Back right leg
    this.backRightLeg = new THREE.Mesh(legGeometry, darkMaterial);
    this.backRightLeg.position.set(0.25, 0.2, -0.35);
    this.backRightLeg.castShadow = true;
    this.mesh.add(this.backRightLeg);

    // ============================================
    // TAIL - curved cylinder
    // ============================================
    const tailGeometry = new THREE.CylinderGeometry(0.05, 0.03, 0.6, 8);
    this.tail = new THREE.Mesh(tailGeometry, darkMaterial);
    this.tail.position.set(0, 0.6, -0.65);
    this.tail.rotation.x = -0.8; // Angle upward
    this.tail.castShadow = true;
    this.mesh.add(this.tail);

    // Store reference to this Cat instance on the group for raycasting
    this.mesh.userData.cat = this;

    // Store original Y position for animation
    this.originalY = position.y;

    // Initialize walking target
    this.pickNewTarget();

    // Setup positional audio if buffer is available
    if (audioBuffer) {
      this.sound = new THREE.PositionalAudio(audioListener);
      this.sound.setBuffer(audioBuffer);
      this.sound.setRefDistance(5);
      this.sound.setVolume(0.8);
      this.mesh.add(this.sound);
    }
  }

  /**
   * Add an obstacle for the cat to avoid
   */
  addObstacle(position: THREE.Vector3, radius: number): void {
    this.obstacles.push({ position, radius });
  }

  /**
   * Check if a position collides with any obstacle
   */
  private collidesWithObstacle(position: THREE.Vector3, buffer = 0.5): boolean {
    for (const obstacle of this.obstacles) {
      const dx = position.x - obstacle.position.x;
      const dz = position.z - obstacle.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < obstacle.radius + buffer) {
        return true;
      }
    }
    return false;
  }

  /**
   * Update walking behavior - moves cat toward target, handles idle time
   */
  private updateWalking(deltaTime: number): void {
    if (this.isIdle) {
      // Cat is resting, count down idle time
      this.idleTime += deltaTime;
      if (this.idleTime >= this.idleDuration) {
        this.isIdle = false;
        this.idleTime = 0;
        this.pickNewTarget();
      }
      // Reset leg positions when idle
      this.animateLegs(0);
      return;
    }

    // Calculate direction to target
    const direction = new THREE.Vector3();
    direction.subVectors(this.targetPosition, this.mesh.position);
    direction.y = 0; // Keep on ground plane
    const distance = direction.length();

    // Check if we've reached the target
    if (distance < 0.2) {
      this.isIdle = true;
      this.animateLegs(0);
      return;
    }

    // Normalize direction and move toward target
    direction.normalize();

    // Rotate cat to face movement direction
    const targetAngle = Math.atan2(direction.x, direction.z);
    // Smoothly rotate toward target angle
    const currentAngle = this.mesh.rotation.y;
    const angleDiff = targetAngle - currentAngle;
    // Handle angle wrapping
    const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    this.mesh.rotation.y += normalizedDiff * deltaTime * 3;

    // Calculate next position
    const moveAmount = this.walkSpeed * deltaTime;
    const nextPosition = new THREE.Vector3(
      this.mesh.position.x + direction.x * moveAmount,
      0,
      this.mesh.position.z + direction.z * moveAmount
    );

    // Check for collision with obstacles
    if (this.collidesWithObstacle(nextPosition)) {
      // Pick a new target to walk around the obstacle
      this.pickNewTarget();
      return;
    }

    // Move toward target
    this.mesh.position.x = nextPosition.x;
    this.mesh.position.z = nextPosition.z;

    // Update walk animation
    this.walkTime += deltaTime * 8; // Speed of leg animation
    this.animateLegs(this.walkTime);
  }

  /**
   * Animate legs in a walking pattern
   */
  private animateLegs(time: number): void {
    const legSwing = Math.sin(time) * 0.3;

    // Front left and back right move together (diagonal pair)
    if (this.frontLeftLeg) {
      this.frontLeftLeg.rotation.x = legSwing;
    }
    if (this.backRightLeg) {
      this.backRightLeg.rotation.x = legSwing;
    }

    // Front right and back left move together (opposite diagonal)
    if (this.frontRightLeg) {
      this.frontRightLeg.rotation.x = -legSwing;
    }
    if (this.backLeftLeg) {
      this.backLeftLeg.rotation.x = -legSwing;
    }
  }

  /**
   * Pick a new random target position within the boundary, avoiding obstacles
   */
  private pickNewTarget(): void {
    // Try up to 10 times to find a valid target
    for (let attempts = 0; attempts < 10; attempts++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.boundaryRadius;
      const candidate = new THREE.Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );

      // Check if this target is not inside an obstacle
      if (!this.collidesWithObstacle(candidate, 0.8)) {
        this.targetPosition.copy(candidate);
        break;
      }
    }
    // Set a random idle duration for when we reach the target (1-4 seconds)
    this.idleDuration = 1 + Math.random() * 3;
  }

  /**
   * Called when the cat is clicked - plays sound and triggers animation
   */
  onClick(): void {
    if (this.sound && !this.sound.isPlaying) {
      this.sound.play();
    }

    this.isAnimating = true;
    this.animationProgress = 0;
  }

  /**
   * Update animation state - should be called every frame
   * @param deltaTime - time since last frame in seconds
   */
  update(deltaTime: number): void {
    // Always animate the tail with a gentle sway
    if (this.tail) {
      this.tail.rotation.z = Math.sin(Date.now() * 0.003) * 0.3;
    }

    // Handle walking behavior (only when not doing meow animation)
    if (!this.isAnimating) {
      this.updateWalking(deltaTime);
    }

    if (!this.isAnimating) return;

    // Animation lasts 3 seconds to match the meow sound
    const duration = 3.0;
    this.animationProgress += deltaTime / duration;

    if (this.animationProgress >= 1) {
      // Animation complete - reset
      this.mesh.position.y = this.originalY;
      this.mesh.scale.set(1, 1, 1);
      this.isAnimating = false;
      this.animationProgress = 0;

      // Close mouth
      if (this.mouth) {
        this.mouth.scale.y = this.mouthClosedScaleY;
      }
    } else {
      // Multiple bounces over the 3 second duration (3 bounces)
      const bounceCount = 3;
      const bounce = Math.sin(this.animationProgress * Math.PI * bounceCount);

      // Fade out the bounce intensity over time
      const fadeOut = 1 - this.animationProgress * 0.7;

      // Jump up (smaller bounces that fade out)
      this.mesh.position.y = this.originalY + Math.abs(bounce) * 0.3 * fadeOut;

      // Squash and stretch effect
      const squash = 1 + Math.abs(bounce) * 0.1 * fadeOut;
      this.mesh.scale.set(
        1 + Math.abs(bounce) * 0.08 * fadeOut,  // Wider
        squash,                                   // Taller
        1 - Math.abs(bounce) * 0.04 * fadeOut    // Slightly shorter
      );

      // Open mouth during animation - opens and closes with meow
      if (this.mouth) {
        // Mouth opens/closes multiple times, fading out
        const mouthOpen = this.mouthClosedScaleY +
          (this.mouthOpenScaleY - this.mouthClosedScaleY) * Math.abs(bounce) * fadeOut;
        this.mouth.scale.y = mouthOpen;
      }
    }
  }
}
