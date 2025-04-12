import * as THREE from 'three';

export class PlayerController {
    private playerObject: THREE.Object3D;
    private camera: THREE.PerspectiveCamera;
    private moveSpeed: number = 5.0; // Units per second
    private turnSpeed: number = Math.PI; // Radians per second
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private rotationVelocity: number = 0;

    private moveState = {
        forward: 0, // -1 for backward, 1 for forward
        turn: 0,    // -1 for left, 1 for right
    };

    private thirdPersonOffset = new THREE.Vector3(0, 4, -8); // Camera offset from player

    constructor(playerObject: THREE.Object3D, camera: THREE.PerspectiveCamera) {
        this.playerObject = playerObject;
        this.camera = camera;
        this.setupInputListeners();
    }

    private setupInputListeners() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    private handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveState.forward = 1;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveState.forward = -1;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveState.turn = 1;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveState.turn = -1;
                break;
        }
    }

    private handleKeyUp(event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this.moveState.forward > 0) this.moveState.forward = 0;
                break;
            case 'ArrowDown':
            case 'KeyS':
                 if (this.moveState.forward < 0) this.moveState.forward = 0;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                 if (this.moveState.turn > 0) this.moveState.turn = 0;
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (this.moveState.turn < 0) this.moveState.turn = 0;
                break;
        }
    }

    public update(deltaTime: number) {
        // --- Rotation ---
        this.rotationVelocity = this.moveState.turn * this.turnSpeed;
        this.playerObject.rotateY(this.rotationVelocity * deltaTime);

        // --- Movement ---
        const forwardDirection = new THREE.Vector3();
        this.playerObject.getWorldDirection(forwardDirection);
        // Use only X and Z for planar movement, normalize to prevent faster diagonal speed
        forwardDirection.y = 0;
        forwardDirection.normalize();

        this.velocity.copy(forwardDirection).multiplyScalar(this.moveState.forward * this.moveSpeed);

        // Apply movement
        this.playerObject.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // --- Camera Update (Third-Person) ---
        // Calculate desired camera position based on player's rotation and offset
        const cameraOffsetRotated = this.thirdPersonOffset.clone().applyQuaternion(this.playerObject.quaternion);
        const desiredCameraPosition = this.playerObject.position.clone().add(cameraOffsetRotated);

        // Smoothly interpolate camera position (lerp)
        this.camera.position.lerp(desiredCameraPosition, 0.1); // Adjust lerp factor for smoothness

        // Make camera look at the player's approximate head position
        const lookAtPosition = this.playerObject.position.clone().add(new THREE.Vector3(0, 1.0, 0)); // Look slightly above the base
        this.camera.lookAt(lookAtPosition);
    }

    // Cleanup listeners if the controller is destroyed
    public dispose() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}
