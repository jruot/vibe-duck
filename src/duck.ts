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
    // Corrected constructor: CapsuleGeometry(radius, length, capSegments, radialSegments)
    const geometry = new THREE.CapsuleGeometry(0.5 * scale, 0.5 * scale, 8, 12);
    const body = new THREE.Mesh(geometry, bodyMaterial);
    // Keep body upright (default capsule orientation is along Y)
    body.castShadow = true;
    body.receiveShadow = true;
    return body;
}

function createHead(scale: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.35 * scale, 16, 12);
    const head = new THREE.Mesh(geometry, bodyMaterial);
    // Position relative to upright body center (above and slightly forward)
    head.position.set(0, 0.6 * scale, 0.15 * scale);
    head.castShadow = true;
    head.receiveShadow = true;
    return head;
}

function createPeak(scale: number): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(0.15 * scale, 0.3 * scale, 8);
    const peak = new THREE.Mesh(geometry, peakMaterial);
    // Peak (Cone) naturally points along +Z. No X rotation needed.
    // Position relative to new head center (slightly below center, forward)
    peak.position.set(0, -0.05 * scale, 0.3 * scale); // Position it in front of the head center
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

    // Keep the wing vertical initially (in XY plane)
    // We will rotate it into position during assembly.

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
    // Position relative to new head center (sides of head, slightly forward)
    eyeLeft.position.set(0.15 * scale, 0.05 * scale, 0.2 * scale); // Left eye
    eyeRight.position.set(-0.15 * scale, 0.05 * scale, 0.2 * scale); // Right eye
    head.add(eyeLeft);
    head.add(eyeRight);

    // Wings
    const wingLeft = createWing(scale);
    wingLeft.name = "wingLeft"; // Name the left wing
    const wingRight = wingLeft.clone();
    wingRight.name = "wingRight"; // Name the right wing

    // Position relative to upright body (sides)
    // Y position ensures they are level with each other relative to the body center.
    const wingYPosition = 0.05 * scale;
    // Increase X offset slightly to ensure wings are outside the body capsule (radius 0.5 * scale)
    wingLeft.position.set(0.55 * scale, wingYPosition, 0); // Left wing (+X side)
    wingRight.position.set(-0.55 * scale, wingYPosition, 0); // Right wing (-X side)

    // Rotate wings to be horizontal and point outwards.
    // Since the wing shape is in the XY plane, rotate around Z axis.
    wingLeft.rotation.z = Math.PI / 2;  // Rotate left wing 90 degrees clockwise
    wingRight.rotation.z = -Math.PI / 2; // Rotate right wing 90 degrees counter-clockwise

    // Ensure other rotations are zero initially
    wingLeft.rotation.x = 0;
    wingLeft.rotation.y = 0;
    wingRight.rotation.x = 0;
    wingRight.rotation.y = 0;


    body.add(wingLeft);
    body.add(wingRight);

    // Legs
    const legLeft = createLeg(scale);
    legLeft.name = "legLeft";
    const legRight = legLeft.clone();
    legRight.name = "legRight";
    // Position relative to upright body (below and slightly apart)
    legLeft.position.set(0.15 * scale, -0.5 * scale, 0); // Left leg
    legRight.position.set(-0.15 * scale, -0.5 * scale, 0); // Right leg
    body.add(legLeft);
    body.add(legRight);

    // Duck should now be naturally oriented with its front along the +Z axis.
    // No final group rotation needed here if movement logic assumes +Z is forward.

    // Add a bounding box helper for debugging collisions
    // const boxHelper = new THREE.BoxHelper(duck, 0xffff00);
    // duck.add(boxHelper); // Add helper to the duck group itself

    // No final group rotation needed now. The duck should be assembled
    // with its visual front naturally pointing along the local +Z axis.

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
