import * as THREE from 'three';

// TODO: Replace basic colors with textures loaded from files
// const textureLoader = new THREE.TextureLoader();
// const duckBodyTexture = textureLoader.load('assets/textures/duck_body.png'); // Example
// const duckWingTexture = textureLoader.load('assets/textures/duck_wing.png'); // Example
// const duckPeakTexture = textureLoader.load('assets/textures/duck_peak.png'); // Example

// --- Material Definitions ---
const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700, // Gold-like yellow
    // map: duckBodyTexture, // TODO: Uncomment when texture is ready
    roughness: 0.7,
    metalness: 0.1
});
const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFEC8B, // Lighter yellow for wings
    // map: duckWingTexture, // TODO: Uncomment when texture is ready
    roughness: 0.7,
    metalness: 0.1
});
const peakMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFA500, // Orange
    // map: duckPeakTexture, // TODO: Uncomment when texture is ready
    roughness: 0.5,
    metalness: 0.0
});
const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000, // Black
    roughness: 0.2,
    metalness: 0.0
});
const legMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFA500, // Orange
    roughness: 0.6,
    metalness: 0.0
});


// --- Helper Function to Create Duck Parts ---

function createBody(scale: number): THREE.Mesh {
    const geometry = new THREE.CapsuleGeometry(0.5 * scale, 0.5 * scale, { capSegments: 8, radialSegments: 12 });
    const body = new THREE.Mesh(geometry, bodyMaterial);
    body.rotation.z = Math.PI / 2; // Orient horizontally
    body.castShadow = true;
    body.receiveShadow = true;
    return body;
}

function createHead(scale: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.35 * scale, 16, 12);
    const head = new THREE.Mesh(geometry, bodyMaterial);
    head.position.set(0.6 * scale, 0.3 * scale, 0); // Position relative to body center
    head.castShadow = true;
    head.receiveShadow = true;
    return head;
}

function createPeak(scale: number): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(0.15 * scale, 0.3 * scale, 8);
    const peak = new THREE.Mesh(geometry, peakMaterial);
    peak.rotation.z = -Math.PI / 2; // Point forward
    peak.position.set(0.2 * scale, 0, 0); // Position relative to head center
    peak.castShadow = true;
    return peak;
}

function createEye(scale: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.05 * scale, 8, 8);
    const eye = new THREE.Mesh(geometry, eyeMaterial);
    // Position relative to head center
    eye.position.set(0.1 * scale, 0.1 * scale, 0.1 * scale);
    return eye;
}

function createWing(scale: number): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.2 * scale, 0.3 * scale, 0.5 * scale, 0.1 * scale, 0.6 * scale, -0.1 * scale);
    shape.bezierCurveTo(0.4 * scale, -0.2 * scale, 0.1 * scale, -0.15 * scale, 0, 0);

    const extrudeSettings = { depth: 0.05 * scale, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const wing = new THREE.Mesh(geometry, wingMaterial);
    wing.castShadow = true;
    return wing;
}

function createLeg(scale: number): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.3 * scale, 8);
    const leg = new THREE.Mesh(geometry, legMaterial);
    leg.position.y = -0.15 * scale; // Position below the body center
    leg.castShadow = true;
    return leg;
}


// --- Main Duck Creation Functions ---

function assembleDuck(scale: number): THREE.Group {
    const duck = new THREE.Group();
    duck.name = "duckGroup"; // Name the main group

    // Body
    const body = createBody(scale);
    body.name = "body"; // Name the body
    duck.add(body);

    // Head
    const head = createHead(scale);
    head.name = "head"; // Name the head
    body.add(head); // Add head relative to body

    // Peak
    const peak = createPeak(scale);
    peak.name = "peak";
    head.add(peak); // Add peak relative to head

    // Eyes
    const eyeLeft = createEye(scale);
    eyeLeft.name = "eyeLeft";
    const eyeRight = eyeLeft.clone();
    eyeRight.name = "eyeRight";
    eyeLeft.position.set(0.1 * scale, 0.1 * scale, 0.1 * scale);
    eyeRight.position.set(0.1 * scale, 0.1 * scale, -0.1 * scale);
    head.add(eyeLeft);
    head.add(eyeRight);

    // Wings
    const wingLeft = createWing(scale);
    wingLeft.name = "wingLeft"; // Name the left wing
    const wingRight = wingLeft.clone();
    wingRight.name = "wingRight"; // Name the right wing
    wingLeft.position.set(0, 0.1 * scale, 0.4 * scale); // Position relative to body
    wingLeft.rotation.y = -Math.PI / 6; // Angle slightly
    wingRight.position.set(0, 0.1 * scale, -0.4 * scale);
    wingRight.rotation.y = Math.PI / 6;
    body.add(wingLeft);
    body.add(wingRight);

    // Legs
    const legLeft = createLeg(scale);
    legLeft.name = "legLeft";
    const legRight = legLeft.clone();
    legRight.name = "legRight";
    legLeft.position.set(-0.2 * scale, -0.4 * scale, 0.15 * scale); // Position relative to body
    legRight.position.set(-0.2 * scale, -0.4 * scale, -0.15 * scale);
    body.add(legLeft);
    body.add(legRight);

    // Adjust overall duck orientation if needed (e.g., stand upright)
    // Rotate model 90 degrees CCW to align front with +X axis (assuming default camera looks down -Z)
    duck.rotation.y = Math.PI / 2;

    // Add a bounding box helper for debugging collisions
    // const boxHelper = new THREE.BoxHelper(duck, 0xffff00);
    // duck.add(boxHelper); // Add helper to the duck group itself

    return duck;
}


export function createFatherDuck(): THREE.Group {
    const fatherScale = 1.0; // Base scale
    const duck = assembleDuck(fatherScale);
    // Optional: Modify materials or add distinguishing features
    // Example: Slightly darker body
    // (duck.getObjectByName('body') as THREE.Mesh).material = new THREE.MeshStandardMaterial({ color: 0x... });
    return duck;
}

export function createMotherDuck(): THREE.Group {
    const motherScale = 0.9; // Slightly smaller
    const duck = assembleDuck(motherScale);
    // Optional: Modify materials (e.g., slightly lighter color)
    return duck;
}

export function createBabyDuck(): THREE.Group {
    const babyScale = 0.4; // Much smaller
    const duck = assembleDuck(babyScale);
    // Optional: Modify materials (e.g., fluffier look if possible without textures)
    (duck.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
         color: 0xFFFFE0, // Lighter yellow for babies
         roughness: 0.9
        });
    return duck;
}
