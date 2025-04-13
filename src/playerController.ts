import * as THREE from 'three';

// Interface for tracking movement states
interface MoveState {
    forward: boolean;
    backward: boolean;
    strafeLeft: boolean;
    strafeRight: boolean;
    jump: boolean;
    mouseLeftDown: boolean; // Track left mouse button state
}

export class PlayerController {
    private playerObject: THREE.Object3D;
    private camera: THREE.PerspectiveCamera;
    private canvas: HTMLCanvasElement; // Add canvas reference
    private moveSpeed: number = 5.0; // Units per second
    // private turnSpeed: number = Math.PI; // Radians per second - Turning is now mouse/movement driven
    private velocity: THREE.Vector3 = new THREE.Vector3();
    // private rotationVelocity: number = 0; // Rotation is handled differently now
    private verticalVelocity: number = 0; // For jumping/flying
    private gravity: number = -9.8 * 2; // Adjusted gravity
    private jumpStrength: number = 6.0;
    // private isJumping: boolean = false; // Track jump state - Can rely on verticalVelocity
    private isFlying: boolean = false; // State for wing animation
    private flyTimer: number = 0;
    private flyDuration: number = 0.3; // How long the flap animation lasts


    // Camera control properties
    private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 3, 7); // Initial offset from player (behind, up)
    private cameraTarget: THREE.Vector3 = new THREE.Vector3(); // Point camera looks at
    private cameraYaw: number = 0; // Horizontal rotation around player (radians)
    private cameraPitch: number = Math.PI / 8; // Vertical rotation (radians), slightly looking down
    private minPitch: number = -Math.PI / 4; // Limit looking up
    private maxPitch: number = Math.PI / 2 - 0.1; // Limit looking down
    private mouseSensitivity: number = 0.002;

    // Add references to wings if needed for animation
    private wingLeft?: THREE.Object3D;
    private wingRight?: THREE.Object3D;

    private moveState: MoveState = {
        forward: false,
        backward: false,
        strafeLeft: false,
        strafeRight: false,
        jump: false,
        mouseLeftDown: false,
    };

    // Target rotation for smooth turning
    private targetQuaternion: THREE.Quaternion = new THREE.Quaternion();
    private rotationSpeed: number = Math.PI * 2; // Radians per second for smoothing player rotation

    constructor(playerObject: THREE.Object3D, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
        this.playerObject = playerObject;
        this.camera = camera;
        this.canvas = canvas; // Store canvas reference
        // Initialize target quaternion to player's current rotation
        this.targetQuaternion.copy(this.playerObject.quaternion);
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
        // Keyboard
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        // Mouse
        window.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        // Pointer Lock
        document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this), false);
    }

    private handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveState.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveState.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveState.strafeLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveState.strafeRight = true;
                break;
            case 'Space':
                this.moveState.jump = true; // Set jump flag, handled in update
                break;
        }
    }

    private handleKeyUp(event: KeyboardEvent) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveState.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveState.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveState.strafeLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveState.strafeRight = false;
                break;
            case 'Space':
                // Jump is momentary, reset happens in update after applying force
                // this.moveState.jump = false; // Don't reset here
                break;
        }
    }

    private handleMouseDown(event: MouseEvent) {
        // Use right mouse button (button index 2) for camera control/pointer lock
        if (event.button === 2) {
            this.moveState.mouseLeftDown = true; // Keep using this state variable name for simplicity
            // Request pointer lock on the canvas element
            this.canvas.requestPointerLock();
        }
    }

    private handleMouseUp(event: MouseEvent) {
        // Use right mouse button (button index 2)
        if (event.button === 2) {
            this.moveState.mouseLeftDown = false; // Keep using this state variable name
            // Exit pointer lock when right mouse is released
            document.exitPointerLock();
        }
    }

    private handleMouseMove(event: MouseEvent) {
        // Only adjust camera if pointer is locked to the canvas
        if (document.pointerLockElement === this.canvas) {
            this.cameraYaw -= event.movementX * this.mouseSensitivity;
            // Invert vertical mouse look by adding movementY instead of subtracting
            this.cameraPitch += event.movementY * this.mouseSensitivity;
            // Clamp pitch to avoid flipping over
            this.cameraPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.cameraPitch));
        }
    }

     private handlePointerLockChange() {
        // Check if pointer lock is no longer on the canvas
        if (document.pointerLockElement !== this.canvas) {
            // If pointer lock is lost unexpectedly (e.g., pressing Esc or releasing right button),
            // ensure mouse state is updated.
            this.moveState.mouseLeftDown = false;
        }
    }


    public update(deltaTime: number) {
        const groundY = 0.5; // Define ground level Y
        const onGround = this.playerObject.position.y <= groundY + 0.01; // Check if player is on the ground

        // --- Calculate Input Direction (Relative to Camera) ---
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        const flatCameraDirection = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
        // Calculate right vector based on flat camera direction and world up vector
        const cameraRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), flatCameraDirection).normalize();

        const inputVector = new THREE.Vector3();
        if (this.moveState.forward) inputVector.add(flatCameraDirection);
        if (this.moveState.backward) inputVector.sub(flatCameraDirection);
        // Swap strafe direction: Add right for left strafe, subtract for right strafe
        if (this.moveState.strafeLeft) inputVector.add(cameraRight);
        if (this.moveState.strafeRight) inputVector.sub(cameraRight);

        const isMoving = inputVector.lengthSq() > 0.01; // Check if there's movement input

        // --- Player Rotation ---
        // Rotate player to align with camera's forward direction when moving forward or backward (W/S)
        if (this.moveState.forward || this.moveState.backward) {
            // Target direction is always the camera's flat forward direction
            const targetAngle = Math.atan2(flatCameraDirection.x, flatCameraDirection.z);
            this.targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);

            // Smoothly rotate player towards the target camera direction
            this.playerObject.quaternion.rotateTowards(this.targetQuaternion, this.rotationSpeed * deltaTime);
        }
        // Note: If only strafing (A/D), the player's rotation is not forced by movement keys,
        // allowing free look with the mouse without the body snapping.


        // --- Velocity Calculation ---
        if (isMoving) {
            inputVector.normalize(); // Ensure consistent speed regardless of diagonal movement
            this.velocity.x = inputVector.x * this.moveSpeed;
            this.velocity.z = inputVector.z * this.moveSpeed;
        } else {
            // Apply damping/friction if desired, or just stop
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        // --- Jumping / Vertical Movement ---
        if (onGround) {
            this.verticalVelocity = 0;
            if (this.moveState.jump) {
                this.verticalVelocity = this.jumpStrength;
                this.moveState.jump = false; // Consume jump input only when successfully applied
                this.isFlying = true; // Start wing flap animation on jump
                this.flyTimer = this.flyDuration;
            }
        } else {
            this.verticalVelocity += this.gravity * deltaTime;
        }
        this.velocity.y = this.verticalVelocity;

        // --- Apply Movement ---
        this.playerObject.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // --- Ground Collision ---
        if (this.playerObject.position.y < groundY) {
            this.playerObject.position.y = groundY;
            this.verticalVelocity = 0;
        }

        // --- Wing Animation ---
        // Continue flapping if the timer is active (from jump)
        if (this.isFlying) {
             this.flyTimer -= deltaTime;
             const flapProgress = (this.flyDuration - this.flyTimer) / this.flyDuration;
             const flapAngle = Math.sin(flapProgress * Math.PI) * (Math.PI / 3); // Angle of flap
             const flapAxis = 'x'; // Flap around local X axis
             if (this.wingLeft) this.wingLeft.rotation[flapAxis] = flapAngle;
             if (this.wingRight) this.wingRight.rotation[flapAxis] = flapAngle;

             if (this.flyTimer <= 0) {
                 this.isFlying = false;
                 // Reset wings
                 const resetAxis = 'x';
                 const baseAngle = 0;
                 if (this.wingLeft) this.wingLeft.rotation[resetAxis] = baseAngle;
                 if (this.wingRight) this.wingRight.rotation[resetAxis] = baseAngle;
             }
        }


        // --- Camera Update ---
        // Calculate desired camera position based on yaw, pitch, and offset
        const cameraOffsetRotated = this.cameraOffset.clone();
        const spherical = new THREE.Spherical().setFromVector3(cameraOffsetRotated);
        spherical.theta = this.cameraYaw; // Horizontal angle based on mouse movement
        spherical.phi = Math.PI / 2 - this.cameraPitch; // Vertical angle based on mouse movement
        spherical.makeSafe(); // Ensure phi is within valid range
        cameraOffsetRotated.setFromSpherical(spherical);

        const desiredCameraPosition = this.playerObject.position.clone().add(cameraOffsetRotated);

        // Set camera position (can add smoothing later if needed)
        this.camera.position.copy(desiredCameraPosition);

        // Set camera target (look at player's head area)
        this.cameraTarget.copy(this.playerObject.position).add(new THREE.Vector3(0, 1.0, 0)); // Look slightly above base
        this.camera.lookAt(this.cameraTarget);
    }

    // Cleanup listeners if the controller is destroyed
    public dispose() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
        // Ensure pointer lock is exited if the controller is disposed while active on the canvas
        if (document.pointerLockElement === this.canvas) {
            document.exitPointerLock();
        }
    }
}
