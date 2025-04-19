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
const maxHeightVariation = 0.2; // Maximum random height offset (Reduced from 0.5)
const pondFlatteningMargin = 1.0; // Add a small margin around the pond for flattening

export function createGround(
    scene: THREE.Scene,
    pondPosition: THREE.Vector3, // Add pond position parameter
    pondRadius: number          // Add pond radius parameter
): THREE.Mesh {
    const groundGeometry = new THREE.PlaneGeometry(
        groundWidth,
        groundDepth,
        groundSegments,
        groundSegments
    );

    // --- Apply Slight Random Height Variation, excluding pond area ---
    const vertices = groundGeometry.attributes.position;
    const pondCenterXZ = new THREE.Vector2(pondPosition.x, pondPosition.z); // Pond center in plane's local X/Y coordinates
    const basePlaneZ = -pondPosition.y; // Target Z for vertices under the pond (becomes world Y after rotation)

    for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const y = vertices.getY(i); // Corresponds to depth (local Y) before rotation
        const vertexPosXZ = new THREE.Vector2(x, y);

        // Check if the vertex is outside the pond radius (+ margin)
        if (vertexPosXZ.distanceTo(pondCenterXZ) > pondRadius + pondFlatteningMargin) {
            // Apply random offset relative to the base height
            const randomOffset = (Math.random() - 0.5) * maxHeightVariation;
            // Set the Z coordinate (which becomes world -Y after rotation)
            vertices.setZ(i, basePlaneZ + randomOffset);
        } else {
            // Vertex is inside the pond area, set its Z coordinate to match the pond's base height
            vertices.setZ(i, basePlaneZ);
        }
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
