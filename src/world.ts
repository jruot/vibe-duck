import * as THREE from 'three';
// Removed duplicate import * as THREE from 'three';
import { createGround } from './ground';
import { createPond } from './pond';
import { createRocks } from './rocks';
import { createNest } from './nest';
import { createTrees } from './tree';
import { createBushes } from './bush'; // Import the new bush function

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
    createRocks(scene, pondPosition, pondRadius, 30, groundSize.width, groundSize.height); // Increased rock count slightly

    // Nest
    const { nest, nestPosition } = createNest(scene); // Get nest mesh and position
    let nestRadius = 0;
    if (nest.geometry instanceof THREE.TorusGeometry) {
        nestRadius = nest.geometry.parameters.radius + nest.geometry.parameters.tube; // Outer radius
    } else {
        console.warn("Nest geometry is not TorusGeometry, using default radius for tree placement.");
        nestRadius = 2.5; // Default based on TorusGeometry(2, 0.5, ...)
    }


    // Trees - Scatter within ground bounds, avoiding pond and nest
    createTrees(scene, pondPosition, pondRadius, nestPosition, nestRadius, 25, groundSize.width, groundSize.height);

    // Bushes - Scatter within ground bounds, avoiding pond and nest
    createBushes(scene, pondPosition, pondRadius, nestPosition, nestRadius, 40, groundSize.width, groundSize.height);


    return { nestPosition }; // Return key positions
}
