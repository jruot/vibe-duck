import * as THREE from 'three';

// TODO: Replace basic colors with textures loaded from files
// const textureLoader = new THREE.TextureLoader();
// const grassTexture = textureLoader.load('assets/textures/grass.png'); // Example path
// grassTexture.wrapS = THREE.RepeatWrapping;
// grassTexture.wrapT = THREE.RepeatWrapping;
// grassTexture.repeat.set(100, 100);

export function createGround(scene: THREE.Scene): THREE.Mesh {
    const groundGeometry = new THREE.PlaneGeometry(200, 200); // Large plane
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22, // Forest green
        // map: grassTexture, // TODO: Uncomment when texture is ready
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.receiveShadow = true; // Allow ground to receive shadows
    scene.add(ground);
    return ground;
}
