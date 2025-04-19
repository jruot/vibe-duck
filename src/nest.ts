import * as THREE from 'three';

// TODO: Replace basic colors with textures loaded from files
import { GameObject } from './gameObject'; // Import base class

// const textureLoader = new THREE.TextureLoader();
// const nestTexture = textureLoader.load('assets/textures/nest.png'); // Example path

const nestMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Saddle brown
    // map: nestTexture, // TODO: Uncomment when texture is ready
});

export class Nest extends GameObject {
    public radius: number;
    public tube: number;
    public boundingRadius: number; // Outer radius for placement checks

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        // Define geometry parameters
        const radius = 2;
        const tube = 0.5;
        const radialSegments = 8;
        const tubularSegments = 24;

        // Create the model
        const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
        const model = new THREE.Mesh(geometry, nestMaterial);
        model.name = "NestMesh";
        model.castShadow = true;
        model.receiveShadow = true;

        super(model); // Initialize GameObject

        // Store geometry info and calculate bounding radius
        this.radius = radius;
        this.tube = tube;
        this.boundingRadius = radius + tube; // Outer radius

        // Set position, rotation, and add to scene
        this.setPosition(position.x, position.y, position.z);
        this.object3D.rotation.x = Math.PI / 2; // Lay flat
        scene.add(this.object3D);
    }

    // public dispose(scene: THREE.Scene): void {
    //     // Add specific disposal logic if necessary
    //     super.dispose(scene);
    // }
}

/**
 * Creates a Nest instance at a predefined position and adds it to the scene.
 * @param scene The THREE.Scene to add the nest to.
 * @returns The created Nest instance.
 */
export function createNest(scene: THREE.Scene): Nest {
    const nestPosition = new THREE.Vector3(10, 0.1, -5); // Define nest position
    const nestInstance = new Nest(scene, nestPosition);
    return nestInstance;
}
