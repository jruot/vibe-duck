import * as THREE from 'three';
import { GameObject } from './gameObject';
import { createBabyDuckModel } from './duck'; // Import the model creation function
import { GameState } from './gameState';

// --- Constants moved from main.ts ---
const DUCKLING_IDLE_WANDER_RADIUS = 5;
const DUCKLING_IDLE_TARGET_CHANGE_MIN_TIME = 2; // seconds
const DUCKLING_IDLE_TARGET_CHANGE_MAX_TIME = 6; // seconds
const DUCKLING_FOLLOW_DISTANCE = 1.5; // How far behind father they follow
const DUCKLING_FOLLOW_SPEED_FACTOR = 1.1; // Speed multiplier when following
const DUCKLING_RETURN_SPEED_FACTOR = 1.0; // Speed multiplier when returning
const FATHER_COLLECTION_RADIUS = 2.0; // How close father needs to be to collect
const NEST_RETURN_RADIUS = 3.5; // How close duckling needs to be to nest to start returning
const NEST_SAFE_RADIUS = 0.5; // How close duckling needs to be to nest center to be safe
const BABY_DUCK_BASE_SPEED = 1.0; // Base speed

// Type definition for baby duck state
export type BabyDuckState = 'idle' | 'following' | 'returning' | 'safe';

export class BabyDuck extends GameObject {
    public state: BabyDuckState;
    private speed: number;
    private targetPosition: THREE.Vector3;
    private changeTargetTimer: number;
    private followTarget: THREE.Object3D | null; // Reference to the object being followed (father duck)

    // References needed for logic
    private scene: THREE.Scene;
    private fatherDuck: THREE.Object3D;
    private nestPosition: THREE.Vector3;
    private gameState: GameState;
    private motherDuck: THREE.Object3D; // Added for looking at mother when safe

    constructor(
        scene: THREE.Scene,
        initialPosition: THREE.Vector3,
        fatherDuck: THREE.Object3D,
        motherDuck: THREE.Object3D, // Pass mother duck reference
        nestPosition: THREE.Vector3,
        gameState: GameState
    ) {
        const model = createBabyDuckModel(); // Create the visual model
        super(model); // Initialize base GameObject with the model

        // Store references
        this.scene = scene;
        this.fatherDuck = fatherDuck;
        this.motherDuck = motherDuck;
        this.nestPosition = nestPosition;
        this.gameState = gameState;

        // Initialize state and properties
        this.state = 'idle';
        this.speed = BABY_DUCK_BASE_SPEED * (0.8 + Math.random() * 0.4); // Slight speed variation
        this.targetPosition = initialPosition.clone();
        this.changeTargetTimer = Math.random() * DUCKLING_IDLE_TARGET_CHANGE_MAX_TIME;
        this.followTarget = null;

        // Set initial position and add to scene
        this.setPosition(initialPosition.x, initialPosition.y, initialPosition.z);
        this.scene.add(this.object3D);
    }

    public update(deltaTime: number): void {
        const effectiveSpeed = this.speed * deltaTime; // Effective speed for this frame

        switch (this.state) {
            case 'idle':
                this.updateIdle(deltaTime, effectiveSpeed);
                break;
            case 'following':
                this.updateFollowing(deltaTime, effectiveSpeed);
                break;
            case 'returning':
                this.updateReturning(deltaTime, effectiveSpeed);
                break;
            case 'safe':
                // Do nothing, stay in the nest. Maybe slight idle animation later.
                break;
        }
    }

    private updateIdle(deltaTime: number, speed: number): void {
        // Check for father duck proximity to start following
        if (this.fatherDuck.position.distanceTo(this.position) < FATHER_COLLECTION_RADIUS) {
            this.startFollowing();
        } else {
            // Simple random wandering
            this.changeTargetTimer -= deltaTime;
            if (this.changeTargetTimer <= 0 || this.position.distanceTo(this.targetPosition) < 0.5) {
                this.setNewIdleTarget();
            }

            // Move towards target
            const direction = this.targetPosition.clone().sub(this.position);
            direction.y = 0; // Keep movement planar
            if (direction.lengthSq() > 0.01) { // Only move if not already close
                direction.normalize();
                this.position.add(direction.clone().multiplyScalar(speed * 0.6)); // Move slower when idle
                this.rotateTowards(direction);
            }
        }
    }

    private setNewIdleTarget(): void {
         // Pick a new target nearby
         this.targetPosition.set(
            this.position.x + (Math.random() - 0.5) * DUCKLING_IDLE_WANDER_RADIUS * 2,
            this.position.y, // Keep current height
            this.position.z + (Math.random() - 0.5) * DUCKLING_IDLE_WANDER_RADIUS * 2
        );
        // Clamp target position within world bounds (approx) - Assuming ground size of 200x200
        this.targetPosition.x = THREE.MathUtils.clamp(this.targetPosition.x, -95, 95);
        this.targetPosition.z = THREE.MathUtils.clamp(this.targetPosition.z, -95, 95);
        // Reset timer
        this.changeTargetTimer = DUCKLING_IDLE_TARGET_CHANGE_MIN_TIME + Math.random() * (DUCKLING_IDLE_TARGET_CHANGE_MAX_TIME - DUCKLING_IDLE_TARGET_CHANGE_MIN_TIME);
    }


    private updateFollowing(deltaTime: number, speed: number): void {
        if (!this.followTarget) { // Safety check
            this.state = 'idle';
            return;
        }
        // Check if near nest
        if (this.position.distanceTo(this.nestPosition) < NEST_RETURN_RADIUS) {
            this.startReturning();
        } else {
            // Move towards father duck, maintaining follow distance
            const targetPos = this.followTarget.position.clone();
            const directionToTarget = targetPos.sub(this.position);
            directionToTarget.y = 0; // Keep planar
            const distance = directionToTarget.length();

            if (distance > DUCKLING_FOLLOW_DISTANCE) {
                directionToTarget.normalize();
                this.position.add(directionToTarget.clone().multiplyScalar(speed * DUCKLING_FOLLOW_SPEED_FACTOR));
                this.rotateTowards(directionToTarget);
            }
            // Optional: Add slight random offset or flocking behavior later
        }
    }

    private updateReturning(deltaTime: number, speed: number): void {
        // Move towards the center of the nest
        const directionToNest = this.targetPosition.clone().sub(this.position); // Target position is nest center
        directionToNest.y = 0; // Stay on ground level

        if (directionToNest.lengthSq() < NEST_SAFE_RADIUS * NEST_SAFE_RADIUS) { // Reached the nest center
            this.setSafe();
        } else {
            directionToNest.normalize();
            this.position.add(directionToNest.clone().multiplyScalar(speed * DUCKLING_RETURN_SPEED_FACTOR));
            this.rotateTowards(directionToNest);
        }
    }

    private startFollowing(): void {
        this.state = 'following';
        this.followTarget = this.fatherDuck; // Set target
        console.log("Duckling started following!");
    }

    private startReturning(): void {
        this.state = 'returning';
        this.followTarget = null; // Stop following father
        this.targetPosition.copy(this.nestPosition); // Set nest as target
        console.log("Duckling returning to nest!");
    }

    private setSafe(): void {
        this.state = 'safe';
        // Place precisely in nest area (optional random offset)
        this.position.set(
            this.nestPosition.x + (Math.random() - 0.5) * 1.5,
            this.position.y, // Keep current y
            this.nestPosition.z + (Math.random() - 0.5) * 1.5
        );
        // Look towards mother duck
        const lookAtPos = this.motherDuck.position.clone();
        lookAtPos.y = this.position.y; // Look horizontally
        this.object3D.lookAt(lookAtPos);

        this.gameState.foundDuckling(); // Increment score HERE
        // updateUI() needs to be called from main loop after all updates
        console.log(`Duckling safe! ${this.gameState.ducklingsFound}/${this.gameState.totalDucklingsCount}`);
    }

    private rotateTowards(direction: THREE.Vector3): void {
        if (direction.lengthSq() > 0.001) { // Avoid issues with zero vector
            // Model's front is along its local +Z axis.
            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
            // Use slerp for smooth rotation
            this.quaternion.slerp(targetQuaternion, 0.1); // Adjust the factor (0.1) for rotation speed
        }
    }

    // Override dispose to remove from scene
    public dispose(): void {
        super.dispose(this.scene); // Call base dispose
        // Add any BabyDuck specific cleanup if needed
    }
}
