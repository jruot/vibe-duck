import * as THREE from 'three';

// TODO: Replace basic colors with textures loaded from files
import { GameObject } from './gameObject'; // Import base class

// const textureLoader = new THREE.TextureLoader();
// const waterTexture = textureLoader.load('assets/textures/water.png'); // Example path

const pondMaterial = new THREE.MeshStandardMaterial({
    color: 0x1E90FF, // Dodger blue
    // map: waterTexture, // TODO: Uncomment when texture is ready
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide // Render both sides if camera goes below
});

export class Pond extends GameObject {
    public radius: number;

    constructor(scene: THREE.Scene, position: THREE.Vector3, radius: number = 15) {
        // Create the model
        const geometry = new THREE.CircleGeometry(radius, 32);
        const model = new THREE.Mesh(geometry, pondMaterial);
        model.name = "PondMesh";
        model.receiveShadow = true; // Pond surface receives shadows

        super(model); // Initialize GameObject

        this.radius = radius;

        // Set position, rotation, and add to scene
        this.setPosition(position.x, position.y, position.z);
        this.object3D.rotation.x = -Math.PI / 2; // Lay flat
        scene.add(this.object3D);
    }

    // public dispose(scene: THREE.Scene): void {
    //     // Add specific disposal logic if necessary
    //     super.dispose(scene);
    // }
}

/**
 * Creates a Pond instance at a predefined position and adds it to the scene.
 * @param scene The THREE.Scene to add the pond to.
 * @returns The created Pond instance.
 */
export function createPond(scene: THREE.Scene): Pond {
    const pondPosition = new THREE.Vector3(-30, 0.01, 20); // Position slightly above ground
    const pondRadius = 15;
    const pondInstance = new Pond(scene, pondPosition, pondRadius);
    return pondInstance;
}
