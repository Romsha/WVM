import * as THREE from 'three'
import { PointerLockControls } from '../node_modules/three/examples/jsm/controls/PointerLockControls'


// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    firstPersonHeight: 10,
    friction: 10,
    acceleration: 500,
    collisionDistance: 3,
    minMovingSpeed: 0.001,
    wallsHeight: 20,
    wallsThickness: 1
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

/**
 * Scene
 */
// Init
const scene = new THREE.Scene()
scene.background = new THREE.Color( 0x0000aa );
scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

const axesHelper = new THREE.AxesHelper( 50 );
scene.add( axesHelper );

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 1000)
camera.position.y = sizes.firstPersonHeight
camera.lookAt(new THREE.Vector3(1, 10, 0))
scene.add(camera)

/**
 * Controls
 */
// mouse
const controls = new PointerLockControls( camera, document.body );
document.querySelector('body').addEventListener('click', () => {
    controls.lock();
})
scene.add(controls.getObject())


// Keys Controll
let moveForward = false;
let moveBackward = false;
let moveRight = false;
let moveLeft = false;

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;

    }
})
document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;

    }
})

/**
 * Objects
 */

// Floor
const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 200, 200)
const floorMaterial = new THREE.MeshBasicMaterial({color: 0xeeeeee})
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floorGeometry.rotateX( - Math.PI / 2);
scene.add(floor)

// Walls
const wallsConfig = [
    {z: 20, x: 35, rotation: 0, length: 70},
    {z: 90, x: 35, rotation: 0, length: 70},
    {z: 10, x: 70, rotation: Math.PI / 2, length: 20},
    {z: 0, x: 120, rotation: 0, length: 100},
    {z: 85, x: 170, rotation: Math.PI / 2, length: 170},
    {z: 170, x: 120, rotation: 0, length: 100},
    {z: 130, x: 70, rotation: Math.PI / 2, length: 80},
]
const wallMaterial = new THREE.MeshBasicMaterial({color: 0xcccccc});
const wallMeshes = []
for (const wall of wallsConfig) {
    const geomery = new THREE.BoxGeometry(wall.length, sizes.wallsHeight, sizes.wallsThickness)
    const mesh = new THREE.Mesh(geomery, wallMaterial)
    mesh.position.set(wall.x, 10, wall.z)
    mesh.rotateY(wall.rotation)
    wallMeshes.push(mesh)
    scene.add(mesh)
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)

/**
 * Moving animation
 */

// Z is forward, X is sideways, Y unused - all relative to camera (not real axes)
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const raycaser = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3())

const clock = new THREE.Clock()
let prevTime = clock.getElapsedTime()
const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const timeDelta = elapsedTime - prevTime
    prevTime = elapsedTime

    // "Friction"
    velocity.x -= velocity.x * timeDelta * sizes.friction
    velocity.z -= velocity.z * timeDelta * sizes.friction
    if (Math.abs(velocity.x) < sizes.minMovingSpeed) { velocity.x = 0}
    if (Math.abs(velocity.z) < sizes.minMovingSpeed) { velocity.z = 0}

    // Find move direction (relative to camera)
    direction.z = Number(moveForward) - Number(moveBackward)
    direction.x = Number(moveRight) - Number(moveLeft)
    direction.normalize()

    // Add move Velocity
    if ( moveForward || moveBackward ) {
        velocity.z -= direction.z * sizes.acceleration * timeDelta * -1
    } 
    if ( moveLeft || moveRight ) {
        velocity.x -= direction.x * sizes.acceleration * timeDelta * -1
    }

    // Find move direction
    const normalizedVelocity = new THREE.Vector3()
    normalizedVelocity.copy(velocity)
    normalizedVelocity.normalize()
    normalizedVelocity.x *= -1
    let deg = 0;
    if (normalizedVelocity.z !== 0) {
        deg = Math.atan2(normalizedVelocity.x, normalizedVelocity.z)
    } else if (normalizedVelocity.length() !== 0) {
        deg = normalizedVelocity.x > 0 ? Math.PI / 2 : -Math.PI / 2
    } else {
        deg = 0
    }

    // Check for walls
    const lookDirection = new THREE.Vector3()
    camera.getWorldDirection(lookDirection)
    lookDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), deg)
    raycaser.set(controls.getObject().position, lookDirection)
    const collisions = raycaser.intersectObjects(wallMeshes)
    if (collisions.length > 0 && collisions[0].distance < sizes.collisionDistance) {
        velocity.set(0, 0, 0)
    }

    // Do move
    controls.moveRight(velocity.x * timeDelta)
    controls.moveForward(velocity.z * timeDelta)

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

/**
 * Window resize handling
 */
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener('dblclick', () => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

    if (!fullscreenElement) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen()
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen()
            console.log('safari is trash')
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
        }
    }
})

tick()