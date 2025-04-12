import * as THREE from 'three';
import { createGround } from './ground';
import { createPond } from './pond';
import { createRocks } from './rocks';
import { createNest } from './nest';

// Interface for the returned world data
export interface WorldData {
    nestPosition: THREE.Vector3;
    // Add other relevant data here if needed, e.g., ground mesh, pond mesh
}

export function createWorld(scene: THREE.Scene): WorldData {
    // Ground
    const ground = createGround(scene);
    const groundSize = (ground.geometry as THREE.PlaneGeometry).parameters;

    // Pond
    const pond = createPond(scene);
    const pondPosition = pond.position;
    // Ensure geometry is CircleGeometry before accessing parameters
    let pondRadius = 0;
    if (pond.geometry instanceof THREE.CircleGeometry) {
        pondRadius = pond.geometry.parameters.radius;
    } else {
        console.error("Pond geometry is not CircleGeometry, cannot determine radius.");
        // Provide a default or handle the error appropriately
        pondRadius = 15; // Default based on original code
    }


    // Rocks - Scatter within ground bounds, avoiding the pond
    createRocks(scene, pondPosition, pondRadius, 20, groundSize.width, groundSize.height);

    // Nest
    const { nestPosition } = createNest(scene); // Get nest position

    return { nestPosition }; // Return key positions
}
