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
    // LEGS - four cylinders
    // ============================================
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8);

    // Front left leg
    const frontLeftLeg = new THREE.Mesh(legGeometry, darkMaterial);
    frontLeftLeg.position.set(-0.25, 0.2, 0.35);
    frontLeftLeg.castShadow = true;
    this.mesh.add(frontLeftLeg);

    // Front right leg
    const frontRightLeg = new THREE.Mesh(legGeometry, darkMaterial);
    frontRightLeg.position.set(0.25, 0.2, 0.35);
    frontRightLeg.castShadow = true;
    this.mesh.add(frontRightLeg);

    // Back left leg
    const backLeftLeg = new THREE.Mesh(legGeometry, darkMaterial);
    backLeftLeg.position.set(-0.25, 0.2, -0.35);
    backLeftLeg.castShadow = true;
    this.mesh.add(backLeftLeg);

    // Back right leg
    const backRightLeg = new THREE.Mesh(legGeometry, darkMaterial);
    backRightLeg.position.set(0.25, 0.2, -0.35);
    backRightLeg.castShadow = true;
    this.mesh.add(backRightLeg);

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
