import './style.css'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'

import room from './room.json'
import config from './config.json'

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

/**
 * Scene
 */
// Init
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xd4f1ff);
scene.fog = new THREE.Fog(0xffffff, 0, Math.max(room.floor.sizeX, room.floor.sizeY) * 2);

const axesHelper = new THREE.AxesHelper(50);
scene.add(axesHelper);

// Camera
const camera = new THREE.PerspectiveCamera(
    75, 
    sizes.width / sizes.height, 
    0.1, 
    Math.max(room.floor.sizeX, room.floor.sizeY) * 2
)
camera.position.set(room.camera.startX, config.firstPersonHeight, room.camera.startZ)
camera.lookAt(new THREE.Vector3(1, camera.position.y, camera.position.z))
scene.add(camera)
const listener = new THREE.AudioListener()
const audioLoader = new THREE.AudioLoader()
camera.add(listener)


/**
 * Controls
 */
// mouse
const controls = new PointerLockControls(camera, document.body);
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
const textureLoader = new THREE.TextureLoader()
const floorGeometry = new THREE.PlaneGeometry(room.floor.sizeX, room.floor.sizeY, 1, 1)
const floorTexture = textureLoader.load('texture/marble.png');
floorTexture.wrapS = THREE.RepeatWrapping
floorTexture.wrapT = THREE.RepeatWrapping
floorTexture.repeat.set(
    Math.floor(room.floor.sizeX / room.floor.tileRepeatScale), 
    Math.floor(room.floor.sizeY / room.floor.tileRepeatScale))
const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture })
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.rotateX(- Math.PI / 2);
floor.position.set(room.floor.sizeX / 2, 0, room.floor.sizeY / 2)
scene.add(floor)

// Walls
const degToRad = (deg) => (deg / 180 * Math.PI)

const wallMeshes = []
var wallTexture = textureLoader.load('texture/wall-bricks.png', () => {
    wallTexture.wrapS = THREE.RepeatWrapping
    wallTexture.wrapT = THREE.RepeatWrapping
    for (const [index, wall] of room.wallsConfig.entries()) {
        const geomery = new THREE.BoxGeometry(
            wall.length, 
            config.walls.wallsHeight, 
            config.walls.wallsThickness
        )
        const texture = wallTexture.clone()
        texture.needsUpdate = true;
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(
            Math.floor(wall.length / config.walls.tileRepeatFactor),
            Math.floor(config.walls.wallsHeight / config.walls.tileRepeatFactor))
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geomery, material)
        mesh.position.set(wall.x, config.walls.wallsHeight / 2, wall.z)
        mesh.rotateY(degToRad(wall.rotation))
        mesh.name = `wall-${index}`
        wallMeshes.push(mesh)
        scene.add(mesh)
    }
});

// Pictures
const getPictureConfig = (id) => {
    for (const picture of room.pictureConfig) {
        if (picture.id === id) { return picture }
    }
    return null;
}
const pictureMeshes = {}
const audioObjects = {}
const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
const PICTURE_ID_PREFIX = "picture-"
for (const picture of room.pictureConfig) {
    // Picture itself
    textureLoader.load(`assets/pictures/${picture.folder}/${picture.pictureFile}`, (texture) => {
        const image = new THREE.Mesh(
            new THREE.BoxGeometry(
                texture.image.width / texture.image.height * config.pictures.pictureHeight,
                config.pictures.pictureHeight,
                config.pictures.pictureDepth
            ),
            [
                blackMaterial,
                blackMaterial,
                blackMaterial,
                blackMaterial,
                new THREE.MeshBasicMaterial({ map: texture }),
                blackMaterial
            ]
        )
        image.position.set(
            picture.x + picture.offsetX,
            config.firstPersonHeight,
            picture.z + picture.offsetZ)
        image.rotateY(degToRad(picture.rotation))
        image.name = `${PICTURE_ID_PREFIX}${picture.id}`
        pictureMeshes[picture.id] = image
        scene.add(image)
    })
    // Picture Audio
    const positionalAudio = new THREE.PositionalAudio(listener)
    audioLoader.load(`assets/pictures/${picture.folder}/${picture.audioFile}`, (audioBuffer) => {
        positionalAudio.setBuffer(audioBuffer)
        positionalAudio.setRefDistance(config.pictures.pictureViewDistance)
        positionalAudio.setLoop(true)
        //positionalAudio.setVolume(10)
        positionalAudio.setDirectionalCone(90, 180, 0.1)
        positionalAudio.position.set(
            picture.x + picture.offsetX,
            config.firstPersonHeight,
            picture.z + picture.offsetZ)
        positionalAudio.rotateY(degToRad(picture.rotation))
        audioObjects[picture.id] = positionalAudio
    })
}

const fontLoader = new FontLoader()
const textMaterial = new THREE.MeshBasicMaterial({ color: 0x1e73e6 })
fontLoader.load('/fonts/helvetiker_bold.typeface.json', (font) => {
    for (const picture of room.pictureConfig) {
        const geomery = new TextGeometry(
            picture.title,
            {
                font: font,
                ...config.text
            }
        )
        geomery.center()
        const text = new THREE.Mesh(geomery, textMaterial)
        text.position.set(
            picture.x + picture.offsetX,
            config.pictures.pictureTitleHeight,
            picture.z + picture.offsetZ)
        text.rotateY(degToRad(picture.rotation))
        scene.add(text)

    }
})

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
const pictureDescContainer = document.querySelector('.picture-desc')
let currentDescPictureID = null
const clock = new THREE.Clock()
let prevTime = clock.getElapsedTime()
const totalMusicSteps = (config.pictures.pictureMusicVolumeMax - config.pictures.pictureMusicVolumeMin) / config.pictures.pictureMusicVolumeStep
const distanceVolumeStepSize = config.pictures.pictureMusicDistance / totalMusicSteps
const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const timeDelta = elapsedTime - prevTime
    prevTime = elapsedTime

    // Check for images
    /**
     * Handle music
     */
    // Find all images close enough and not blocked by anything
    const musicPlayingPictures = {}
    const currentPosition = controls.getObject().position
    for (const [pictureID, pictureMesh] of Object.entries(pictureMeshes)) {
        const direction = new THREE.Vector3()
        direction.subVectors(pictureMesh.position, currentPosition).normalize()
        raycaser.set(currentPosition, direction)
        const pictureCollisions = raycaser.intersectObjects([...wallMeshes, pictureMesh])
        // TODO: exect regex match?
        if (pictureCollisions.length > 0 &&
            RegExp(`${PICTURE_ID_PREFIX}\\d+`).exec(pictureCollisions[0].object.name) &&
            pictureCollisions[0].distance < config.pictures.pictureMusicDistance) {
            musicPlayingPictures[pictureID] = pictureCollisions[0].distance
        }
    }
    // Stop and play music from pictures
    for (const [pictureID, audioDevice] of Object.entries(audioObjects)) {
        if (!Object.keys(musicPlayingPictures).includes(pictureID) && audioDevice.isPlaying) {
            audioDevice.stop()
            console.log('stoping music', pictureID)
        } else if (Object.keys(musicPlayingPictures).includes(pictureID)) {
            if (!audioDevice.isPlaying) {
                audioDevice.play()
                console.log('starting music', pictureID)
            }
            const musicStepsMinus = Math.floor(musicPlayingPictures[pictureID] / distanceVolumeStepSize)
            const currentVolume = config.pictures.pictureMusicVolumeMax - config.pictures.pictureMusicVolumeStep * musicStepsMinus
            if (audioDevice.getVolume() !== currentVolume) {
                audioDevice.setVolume(currentVolume)
            }
        }
    }
    let closestPictureID = null
    let closestPictureDistance = config.pictures.pictureViewDistance
    // TODO: we depend on the fact that pictureMusicDistance > pictureViewDistance
    for (const [pictureID, pictureDistance] of Object.entries(musicPlayingPictures)) {
        if (pictureDistance < closestPictureDistance) {
            closestPictureDistance = pictureDistance
            closestPictureID = pictureID
        }
    }
    if (closestPictureID) {
        pictureDescContainer.classList.add('visible')
        if (!currentDescPictureID || currentDescPictureID !== closestPictureID) {
            currentDescPictureID = closestPictureID
            pictureDescContainer.src = getPictureConfig(closestPictureID).desc
        }
    } else {
        pictureDescContainer.classList.remove('visible')
        currentDescPictureID = null
    }


    // "Friction"
    velocity.x -= velocity.x * timeDelta * config.movement.friction
    velocity.z -= velocity.z * timeDelta * config.movement.friction
    if (Math.abs(velocity.x) < config.movement.minMovingSpeed) { velocity.x = 0 }
    if (Math.abs(velocity.z) < config.movement.minMovingSpeed) { velocity.z = 0 }

    // Find move direction (relative to camera)
    direction.z = Number(moveForward) - Number(moveBackward)
    direction.x = Number(moveRight) - Number(moveLeft)
    direction.normalize()

    // Add move Velocity
    if (moveForward || moveBackward) {
        velocity.z -= direction.z * config.movement.acceleration * timeDelta * -1
    }
    if (moveLeft || moveRight) {
        velocity.x -= direction.x * config.movement.acceleration * timeDelta * -1
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
    const wallCollisions = raycaser.intersectObjects(wallMeshes)
    if (wallCollisions.length > 0 && 
        wallCollisions[0].distance < config.movement.collisionDistance) {
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