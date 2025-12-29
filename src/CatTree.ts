import * as THREE from "three";

/**
 * CatTree class - a simple cat tree/scratching post for the scene
 */
export class CatTree {
  mesh: THREE.Group;

  constructor(position: THREE.Vector3) {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);

    // Materials
    const ropeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2b48c, // Tan for sisal rope
      roughness: 1.0,
      metalness: 0.0,
    });

    const carpetMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969, // Dim grey carpet
      roughness: 0.95,
      metalness: 0.0,
    });

    // ============================================
    // BASE - wide platform at the bottom
    // ============================================
    const baseGeometry = new THREE.BoxGeometry(2, 0.15, 2);
    const base = new THREE.Mesh(baseGeometry, carpetMaterial);
    base.position.set(0, 0.075, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    this.mesh.add(base);

    // ============================================
    // MAIN POLE - wrapped in sisal rope
    // ============================================
    const poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 12);
    const pole = new THREE.Mesh(poleGeometry, ropeMaterial);
    pole.position.set(0, 1.65, 0);
    pole.castShadow = true;
    this.mesh.add(pole);

    // ============================================
    // LOWER PLATFORM
    // ============================================
    const lowerPlatformGeometry = new THREE.BoxGeometry(1.2, 0.12, 1.2);
    const lowerPlatform = new THREE.Mesh(lowerPlatformGeometry, carpetMaterial);
    lowerPlatform.position.set(0.3, 1.2, 0);
    lowerPlatform.castShadow = true;
    lowerPlatform.receiveShadow = true;
    this.mesh.add(lowerPlatform);

    // ============================================
    // UPPER PLATFORM - at the top
    // ============================================
    const upperPlatformGeometry = new THREE.BoxGeometry(1.4, 0.12, 1.4);
    const upperPlatform = new THREE.Mesh(upperPlatformGeometry, carpetMaterial);
    upperPlatform.position.set(-0.3, 2.5, 0);
    upperPlatform.castShadow = true;
    upperPlatform.receiveShadow = true;
    this.mesh.add(upperPlatform);

    // ============================================
    // TOP PERCH - small circular bed at very top
    // ============================================
    const perchGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.2, 16);
    const perch = new THREE.Mesh(perchGeometry, carpetMaterial);
    perch.position.set(0, 3.25, 0);
    perch.castShadow = true;
    perch.receiveShadow = true;
    this.mesh.add(perch);

    // Perch rim (slightly raised edge)
    const rimGeometry = new THREE.TorusGeometry(0.38, 0.05, 8, 24);
    const rim = new THREE.Mesh(rimGeometry, carpetMaterial);
    rim.position.set(0, 3.35, 0);
    rim.rotation.x = Math.PI / 2;
    rim.castShadow = true;
    this.mesh.add(rim);

    // ============================================
    // DANGLING TOY - hanging from upper platform
    // ============================================
    const stringGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 4);
    const stringMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const string = new THREE.Mesh(stringGeometry, stringMaterial);
    string.position.set(-0.3, 2.24, 0.5);
    this.mesh.add(string);

    // Toy ball
    const toyGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const toyMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
    const toy = new THREE.Mesh(toyGeometry, toyMaterial);
    toy.position.set(-0.3, 2.0, 0.5);
    toy.castShadow = true;
    this.mesh.add(toy);
  }
}
