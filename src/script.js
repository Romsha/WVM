import './style.css'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'


// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    firstPersonHeight: 10,
    friction: 10,
    acceleration: 500,
    collisionDistance: 3,
    minMovingSpeed: 0.001,
    wallsHeight: 25,
    wallsThickness: 1,
    pictureDepth: 0.5,
    pictureHeight: 10,
    pictureTitleHeight: 17,
    pictureViewDistance: 30,
    pictureMusicDistance: 70,
    pictureMusicVolumeMin: 0.1,
    pictureMusicVolumeMax: 5,
    pictureMusicVolumeStep: 0.1
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

/**
 * Scene
 */
// Init
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xd4f1ff);
scene.fog = new THREE.Fog(0xffffff, 0, 750);

const axesHelper = new THREE.AxesHelper(50);
scene.add(axesHelper);

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 1000)
camera.position.y = sizes.firstPersonHeight
camera.position.z = 50
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
const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 200, 200)
const floorTexture = textureLoader.load('texture/marble.png');
floorTexture.wrapS = THREE.RepeatWrapping
floorTexture.wrapT = THREE.RepeatWrapping
floorTexture.repeat.set(70, 70)
const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture })
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floorGeometry.rotateX(- Math.PI / 2);
scene.add(floor)

// Walls
const wallsConfig = [
    { z: 20, x: 35, rotation: 0, length: 70 },
    { z: 90, x: 35, rotation: 0, length: 70 },
    { z: 10, x: 70, rotation: Math.PI / 2, length: 20 },
    { z: 0, x: 120, rotation: 0, length: 100 },
    { z: 85, x: 170, rotation: Math.PI / 2, length: 170 },
    { z: 170, x: 120, rotation: 0, length: 100 },
    { z: 130, x: 70, rotation: Math.PI / 2, length: 80 },
]
const wallMeshes = []
var wallTexture = textureLoader.load('texture/wall-bricks.png', () => {
    wallTexture.wrapS = THREE.RepeatWrapping
    wallTexture.wrapT = THREE.RepeatWrapping
    for (const [index, wall] of wallsConfig.entries()) {
        const geomery = new THREE.BoxGeometry(wall.length, sizes.wallsHeight, sizes.wallsThickness)
        const texture = wallTexture.clone()
        texture.needsUpdate = true;
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(wall.length / 10, 2)
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geomery, material)
        mesh.position.set(wall.x, sizes.wallsHeight / 2, wall.z)
        mesh.rotateY(wall.rotation)
        mesh.name = `wall-${index}`
        wallMeshes.push(mesh)
        scene.add(mesh)
    }
});

// Pictures
const pictureConfig = [
    { id: '1', folder: 'sonic', pictureFile: 'sonic-game.jpg', x: 170, z: 50, offsetX: -1, offsetZ: 0, rotation: -Math.PI / 2, audioFile: 'sonic-theme.mp3', title: 'sonic the Hedghog', desc: 'https://en.wikipedia.org/wiki/Sonic_the_Hedgehog' },
    { id: '2', folder: 'mario', pictureFile: 'super-mario-game.webp', x: 170, z: 120, offsetX: -1, offsetZ: 0, rotation: -Math.PI / 2, audioFile: 'super-mario-theme.mp3', title: 'Super Mario', desc: 'https://en.wikipedia.org/wiki/Super_Mario' },
    { id: '3', folder: 'lf2', pictureFile: 'lf2-game.webp', x: 120, z: 170, offsetX: 0, offsetZ: -1, rotation: Math.PI, audioFile: 'lf2-theme.mp3', title: 'Little Fighters 2', desc: 'https://en.wikipedia.org/wiki/Little_Fighter_2' },
]
const getPictureConfig = (id) => {
    for (const picture of pictureConfig) {
        if (picture.id === id) { return picture }
    }
    return null;
}
const pictureMeshes = {}
const audioObjects = {}
const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
for (const picture of pictureConfig) {
    // Picture itself
    textureLoader.load(`assets/pictures/${picture.folder}/${picture.pictureFile}`, (texture) => {
        const image = new THREE.Mesh(
            new THREE.BoxGeometry(
                texture.image.width / texture.image.height * sizes.pictureHeight,
                sizes.pictureHeight,
                sizes.pictureDepth
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
            sizes.firstPersonHeight,
            picture.z + picture.offsetZ)
        image.rotateY(picture.rotation)
        image.name = `picture-${picture.id}`
        pictureMeshes[picture.id] = image
        scene.add(image)
    })
    // Picture Audio
    const positionalAudio = new THREE.PositionalAudio(listener)
    audioLoader.load(`assets/pictures/${picture.folder}/${picture.audioFile}`, (audioBuffer) => {
        positionalAudio.setBuffer(audioBuffer)
        positionalAudio.setRefDistance(sizes.pictureViewDistance)
        positionalAudio.setLoop(true)
        positionalAudio.setVolume(10)
        positionalAudio.setDirectionalCone(90, 180, 0.1)
        positionalAudio.position.set(
            picture.x + picture.offsetX,
            sizes.firstPersonHeight,
            picture.z + picture.offsetZ)
        positionalAudio.rotateY(picture.rotation)
        audioObjects[picture.id] = positionalAudio
    })
}

const fontLoader = new FontLoader()
const textConfig = {
    size: 0.7,
    height: 0.05,
    curveSegments: 6,
    bevelEnabled: false,
}
const textMaterial = new THREE.MeshBasicMaterial({ color: 0x1e73e6 })
fontLoader.load('/fonts/helvetiker_bold.typeface.json', (font) => {
    for (const picture of pictureConfig) {
        const geomery = new TextGeometry(
            picture.title,
            {
                font: font,
                ...textConfig
            }
        )
        geomery.center()
        const text = new THREE.Mesh(geomery, textMaterial)
        text.position.set(
            picture.x + picture.offsetX,
            sizes.pictureTitleHeight,
            picture.z + picture.offsetZ)
        text.rotateY(picture.rotation)
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
const totalMusicSteps = (sizes.pictureMusicVolumeMax - sizes.pictureMusicVolumeMin) / sizes.pictureMusicVolumeStep
const distanceVolumeStepSize = sizes.pictureMusicDistance / totalMusicSteps
const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const timeDelta = elapsedTime - prevTime
    prevTime = elapsedTime

    // Check for images
    /**
     * Operation order for image and music:
     * Music:
     *  - Find all images closer than X, before hittig a wall - V
     *  - Turn on all found pictures - V
     *  - Turn off all other audio - V
     *  - Set volume according to distance (some increments) - V
     * Description:
     *  - Find closest image which is not hidden by wall
     *  - if closer than y: make sure description is shown
     *  - if not closer than y: hide description
     * 
     */
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
            /picture-\d+/.exec(pictureCollisions[0].object.name) &&
            pictureCollisions[0].distance < sizes.pictureMusicDistance) {
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
            const currentVolume = sizes.pictureMusicVolumeMax - sizes.pictureMusicVolumeStep * musicStepsMinus
            if (audioDevice.getVolume() !== currentVolume) {
                audioDevice.setVolume(currentVolume)
            }
        }
    }
    let closestPictureID = null
    let closestPictureDistance = sizes.pictureViewDistance
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
    velocity.x -= velocity.x * timeDelta * sizes.friction
    velocity.z -= velocity.z * timeDelta * sizes.friction
    if (Math.abs(velocity.x) < sizes.minMovingSpeed) { velocity.x = 0 }
    if (Math.abs(velocity.z) < sizes.minMovingSpeed) { velocity.z = 0 }

    // Find move direction (relative to camera)
    direction.z = Number(moveForward) - Number(moveBackward)
    direction.x = Number(moveRight) - Number(moveLeft)
    direction.normalize()

    // Add move Velocity
    if (moveForward || moveBackward) {
        velocity.z -= direction.z * sizes.acceleration * timeDelta * -1
    }
    if (moveLeft || moveRight) {
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
    const wallCollisions = raycaser.intersectObjects(wallMeshes)
    if (wallCollisions.length > 0 && wallCollisions[0].distance < sizes.collisionDistance) {
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