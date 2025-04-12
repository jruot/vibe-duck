import * as THREE from 'three';

// TODO: Replace basic colors with textures loaded from files
// const textureLoader = new THREE.TextureLoader();
// const waterTexture = textureLoader.load('assets/textures/water.png'); // Example path

export function createPond(scene: THREE.Scene): THREE.Mesh {
    const pondGeometry = new THREE.CircleGeometry(15, 32); // Circular pond
    const pondMaterial = new THREE.MeshStandardMaterial({
        color: 0x1E90FF, // Dodger blue
        // map: waterTexture, // TODO: Uncomment when texture is ready
        transparent: true,
        opacity: 0.8
    });
    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-30, 0.01, 20); // Position the pond slightly above ground
    pond.receiveShadow = true;
    scene.add(pond);
    return pond;
}
