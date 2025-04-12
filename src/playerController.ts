import * as THREE from 'three';

export class PlayerController {
    private playerObject: THREE.Object3D;
    private camera: THREE.PerspectiveCamera;
    private moveSpeed: number = 5.0; // Units per second
    private turnSpeed: number = Math.PI; // Radians per second
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private rotationVelocity: number = 0;
    private verticalVelocity: number = 0; // For jumping/flying
    private gravity: number = -9.8 * 2; // Adjusted gravity
    private jumpStrength: number = 6.0;
    // private isJumping: boolean = false; // Removed as it was unused
    private isFlying: boolean = false; // State for wing animation
    private flyTimer: number = 0;
    private flyDuration: number = 0.3; // How long the flap animation lasts

    // Add references to wings if needed for animation
    private wingLeft?: THREE.Object3D;
    private wingRight?: THREE.Object3D;

    private moveState = {
        forward: 0, // -1 for backward, 1 for forward
        turn: 0,    // -1 for left, 1 for right
        jump: false // Add jump state
    };

    private thirdPersonOffset = new THREE.Vector3(0, 4, -8); // Camera offset from player

    constructor(playerObject: THREE.Object3D, camera: THREE.PerspectiveCamera) {
        this.playerObject = playerObject;
        this.camera = camera;
        // Find wings for animation
        const body = this.playerObject.getObjectByName('body'); // Find body by name
        if (body) {
             this.wingLeft = body.getObjectByName('wingLeft');
             this.wingRight = body.getObjectByName('wingRight');
             if (!this.wingLeft || !this.wingRight) {
                 console.warn("Could not find wing objects by name for animation.");
             }
        } else {
            console.warn("Could not find body object by name.");
        }
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
            case 'Space':
                // Allow jump attempt even if already in air, but only trigger if on ground later
                this.moveState.jump = true;
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
                // Ensure we only stop turning right if we *were* turning right
                if (this.moveState.turn < 0) this.moveState.turn = 0;
                break;
             case 'Space':
                this.moveState.jump = false; // Reset jump flag on key up
                break;
        }
    }

    public update(deltaTime: number) {
        const groundY = 0.5; // Define ground level Y
        const onGround = this.playerObject.position.y <= groundY + 0.01; // Check if player is on the ground (add small tolerance)

        // --- Jumping / Vertical Movement ---
        if (onGround) {
            this.verticalVelocity = 0; // Reset vertical velocity when on ground
            // this.isJumping = false; // Removed
            if (this.moveState.jump) {
                this.verticalVelocity = this.jumpStrength; // Apply jump force
                // this.isJumping = true; // Removed
                this.isFlying = true; // Start wing flap animation
                this.flyTimer = this.flyDuration;
                // this.moveState.jump = false; // Consume jump input immediately? Or on keyup? Keyup is better.
            }
        } else {
            // Apply gravity
            this.verticalVelocity += this.gravity * deltaTime;
        }

        // Apply vertical movement
        this.playerObject.position.y += this.verticalVelocity * deltaTime;

        // Prevent falling through the floor
        if (this.playerObject.position.y < groundY) {
            this.playerObject.position.y = groundY;
            this.verticalVelocity = 0; // Stop falling
            // this.isJumping = false; // Removed
        }


        // --- Rotation ---
        this.rotationVelocity = this.moveState.turn * this.turnSpeed;
        this.playerObject.rotateY(this.rotationVelocity * deltaTime);

        // --- Planar Movement ---
        const forwardDirection = new THREE.Vector3();
        this.playerObject.getWorldDirection(forwardDirection);
        // Use only X and Z for planar movement, normalize to prevent faster diagonal speed
        forwardDirection.y = 0;
        forwardDirection.normalize();

        this.velocity.copy(forwardDirection).multiplyScalar(this.moveState.forward * this.moveSpeed);

        // Apply planar movement
        this.playerObject.position.add(this.velocity.clone().multiplyScalar(deltaTime));


        // --- Wing Animation ---
        if (this.isFlying) {
            this.flyTimer -= deltaTime;
            // Simple flap up/down based on sine wave mapped to duration
            const flapProgress = (this.flyDuration - this.flyTimer) / this.flyDuration;
            const flapAngle = Math.sin(flapProgress * Math.PI) * (Math.PI / 3); // Angle of flap (adjust amplitude)

            // Determine the correct axis for flapping based on wing orientation
            // Wings are created from a Shape in XY plane, extruded along Z.
            // They are added to the body and slightly rotated around Y.
            // Flapping up/down should correspond to rotation around the wing's local Z-axis
            // after the initial Y and Z rotations applied during creation.
            const flapAxis = 'z';

            // Adjust flap angle based on initial wing rotation to make it flap "up/down" correctly
            // Left wing initial rotation.z is -PI/8, Right is +PI/8
            // We add the flap angle to this base rotation.
            const baseAngleLeft = -Math.PI / 8;
            const baseAngleRight = Math.PI / 8;

            if (this.wingLeft) this.wingLeft.rotation[flapAxis] = baseAngleLeft + flapAngle;
            if (this.wingRight) this.wingRight.rotation[flapAxis] = baseAngleRight - flapAngle; // Opposite flap direction

            if (this.flyTimer <= 0) {
                this.isFlying = false;
                 // Reset wing position smoothly? Or snap back? Snap for now.
                 // Ensure we reset the correct axis back to its base angle.
                const resetAxis = 'z'; // Should match flapAxis
                const baseAngleLeft = -Math.PI / 8; // Base rotation from duck creation
                const baseAngleRight = Math.PI / 8; // Base rotation from duck creation
                if (this.wingLeft) this.wingLeft.rotation[resetAxis] = baseAngleLeft; // Reset to base angle
                if (this.wingRight) this.wingRight.rotation[resetAxis] = baseAngleRight; // Reset to base angle
            }
        }


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
