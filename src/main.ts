import * as THREE from 'three';
import { setupScene } from './sceneSetup';
import { createWorld } from './world';
import { createFatherDuck, createMotherDuck, createBabyDuck } from './duck';
import { PlayerController } from './playerController';
import { GameState } from './gameState';

// Basic Scene Setup
const { scene, camera, renderer } = setupScene('game-canvas');

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

const babyDucks: THREE.Group[] = [];
const totalDucklings = 66;
for (let i = 0; i < totalDucklings; i++) {
    const babyDuck = createBabyDuck();
    // Scatter ducklings randomly - replace with better logic later
    babyDuck.position.set(
        (Math.random() - 0.5) * 50,
        0.25,
        (Math.random() - 0.5) * 50
    );
    // Avoid placing near nest initially
    if (babyDuck.position.distanceTo(nestPosition) < 5) {
        babyDuck.position.x += 10 * Math.sign(babyDuck.position.x || 1);
        babyDuck.position.z += 10 * Math.sign(babyDuck.position.z || 1);
    }

    scene.add(babyDuck);
    babyDucks.push(babyDuck);
}

// Player Control
const playerController = new PlayerController(fatherDuck, camera);

// UI Update
const ducklingCountElement = document.getElementById('duckling-count');
function updateUI() {
    if (ducklingCountElement) {
        ducklingCountElement.textContent = `${gameState.ducklingsFound}`;
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

    // Simple collision detection and collection logic (placeholder)
    const collectionRadius = 1.5;
    for (let i = babyDucks.length - 1; i >= 0; i--) {
        const babyDuck = babyDucks[i];
        if (fatherDuck.position.distanceTo(babyDuck.position) < collectionRadius) {
            // TODO: Implement "following" behavior instead of immediate removal
            scene.remove(babyDuck);
            babyDucks.splice(i, 1);
            gameState.foundDuckling();
            updateUI();
            console.log(`Found a duckling! ${gameState.ducklingsFound}/${totalDucklings}`);

            // TODO: Check if duckling is brought back to nest
        }
    }

    // Check win condition
    if (gameState.ducklingsFound === totalDucklings) {
        // TODO: Add a proper win screen/message
        console.log("You found all the ducklings!");
        // Potentially stop the game loop or show a message
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
