import * as THREE from 'three';
import { setupScene } from './sceneSetup';
import { createWorld } from './world';
import { createFatherDuck, createMotherDuck, createBabyDuck } from './duck';
import { PlayerController } from './playerController';
import { GameState } from './gameState';

// Basic Scene Setup
// Destructure canvas from setupScene result
const { scene, camera, renderer, canvas } = setupScene('game-canvas');

// Game State
const gameState = new GameState();

// World Elements
const { nestPosition } = createWorld(scene);

// Ducks
const fatherDuck = createFatherDuck();
fatherDuck.position.set(0, 0.5, 5); // Initial position
scene.add(fatherDuck);

const motherDuck = createMotherDuck();
motherDuck.position.copy(nestPosition);
motherDuck.position.y = 0.5; // Adjust height based on nest
scene.add(motherDuck);

// Define constants for duckling behavior
const DUCKLING_IDLE_WANDER_RADIUS = 5;
const DUCKLING_IDLE_TARGET_CHANGE_MIN_TIME = 2; // seconds
const DUCKLING_IDLE_TARGET_CHANGE_MAX_TIME = 6; // seconds
const DUCKLING_FOLLOW_DISTANCE = 1.5; // How far behind father they follow
const DUCKLING_FOLLOW_SPEED_FACTOR = 1.1; // Slightly faster than father when catching up? Or same speed?
const DUCKLING_RETURN_SPEED_FACTOR = 1.0;
const FATHER_COLLECTION_RADIUS = 2.0; // How close father needs to be to collect
const NEST_RETURN_RADIUS = 3.5; // How close duckling needs to be to nest to start returning
const NEST_SAFE_RADIUS = 0.5; // How close duckling needs to be to nest center to be safe

// Type definition for baby duck user data
type BabyDuckState = 'idle' | 'following' | 'returning' | 'safe';
interface BabyDuckUserData {
    state: BabyDuckState;
    speed: number;
    targetPosition: THREE.Vector3;
    changeTargetTimer: number;
    followTarget: THREE.Object3D | null; // Reference to the object being followed (father duck)
}


const babyDucks: THREE.Group[] = [];
const totalDucklings = 66;
const babyDuckBaseSpeed = 1.0; // Base speed, can be adjusted

for (let i = 0; i < totalDucklings; i++) {
    const babyDuck = createBabyDuck();

    // Add user data for state management
    babyDuck.userData = {
        state: 'idle',
        speed: babyDuckBaseSpeed * (0.8 + Math.random() * 0.4), // Slight speed variation
        targetPosition: new THREE.Vector3(),
        changeTargetTimer: Math.random() * DUCKLING_IDLE_TARGET_CHANGE_MAX_TIME,
        followTarget: null,
    } as BabyDuckUserData; // Type assertion

    // Scatter ducklings randomly
    const spawnRadius = 80; // How far out ducklings can spawn
    const minSpawnDistFromNest = 10; // Don't spawn too close to nest
    let spawnPos: THREE.Vector3;
    do {
        spawnPos = new THREE.Vector3(
            (Math.random() - 0.5) * spawnRadius * 2,
            0.25, // Baby duck ground height
            (Math.random() - 0.5) * spawnRadius * 2
        );
    } while (spawnPos.distanceTo(nestPosition) < minSpawnDistFromNest);

    babyDuck.position.copy(spawnPos);
    babyDuck.userData.targetPosition.copy(spawnPos); // Initial target is current position

    // Avoid placing near nest initially (redundant with check above, but keep for safety)
    // if (babyDuck.position.distanceTo(nestPosition) < 5) {
    //     babyDuck.position.x += 10 * Math.sign(babyDuck.position.x || 1);
    //     babyDuck.position.z += 10 * Math.sign(babyDuck.position.z || 1);
    // }
    // Removed erroneous lines causing syntax error here

    scene.add(babyDuck);
    babyDucks.push(babyDuck);
}

// Player Control
// Pass the canvas element to the controller
const playerController = new PlayerController(fatherDuck, camera, canvas);

// UI Update
const ducklingCountElement = document.getElementById('duckling-count');
function updateUI() {
    if (ducklingCountElement) {
        // Update text content to show found / total
        ducklingCountElement.textContent = `${gameState.ducklingsFound} / ${gameState.totalDucklingsCount}`;
    }
}
updateUI(); // Initial UI update

// Game Loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    // Update player movement
    playerController.update(deltaTime);

    // --- Baby Duckling Update Logic ---
    babyDucks.forEach((babyDuck) => {
        const data = babyDuck.userData as BabyDuckUserData;
        const speed = data.speed * deltaTime; // Effective speed for this frame

        switch (data.state) {
            case 'idle':
                // Check for father duck proximity to start following
                if (fatherDuck.position.distanceTo(babyDuck.position) < FATHER_COLLECTION_RADIUS) {
                    data.state = 'following';
                    data.followTarget = fatherDuck; // Set target
                    console.log("Duckling started following!");
                } else {
                    // Simple random wandering
                    data.changeTargetTimer -= deltaTime;
                    if (data.changeTargetTimer <= 0 || babyDuck.position.distanceTo(data.targetPosition) < 0.5) {
                        // Pick a new target nearby
                        data.targetPosition.set(
                            babyDuck.position.x + (Math.random() - 0.5) * DUCKLING_IDLE_WANDER_RADIUS * 2,
                            babyDuck.position.y,
                            babyDuck.position.z + (Math.random() - 0.5) * DUCKLING_IDLE_WANDER_RADIUS * 2
                        );
                        // Clamp target position within world bounds (approx)
                        data.targetPosition.x = THREE.MathUtils.clamp(data.targetPosition.x, -95, 95);
                        data.targetPosition.z = THREE.MathUtils.clamp(data.targetPosition.z, -95, 95);
                        // Reset timer
                        data.changeTargetTimer = DUCKLING_IDLE_TARGET_CHANGE_MIN_TIME + Math.random() * (DUCKLING_IDLE_TARGET_CHANGE_MAX_TIME - DUCKLING_IDLE_TARGET_CHANGE_MIN_TIME);
                    }

                    // Move towards target
                    const direction = data.targetPosition.clone().sub(babyDuck.position);
                    direction.y = 0; // Keep movement planar
                    if (direction.lengthSq() > 0.1) { // Only move if not already close
                        direction.normalize();
                        babyDuck.position.add(direction.clone().multiplyScalar(speed * 0.6)); // Move slower when idle
                        // Make duck face the direction it's moving (smoothly?)
                        // Model's front is now along its local +Z axis.
                        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
                        babyDuck.quaternion.slerp(targetQuaternion, 0.1); // Smooth rotation
                        // babyDuck.lookAt(babyDuck.position.clone().add(direction)); // Instant lookAt
                    }
                }
                break;

            case 'following':
                if (!data.followTarget) { // Should not happen, but safety check
                    data.state = 'idle';
                    break;
                }
                // Check if near nest
                if (babyDuck.position.distanceTo(nestPosition) < NEST_RETURN_RADIUS) {
                    data.state = 'returning';
                    data.followTarget = null; // Stop following father
                    data.targetPosition.copy(nestPosition); // Set nest as target
                    console.log("Duckling returning to nest!");
                } else {
                    // Move towards father duck, maintaining follow distance
                    const targetPos = data.followTarget.position.clone();
                    const directionToTarget = targetPos.sub(babyDuck.position);
                    directionToTarget.y = 0; // Keep planar
                    const distance = directionToTarget.length();

                    if (distance > DUCKLING_FOLLOW_DISTANCE) {
                        directionToTarget.normalize();
                        babyDuck.position.add(directionToTarget.clone().multiplyScalar(speed * DUCKLING_FOLLOW_SPEED_FACTOR));
                        // Look towards father (smoothly)
                        // Model's front is now along its local +Z axis.
                        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), directionToTarget);
                        babyDuck.quaternion.slerp(targetQuaternion, 0.1);
                        // babyDuck.lookAt(data.followTarget.position); // Instant lookAt
                    }
                    // Optional: Add slight random offset or flocking behavior later
                }
                break;

            case 'returning':
                // Move towards the center of the nest
                const directionToNest = data.targetPosition.clone().sub(babyDuck.position);
                directionToNest.y = 0; // Stay on ground level

                if (directionToNest.lengthSq() < NEST_SAFE_RADIUS * NEST_SAFE_RADIUS) { // Reached the nest center
                    data.state = 'safe';
                    // Place precisely in nest area (optional random offset)
                    babyDuck.position.set(
                        nestPosition.x + (Math.random() - 0.5) * 1.5,
                        babyDuck.position.y, // Keep current y
                        nestPosition.z + (Math.random() - 0.5) * 1.5
                    );
                    babyDuck.lookAt(motherDuck.position); // Look towards mother
                    gameState.foundDuckling(); // Increment score HERE
                    updateUI();
                    console.log(`Duckling safe! ${gameState.ducklingsFound}/${totalDucklings}`);
                } else {
                    directionToNest.normalize();
                    babyDuck.position.add(directionToNest.clone().multiplyScalar(speed * DUCKLING_RETURN_SPEED_FACTOR));
                     // Look towards nest (smoothly)
                     // Model's front is now along its local +Z axis.
                    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), directionToNest);
                    babyDuck.quaternion.slerp(targetQuaternion, 0.1);
                    // babyDuck.lookAt(data.targetPosition); // Instant lookAt
                }
                break;

            case 'safe':
                // Do nothing, stay in the nest. Maybe slight idle animation later.
                break;
        }
    });


    // Check win condition
    if (gameState.allDucklingsFound) {
        const winMessageElement = document.getElementById('win-message');
        if (winMessageElement && winMessageElement.style.display === 'none') {
            winMessageElement.style.display = 'block';
            console.log("You found all the ducklings!");
            // Optionally disable player controls or stop animation updates here
            // playerController.dispose(); // Example: remove listeners
        }
    }


    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Start the game loop
animate();
