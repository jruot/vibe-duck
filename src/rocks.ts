import * as THREE from 'three';

// TODO: Replace basic colors with textures loaded from files
// const textureLoader = new THREE.TextureLoader();
// const rockTexture = textureLoader.load('assets/textures/rock.png'); // Example path

const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080, // Grey
    // map: rockTexture, // TODO: Uncomment when texture is ready
});

/**
 * Creates and adds rocks to the scene, avoiding a specified circular area (pond).
 * @param scene The THREE.Scene to add rocks to.
 * @param pondPosition The center position of the area to avoid.
 * @param pondRadius The radius of the area to avoid.
 * @param count The approximate number of rocks to create.
 * @param areaWidth The width of the area to scatter rocks within.
 * @param areaDepth The depth of the area to scatter rocks within.
 */
export function createRocks(
    scene: THREE.Scene,
    pondPosition: THREE.Vector3,
    pondRadius: number,
    count: number = 20,
    areaWidth: number = 200,
    areaDepth: number = 200
): void {
    let placedRocks = 0;
    let attempts = 0;
    const maxAttempts = count * 3; // Limit attempts to prevent infinite loops

    while (placedRocks < count && attempts < maxAttempts) {
        attempts++;
        const rockSize = Math.random() * 2 + 1; // Random size between 1 and 3
        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0); // Simple poly shape
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);

        // Calculate random position within the specified area
        const x = (Math.random() - 0.5) * (areaWidth - rockSize); // Adjust for rock size to stay within bounds
        const z = (Math.random() - 0.5) * (areaDepth - rockSize);
        const y = rockSize / 2; // Sit on the ground (assuming ground is at Y=0)
        rock.position.set(x, y, z);

        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;

        // Avoid placing rocks in the pond
        // Calculate distance in the XZ plane only, since pond is flat
        const distanceToPondCenter = new THREE.Vector2(rock.position.x, rock.position.z)
            .distanceTo(new THREE.Vector2(pondPosition.x, pondPosition.z));

        if (distanceToPondCenter > pondRadius + rockSize / 2) { // Check distance against pond radius + rock radius
             scene.add(rock);
             placedRocks++;
        }
        // If inside pond, simply don't add it and try again in the next loop iteration.
    }

    if (attempts >= maxAttempts) {
        console.warn(`createRocks: Reached max attempts (${maxAttempts}) trying to place ${count} rocks. Placed ${placedRocks}.`);
    }
}
