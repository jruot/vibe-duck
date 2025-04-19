import * as THREE from 'three';

/**
 * Base class for objects in the game world that have a visual representation.
 */
export class GameObject {
    public object3D: THREE.Object3D; // The visual representation (Mesh, Group, etc.)
    public isCollidable: boolean = false; // Flag for collision detection participation
    public boundingRadius: number = 0; // Approximate radius for simple collision checks

    constructor(object3D: THREE.Object3D) {
        this.object3D = object3D;
    }

    public get position(): THREE.Vector3 {
        return this.object3D.position;
    }

    public setPosition(x: number, y: number, z: number): void {
        this.object3D.position.set(x, y, z);
    }

    public get quaternion(): THREE.Quaternion {
        return this.object3D.quaternion;
    }

    // Optional: Add common methods like update, dispose if needed by many objects
    // public update(deltaTime: number): void {
    //     // Base implementation or leave for subclasses
    // }

    public dispose(scene: THREE.Scene): void {
        // Remove from scene
        scene.remove(this.object3D);

        // Optional: Dispose geometry and material if they are unique to this object
        // and won't be reused. This requires checking the type of object3D.
        // Example for a single Mesh:
        // if (this.object3D instanceof THREE.Mesh) {
        //     this.object3D.geometry.dispose();
        //     // Check if material is an array or single
        //     if (Array.isArray(this.object3D.material)) {
        //         this.object3D.material.forEach(mat => mat.dispose());
        //     } else {
        //         this.object3D.material.dispose();
        //     }
        // }
        // // Example for a Group (need to iterate through children):
        // else if (this.object3D instanceof THREE.Group) {
        //     this.object3D.traverse((child) => {
        //         if (child instanceof THREE.Mesh) {
        //             child.geometry.dispose();
        //             if (Array.isArray(child.material)) {
        //                 child.material.forEach(mat => mat.dispose());
        //             } else if (child.material) {
        //                 child.material.dispose();
        //             }
        //         }
        //     });
        // }
        console.log("GameObject disposed and removed from scene.");
    }
}
