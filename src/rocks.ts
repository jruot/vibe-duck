import * as THREE from 'three';

// TODO: Replace basic colors with textures loaded from files
// const textureLoader = new THREE.TextureLoader();
// const rockTexture = textureLoader.load('assets/textures/rock.png'); // Example path

const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080, // Grey
    // map: rockTexture, // TODO: Uncomment when texture is ready
    roughness: 0.8,
    metalness: 0.1,
});

// --- Rock Class ---
import { GameObject } from './gameObject'; // Import base class

export class Rock extends GameObject {
    public size: number;
    public boundingRadius: number;

    constructor(scene: THREE.Scene, position: THREE.Vector3, size: number, rotation: THREE.Euler) {
        // Create the model directly within the constructor
        const geometry = new THREE.DodecahedronGeometry(size / 2, 0); // Use size as diameter, radius is size/2
        const model = new THREE.Mesh(geometry, rockMaterial);
        model.name = "RockMesh";
        model.castShadow = true;
        model.receiveShadow = true;

        super(model); // Initialize GameObject

        this.size = size;
        this.boundingRadius = size / 2; // Radius for placement checks

        // Set position, rotation, and add to scene
        this.setPosition(position.x, position.y, position.z);
        this.object3D.rotation.copy(rotation);
        scene.add(this.object3D);
    }

    // public dispose(scene: THREE.Scene): void {
    //     // Add specific disposal logic if necessary
    //     super.dispose(scene);
    // }
}


/**
 * Creates and adds Rock instances to the scene, avoiding specified circular areas (pond, nest).
 * @param scene The THREE.Scene to add rocks to.
 * @param pondPosition The center position of the pond area to avoid.
 * @param pondRadius The radius of the pond area to avoid.
 * @param nestPosition The center position of the nest area to avoid.
 * @param nestRadius The approximate radius of the nest area to avoid.
 * @param count The approximate number of rocks to create.
 * @param areaWidth The width of the area to scatter rocks within.
 * @param areaDepth The depth of the area to scatter rocks within.
 */
export function createRocks(
    scene: THREE.Scene,
    pondPosition: THREE.Vector3,
    pondRadius: number,
    nestPosition: THREE.Vector3, // Add nest position parameter
    nestRadius: number,     // Add nest radius parameter
    count: number = 20,
    areaWidth: number = 200,
    areaDepth: number = 200
): void {
    let placedRocks = 0;
    let attempts = 0;
    const maxAttempts = count * 3; // Limit attempts to prevent infinite loops

    while (placedRocks < count && attempts < maxAttempts) {
        attempts++;
        const rockSize = Math.random() * 2 + 1; // Random size between 1 and 3 (diameter)
        const rockRadius = rockSize / 2;

        // Calculate random position within the specified area
        const x = (Math.random() - 0.5) * (areaWidth - rockSize); // Adjust for rock diameter
        const z = (Math.random() - 0.5) * (areaDepth - rockSize);
        const y = rockRadius; // Sit on the ground (center is at radius height)
        const potentialPosition = new THREE.Vector3(x, y, z);
        const potentialRotation = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);


        // Avoid placing rocks in the pond
        // Calculate distance in the XZ plane only
        const potentialPosXZ = new THREE.Vector2(potentialPosition.x, potentialPosition.z);

        // Avoid placing rocks in the pond
        const distanceToPondCenter = potentialPosXZ.distanceTo(new THREE.Vector2(pondPosition.x, pondPosition.z));

        // Avoid placing rocks near the nest
        const distanceToNestCenter = potentialPosXZ.distanceTo(new THREE.Vector2(nestPosition.x, nestPosition.z));


        // Check distances against exclusion zones (pond, nest) + rock radius
        if (distanceToPondCenter > pondRadius + rockRadius &&
            distanceToNestCenter > nestRadius + rockRadius)
        {
             // If position is valid, create and add the Rock instance
             new Rock(scene, potentialPosition, rockSize, potentialRotation); // Constructor handles adding to scene
             placedRocks++;
        }
        // If inside an exclusion zone, don't instantiate and try again.
    }

    if (attempts >= maxAttempts) {
        console.warn(`createRocks: Reached max attempts (${maxAttempts}) trying to place ${count} rocks. Placed ${placedRocks}.`);
    }
}
