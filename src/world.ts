import * as THREE from 'three';
import { createGround } from './ground';
import { createPond, Pond } from './pond'; // Import class
import { createRocks } from './rocks'; // Keep placement function
import { createNest, Nest } from './nest'; // Import class
import { createTrees } from './tree'; // Keep placement function
import { createBushes } from './bush'; // Keep placement function

// Interface for the returned world data
export interface WorldData {
    nest: Nest; // Return the Nest instance
    pond: Pond; // Return the Pond instance
    // Add other relevant data here if needed, e.g., ground mesh
}

export function createWorld(scene: THREE.Scene): WorldData {
    // --- Create Pond FIRST to get its position and radius ---
    const pond = createPond(scene);
    const pondPosition = pond.position; // Get position from the instance
    const pondRadius = pond.radius;     // Get radius from the instance

    // --- Create Ground, passing pond data to flatten the area ---
    const ground = createGround(scene, pondPosition, pondRadius); // Pass pond data

    // Assuming PlaneGeometry for ground to get size (can still do this after creation)
    let groundWidth = 200;
    let groundHeight = 200;
    if (ground.geometry instanceof THREE.PlaneGeometry) {
        groundWidth = ground.geometry.parameters.width;
        groundHeight = ground.geometry.parameters.height;
    } else {
        console.warn("Ground geometry is not PlaneGeometry, using default size 200x200 for object placement.");
    }

    // Pond instance is already created above

    // Nest - Instantiate the Nest class
    const nest = createNest(scene);
    const nestPosition = nest.position; // Get position from the instance
    const nestRadius = nest.boundingRadius; // Get bounding radius from the instance

    // Create static collidable objects and collect them
    const rocks: Rock[] = createRocks(scene, pondPosition, pondRadius, nestPosition, nestRadius, 30, groundWidth, groundHeight);
    const trees: Tree[] = createTrees(scene, pondPosition, pondRadius, nestPosition, nestRadius, 25, groundWidth, groundHeight);
    const bushes: Bush[] = createBushes(scene, pondPosition, pondRadius, nestPosition, nestRadius, 40, groundWidth, groundHeight);

    // Combine all collidable objects into one list
    // Filter just in case, though constructors should set isCollidable=true
    const collidables: GameObject[] = [
        ...rocks.filter(r => r.isCollidable),
        ...trees.filter(t => t.isCollidable),
        ...bushes.filter(b => b.isCollidable)
    ];


    // Return the created Nest, Pond, and the list of collidables
    return { nest, pond, collidables };
}
