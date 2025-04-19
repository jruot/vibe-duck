import * as THREE from 'three';

// TODO: Replace basic colors with textures loaded from files
// const textureLoader = new THREE.TextureLoader();
// const grassTexture = textureLoader.load('assets/textures/grass.png'); // Example path
// grassTexture.wrapS = THREE.RepeatWrapping;
// grassTexture.wrapT = THREE.RepeatWrapping;
// grassTexture.repeat.set(100, 100);

const groundWidth = 200;
const groundDepth = 200;
const groundSegments = 50; // Increase segments for detail
const maxHeightVariation = 0.5; // Maximum random height offset

export function createGround(scene: THREE.Scene): THREE.Mesh {
    const groundGeometry = new THREE.PlaneGeometry(
        groundWidth,
        groundDepth,
        groundSegments,
        groundSegments
    );

    // --- Apply Slight Random Height Variation ---
    const vertices = groundGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
        // The Z coordinate of the plane becomes the Y coordinate (height) after rotation
        const currentZ = vertices.getZ(i);
        const randomOffset = (Math.random() - 0.5) * maxHeightVariation; // Random value between -maxHeight/2 and +maxHeight/2
        vertices.setZ(i, currentZ + randomOffset);
    }
    groundGeometry.computeVertexNormals(); // Recalculate normals for correct lighting

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
