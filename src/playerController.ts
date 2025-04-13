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
    private airborneJumpCount: number = 0; // Counter for consecutive jumps in the air
    private readonly maxAirborneJumps: number = 10; // Limit for airborne jumps
    private readonly glideGravityFactor: number = 0.2; // Factor to reduce gravity when gliding (e.g., 20% of normal gravity)


    // Camera control properties
    // private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 3, 7); // Removed: Initial offset from player (behind, up) - Now calculated dynamically
    private cameraTarget: THREE.Vector3 = new THREE.Vector3(); // Point camera looks at
    private cameraYaw: number = 0; // Horizontal rotation around player (radians)
    private cameraPitch: number = Math.PI / 8; // Vertical rotation (radians), slightly looking down
    private minPitch: number = -Math.PI / 4; // Limit looking up
    private maxPitch: number = Math.PI / 2 - 0.1; // Limit looking down
    private mouseSensitivity: number = 0.002;
    private cameraDistance: number = 7.0; // Current distance from player
    private minCameraDistance: number = 2.0; // Closest zoom
    private maxCameraDistance: number = 15.0; // Furthest zoom
    private zoomSpeed: number = 0.5; // How much distance changes per scroll unit

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
        // Mouse Wheel for Zoom
        window.addEventListener('wheel', this.handleMouseWheel.bind(this), { passive: false }); // Use non-passive to allow preventDefault
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
        // Use left mouse button (button index 0) for camera control/pointer lock
        if (event.button === 0) {
            this.moveState.mouseLeftDown = true; // State variable indicates mouse is down for control
            // Request pointer lock on the canvas element
            this.canvas.requestPointerLock();
        }
    }

    private handleMouseUp(event: MouseEvent) {
        // Use left mouse button (button index 0)
        if (event.button === 0) {
            this.moveState.mouseLeftDown = false; // Reset state variable
            // Exit pointer lock when left mouse is released
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

    private handleMouseWheel(event: WheelEvent) {
        // Prevent the default page scroll behavior
        event.preventDefault();

        // Adjust camera distance based on scroll direction (deltaY)
        const zoomAmount = event.deltaY * 0.01 * this.zoomSpeed; // Scale deltaY and apply speed
        this.cameraDistance += zoomAmount;

        // Clamp the distance within min/max limits
        this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance, this.minCameraDistance, this.maxCameraDistance);
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
            this.airborneJumpCount = 0; // Reset jump counter when on ground
            this.verticalVelocity = 0; // Reset vertical velocity only if truly grounded before jump check
        }

        // Check for jump input
        if (this.moveState.jump) {
            // Allow jump if on ground OR if airborne jumps are below the limit
            if (onGround || this.airborneJumpCount < this.maxAirborneJumps) {
                this.verticalVelocity = this.jumpStrength; // Apply jump/flap force
                this.isFlying = true; // Start wing flap animation
                this.flyTimer = this.flyDuration;

                if (!onGround) {
                    this.airborneJumpCount++; // Increment counter only if jumping while airborne
                }
            }
            this.moveState.jump = false; // Consume jump input regardless of success
        }

        // Apply gravity logic
        if (!onGround) {
            let currentGravity = this.gravity;
            // If airborne AND not actively flapping (timer ran out), apply glide gravity
            if (!this.isFlying && this.verticalVelocity <= 0) { // Only glide when falling or stationary vertically
                currentGravity *= this.glideGravityFactor;
            }
            this.verticalVelocity += currentGravity * deltaTime;
        } else if (this.verticalVelocity > 0) {
            // Apply normal gravity if moving upwards even when technically on ground (e.g. start of jump)
             this.verticalVelocity += this.gravity * deltaTime;
        }


        this.velocity.y = this.verticalVelocity;

        // --- Apply Movement ---
        this.playerObject.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // --- Ground Collision ---
        if (this.playerObject.position.y < groundY) {
            this.playerObject.position.y = groundY;
            // Don't reset vertical velocity here if a jump was just initiated
            if (!this.isFlying) { // Only stop velocity if not actively flapping/jumping upwards
                 this.verticalVelocity = 0;
            }
            this.airborneJumpCount = 0; // Ensure counter is reset on landing
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
        // Calculate camera direction based on yaw and pitch
        const cameraDirectionOffset = new THREE.Vector3(0, 0, 1); // Start with base direction
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(cameraDirectionOffset); // Set initial vector
        spherical.theta = this.cameraYaw; // Apply horizontal rotation (yaw)
        spherical.phi = Math.PI / 2 - this.cameraPitch; // Apply vertical rotation (pitch)
        spherical.makeSafe(); // Ensure phi is valid

        // Convert spherical coordinates back to a direction vector
        cameraDirectionOffset.setFromSpherical(spherical);

        // Scale the direction vector by the current camera distance
        const finalOffset = cameraDirectionOffset.multiplyScalar(this.cameraDistance);

        // Calculate desired camera position: player position + final offset
        const desiredCameraPosition = this.playerObject.position.clone().add(finalOffset);

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
        window.removeEventListener('wheel', this.handleMouseWheel); // Remove wheel listener
        document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
        // Ensure pointer lock is exited if the controller is disposed while active on the canvas
        if (document.pointerLockElement === this.canvas) {
            document.exitPointerLock();
        }
    }
}
