import * as THREE from 'three';

// TODO: Replace basic colors with textures loaded from files
// const textureLoader = new THREE.TextureLoader();
// const nestTexture = textureLoader.load('assets/textures/nest.png'); // Example path

export function createNest(scene: THREE.Scene): { nest: THREE.Mesh, nestPosition: THREE.Vector3 } {
    const nestPosition = new THREE.Vector3(10, 0.1, -5); // Define nest position
    const nestGeometry = new THREE.TorusGeometry(2, 0.5, 8, 24);
    const nestMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Saddle brown
        // map: nestTexture, // TODO: Uncomment when texture is ready
    });
    const nest = new THREE.Mesh(nestGeometry, nestMaterial);
    nest.position.copy(nestPosition);
    nest.rotation.x = Math.PI / 2; // Lay flat
    nest.castShadow = true;
    nest.receiveShadow = true;
    scene.add(nest);

    return { nest, nestPosition }; // Return both mesh and position
}
