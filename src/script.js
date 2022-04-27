import * as THREE from 'three'
import { PointerLockControls } from '../node_modules/three/examples/jsm/controls/PointerLockControls'


// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    firstPersonHeight: 10,
    friction: 10,
    acceleration: 100
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

/**
 * Scene
 */
// Init
const scene = new THREE.Scene()
scene.background = new THREE.Color( 0xffffff );
scene.fog = new THREE.Fog( 0xffffff, 0, 750 );
const light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
light.position.set( 0.5, 1, 0.75 );
scene.add( light );

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 1000)
camera.position.y = sizes.firstPersonHeight
scene.add(camera)

/**
 * Controls
 */
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


// Mouse

/**
 * Objects
 */

// Floor
const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 200, 200)
const floorMaterial = new THREE.MeshBasicMaterial({color: 0xeeeeee})
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floorGeometry.rotateX( - Math.PI / 2);
scene.add(floor)

const box = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshBasicMaterial({color: 0x00ff00})
)
box.position.set(0, 10, -5)
scene.add(box)

const axesHelper = new THREE.AxesHelper( 50 );
scene.add( axesHelper );

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)

const clock = new THREE.Clock()
let prevTime = clock.getElapsedTime()

// Z is forward, X is sideways, Y unused - all relative to camera (not real axes)
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const timeDelta = elapsedTime - prevTime
    prevTime = elapsedTime

    // "Friction"
    velocity.x -= velocity.x * timeDelta * sizes.friction
    velocity.z -= velocity.z * timeDelta * sizes.friction

    // Find Move direction (relative to camera)
    direction.z = Number(moveForward) - Number(moveBackward)
    direction.x = Number(moveRight) - Number(moveLeft)
    direction.normalize()

    // Move camera
    if ( moveForward || moveBackward ) {
        velocity.z -= direction.z * sizes.acceleration * timeDelta * -1
    } 
    if ( moveLeft || moveRight ) {
        velocity.x -= direction.x * sizes.acceleration * timeDelta * -1
    }

    controls.moveRight(velocity.x * timeDelta)
    controls.moveForward(velocity.z * timeDelta)

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

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