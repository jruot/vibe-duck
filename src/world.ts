import * as THREE from 'three';

// TODO: Replace basic colors with textures loaded from files
// const textureLoader = new THREE.TextureLoader();
// const grassTexture = textureLoader.load('assets/textures/grass.png'); // Example path
// grassTexture.wrapS = THREE.RepeatWrapping;
// grassTexture.wrapT = THREE.RepeatWrapping;
// grassTexture.repeat.set(100, 100);

// const rockTexture = textureLoader.load('assets/textures/rock.png'); // Example path
// const waterTexture = textureLoader.load('assets/textures/water.png'); // Example path
// const nestTexture = textureLoader.load('assets/textures/nest.png'); // Example path


export function createWorld(scene: THREE.Scene) {
    // Grass Ground Plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200); // Large plane
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22, // Forest green
        // map: grassTexture, // TODO: Uncomment when texture is ready
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.receiveShadow = true; // Allow ground to receive shadows
    scene.add(ground);

    // Pond
    const pondGeometry = new THREE.CircleGeometry(15, 32); // Circular pond
    const pondMaterial = new THREE.MeshStandardMaterial({
        color: 0x1E90FF, // Dodger blue
        // map: waterTexture, // TODO: Uncomment when texture is ready
        transparent: true,
        opacity: 0.8
    });
    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-30, 0.01, 20); // Position the pond slightly above ground
    pond.receiveShadow = true;
    scene.add(pond);

    // Rocks
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080, // Grey
        // map: rockTexture, // TODO: Uncomment when texture is ready
    });
    for (let i = 0; i < 20; i++) {
        const rockSize = Math.random() * 2 + 1; // Random size between 1 and 3
        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0); // Simple poly shape
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(
            (Math.random() - 0.5) * 180, // Scatter within the ground plane
            rockSize / 2, // Sit on the ground
            (Math.random() - 0.5) * 180
        );
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;
        // Avoid placing rocks in the pond
        if (rock.position.distanceTo(pond.position) > 15 + rockSize) {
             scene.add(rock);
        } else {
            i--; // Try placing this rock again
        }
    }

    // Nest
    const nestPosition = new THREE.Vector3(10, 0.1, -5); // Define nest position
    const nestGeometry = new THREE.TorusGeometry(2, 0.5, 8, 24);
    const nestMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Saddle brown
        // map: nestTexture, // TODO: Uncomment when texture is ready
    });
    const nest = new THREE.Mesh(nestGeometry, nestMaterial);
    nest.position.copy(nestPosition);
    nest.rotation.x = Math.PI / 2; // Lay flat
    nest.castShadow = true;
    nest.receiveShadow = true;
    scene.add(nest);

    return { nestPosition }; // Return key positions if needed
}
