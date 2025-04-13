import * as THREE from 'three';

// --- Material Definition ---
const bushMaterial = new THREE.MeshStandardMaterial({
    color: 0x2E8B57, // Sea Green - slightly different from tree foliage
    roughness: 0.9,
    metalness: 0.05
});

/**
 * Creates a single bush model composed of several spheres.
 * @param scale The overall scale of the bush.
 * @returns A THREE.Group representing the bush.
 */
function createBush(scale: number = 1.0): THREE.Group {
    const bush = new THREE.Group();
    const numSpheres = Math.floor(Math.random() * 3) + 4; // 4 to 6 spheres per bush
    const baseRadius = 0.5 * scale;

    for (let i = 0; i < numSpheres; i++) {
        const sphereRadius = (Math.random() * 0.3 + 0.4) * baseRadius; // Random size for each sphere
        const sphereGeometry = new THREE.IcosahedronGeometry(sphereRadius, 0); // Low poly sphere
        const sphere = new THREE.Mesh(sphereGeometry, bushMaterial);

        // Position spheres randomly around the bush center, slightly elevated
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * baseRadius * 0.6;
        const height = Math.random() * baseRadius * 0.4 + sphereRadius * 0.5; // Ensure base is near ground

        sphere.position.set(
            Math.cos(angle) * distance,
            height,
            Math.sin(angle) * distance
        );

        sphere.castShadow = true;
        sphere.receiveShadow = true; // Can receive shadows
        bush.add(sphere);
    }

    // Calculate an approximate bounding radius for placement checks
    // This is a simplification; a bounding box would be more accurate but complex
    (bush.userData as any).boundingRadius = baseRadius * 1.2; // Estimate based on baseRadius

    return bush;
}


/**
 * Creates and adds bushes to the scene, avoiding specified areas.
 * @param scene The THREE.Scene to add bushes to.
 * @param pondPosition The center position of the pond area to avoid.
 * @param pondRadius The radius of the pond area to avoid.
 * @param nestPosition The center position of the nest area to avoid.
 * @param nestRadius The approximate radius of the nest area to avoid.
 * @param count The approximate number of bushes to create.
 * @param areaWidth The width of the area to scatter bushes within.
 * @param areaDepth The depth of the area to scatter bushes within.
 */
export function createBushes(
    scene: THREE.Scene,
    pondPosition: THREE.Vector3,
    pondRadius: number,
    nestPosition: THREE.Vector3,
    nestRadius: number,
    count: number = 30,
    areaWidth: number = 200,
    areaDepth: number = 200
): void {
    let placedBushes = 0;
    let attempts = 0;
    const maxAttempts = count * 5; // Limit attempts

    while (placedBushes < count && attempts < maxAttempts) {
        attempts++;
        const bushScale = Math.random() * 0.6 + 0.7; // Random scale between 0.7 and 1.3
        const bush = createBush(bushScale);
        const bushBoundingRadius = (bush.userData as any).boundingRadius || bushScale * 0.6; // Use calculated or estimated radius

        // Calculate random position within the specified area
        const x = (Math.random() - 0.5) * (areaWidth - bushBoundingRadius * 2);
        const z = (Math.random() - 0.5) * (areaDepth - bushBoundingRadius * 2);
        const y = 0; // Base of the bush sits near the ground
        bush.position.set(x, y, z);

        // --- Avoid placing bushes in the pond ---
        const distanceToPondCenterXZ = new THREE.Vector2(bush.position.x, bush.position.z)
            .distanceTo(new THREE.Vector2(pondPosition.x, pondPosition.z));

        // --- Avoid placing bushes too close to the nest ---
         const distanceToNestCenterXZ = new THREE.Vector2(bush.position.x, bush.position.z)
            .distanceTo(new THREE.Vector2(nestPosition.x, nestPosition.z));


        // Check distances against exclusion zones (pond, nest) + bush radius
        if (distanceToPondCenterXZ > pondRadius + bushBoundingRadius &&
            distanceToNestCenterXZ > nestRadius + bushBoundingRadius)
        {
             scene.add(bush);
             placedBushes++;
        }
        // If inside an exclusion zone, don't add it and try again.
    }

    if (attempts >= maxAttempts) {
        console.warn(`createBushes: Reached max attempts (${maxAttempts}) trying to place ${count} bushes. Placed ${placedBushes}.`);
    }
}
