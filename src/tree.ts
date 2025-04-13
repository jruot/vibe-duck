import * as THREE from 'three';

// --- Material Definitions ---
const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Saddle Brown
    roughness: 0.9,
    metalness: 0.1
});

const foliageMaterial = new THREE.MeshStandardMaterial({
    color: 0x228B22, // Forest Green
    roughness: 0.8,
    metalness: 0.1
});

/**
 * Creates a single tree model.
 * @param scale The overall scale of the tree.
 * @returns A THREE.Group representing the tree.
 */
function createTree(scale: number = 1.0): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunkHeight = 3 * scale;
    const trunkRadius = 0.3 * scale;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8); // Slightly wider base
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2; // Position trunk base at y=0
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Foliage (simple cone)
    const foliageHeight = 4 * scale;
    const foliageRadius = 1.5 * scale;
    const foliageGeometry = new THREE.ConeGeometry(foliageRadius, foliageHeight, 12);
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    // Position foliage on top of the trunk
    foliage.position.y = trunkHeight + foliageHeight / 2.5; // Adjust overlap slightly
    foliage.castShadow = true;
    foliage.receiveShadow = true; // Foliage can receive shadows from other objects
    tree.add(foliage);

    return tree;
}


/**
 * Creates and adds trees to the scene, avoiding specified areas like the pond.
 * @param scene The THREE.Scene to add trees to.
 * @param pondPosition The center position of the pond area to avoid.
 * @param pondRadius The radius of the pond area to avoid.
 * @param nestPosition The center position of the nest area to avoid.
 * @param nestRadius The approximate radius of the nest area to avoid.
 * @param count The approximate number of trees to create.
 * @param areaWidth The width of the area to scatter trees within.
 * @param areaDepth The depth of the area to scatter trees within.
 */
export function createTrees(
    scene: THREE.Scene,
    pondPosition: THREE.Vector3,
    pondRadius: number,
    nestPosition: THREE.Vector3,
    nestRadius: number,
    count: number = 15,
    areaWidth: number = 200,
    areaDepth: number = 200
): void {
    let placedTrees = 0;
    let attempts = 0;
    const maxAttempts = count * 5; // Limit attempts

    while (placedTrees < count && attempts < maxAttempts) {
        attempts++;
        const treeScale = Math.random() * 0.5 + 0.75; // Random scale between 0.75 and 1.25
        const tree = createTree(treeScale);

        // Calculate random position within the specified area
        // Use trunk radius for boundary checks
        const treeBaseRadius = 0.3 * treeScale * 1.2; // Use the wider base radius
        const x = (Math.random() - 0.5) * (areaWidth - treeBaseRadius * 2);
        const z = (Math.random() - 0.5) * (areaDepth - treeBaseRadius * 2);
        const y = 0; // Base of the trunk sits on the ground
        tree.position.set(x, y, z);

        // --- Avoid placing trees in the pond ---
        const distanceToPondCenterXZ = new THREE.Vector2(tree.position.x, tree.position.z)
            .distanceTo(new THREE.Vector2(pondPosition.x, pondPosition.z));

        // --- Avoid placing trees too close to the nest ---
         const distanceToNestCenterXZ = new THREE.Vector2(tree.position.x, tree.position.z)
            .distanceTo(new THREE.Vector2(nestPosition.x, nestPosition.z));


        // Check distances against exclusion zones (pond, nest) + tree radius
        if (distanceToPondCenterXZ > pondRadius + treeBaseRadius &&
            distanceToNestCenterXZ > nestRadius + treeBaseRadius)
        {
             scene.add(tree);
             placedTrees++;
        }
        // If inside an exclusion zone, don't add it and try again.
    }

    if (attempts >= maxAttempts) {
        console.warn(`createTrees: Reached max attempts (${maxAttempts}) trying to place ${count} trees. Placed ${placedTrees}.`);
    }
}
