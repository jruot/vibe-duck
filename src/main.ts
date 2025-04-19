import * as THREE from 'three';
import { setupScene } from './sceneSetup';
import { createWorld } from './world';
import { createFatherDuck, createMotherDuck } from './duck'; // Removed createBabyDuck
import { PlayerController } from './playerController';
import { GameState } from './gameState';
import { BabyDuck } from './babyDuck'; // Import the new BabyDuck class

// Basic Scene Setup
// Destructure canvas from setupScene result
const { scene, camera, renderer, canvas } = setupScene('game-canvas');

// Game State
const gameState = new GameState();

// World Elements
// createWorld now returns Nest, Pond, and collidables list
const { nest, collidables } = createWorld(scene); // Destructure collidables
const nestPosition = nest.position; // Get position from the Nest instance

// Ducks
const fatherDuck = createFatherDuck();
fatherDuck.position.set(0, 0.5, 5); // Initial position
scene.add(fatherDuck);

const motherDuck = createMotherDuck();
// Position mother duck relative to the nest instance's position
motherDuck.position.copy(nestPosition);
motherDuck.position.y = 0.5; // Adjust height relative to ground/nest top
scene.add(motherDuck);

// --- Baby Duckling Setup ---
const babyDucks: BabyDuck[] = []; // Array now holds BabyDuck instances
const totalDucklings = 66; // Use gameState for the canonical count
gameState.setTotalDucklings(totalDucklings); // Initialize total in gameState

for (let i = 0; i < totalDucklings; i++) {
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

    // Create a new BabyDuck instance
    const babyDuck = new BabyDuck(
        scene,
        spawnPos,
        fatherDuck, // Pass father duck reference
        motherDuck, // Pass mother duck reference
        nestPosition,
        gameState,
        collidables // Pass collidables list
    );

    babyDucks.push(babyDuck);
    // No need to add to scene here, the BabyDuck constructor does it
}

// Player Control
// Pass canvas and collidables list to the controller
const playerController = new PlayerController(fatherDuck, camera, canvas, collidables);

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

    // --- Update Baby Ducklings ---
    // Iterate through the BabyDuck instances and call their update method
    babyDucks.forEach((babyDuck) => {
        // Only update ducklings that are not already safe
        if (babyDuck.state !== 'safe') {
            babyDuck.update(deltaTime);
        }
    });

    // Update UI after all duckling updates (in case state changed)
    updateUI();

    // --- Check Win Condition ---
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
