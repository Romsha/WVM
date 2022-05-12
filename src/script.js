import './style.css'
import * as THREE from 'three'
import * as dat from 'dat.gui'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'

// Debug
const DEBUG = false
if (DEBUG) {
    const gui = new dat.GUI()
}

//import room from './room.json'
import room from './bond.json'
import config from './config.json'

const PICTURE_ID_PREFIX = "picture-"

/**
 * Window resize handling
 */
 const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
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

/**
 * Utils
 */
const degToRad = (deg) => (deg / 180 * Math.PI)

const getPictureConfig = (id) => {
    for (const picture of room.pictureConfig) {
        if (picture.id === id) { return picture }
    }
    return null;
}

/**
 * Dom Elements
 */
const canvas = document.querySelector('canvas.webgl')
const overlay = document.querySelector('.overlay')
const startButton = document.querySelector('.start')
const pictureDescContainer = document.querySelector('.picture-desc')
const loadingBar = document.querySelector('.loading-bar')
const loadingText = document.querySelector('.loading-text')
const startText = document.querySelector('.start')

/**
 * Scene Init
 */
const scene = new THREE.Scene()
scene.background = new THREE.Color(config.sceneBG);
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
camera.lookAt(new THREE.Vector3(room.camera.startX + 1, camera.position.y, camera.position.z))
scene.add(camera)
const listener = new THREE.AudioListener()
camera.add(listener)

const ambiantLight = new THREE.AmbientLight(0xffffff, .85)
scene.add(ambiantLight)



/**
 * Loaders
 */
THREE.DefaultLoadingManager.onProgress = (_, loaded, total) => {
    loadingBar.style.transform = `scaleX(${loaded/total})`
}
THREE.DefaultLoadingManager.onLoad = () => {
    window.setTimeout(() => {
        loadingBar.style.transformOrigin = 'right center'
        loadingBar.style.transform = 'scaleX(0)'
        window.setTimeout(() => {
            loadingBar.style.display = 'none'
            loadingText.style.display = 'none'
            startText.style.display = 'inline-block'
        } , 1000)
    } , 1000)
}
const textureLoader = new THREE.TextureLoader()
const audioLoader = new THREE.AudioLoader()
const fontLoader = new FontLoader()

/**
 * Controls
 */
// Mouse Controls
var pauseAllMusic = () => {}
var resumeAllMusic = () => {}
const controls = new PointerLockControls(camera, document.body);
controls.addEventListener( 'lock', () => {
    overlay.classList.remove('visible')
    resumeAllMusic()
} );
if (!DEBUG) {
    controls.addEventListener( 'unlock', () => {
        overlay.classList.add('visible')
        pauseAllMusic()
    } );
}
startButton.addEventListener('click', () => {
    controls.lock();
})
scene.add(controls.getObject())

// Keys Controls
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
// materials
const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
const pictureTitleMaterial = new THREE.MeshStandardMaterial({ color: room.pictureTitleColor })

// Floor
const floorGeometry = new THREE.PlaneGeometry(room.floor.sizeX, room.floor.sizeY, 1, 1)
const floorTexture = textureLoader.load('texture/marble.png');
floorTexture.wrapS = THREE.RepeatWrapping
floorTexture.wrapT = THREE.RepeatWrapping
floorTexture.repeat.set(
    Math.floor(room.floor.sizeX / room.floor.tileRepeatScale), 
    Math.floor(room.floor.sizeY / room.floor.tileRepeatScale))
const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture })
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.rotateX(- Math.PI / 2);
floor.position.set(room.floor.sizeX / 2, 0, room.floor.sizeY / 2)
scene.add(floor)

// Walls
const wallMeshes = []
textureLoader.load('texture/wall-bricks.png', (wallTexture) => {
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
        texture.repeat.set(
            Math.floor(wall.length / config.walls.tileRepeatFactor),
            Math.floor(config.walls.wallsHeight / config.walls.tileRepeatFactor))
        const material = new THREE.MeshStandardMaterial({ map: texture });
        const mesh = new THREE.Mesh(geomery, material)
        mesh.position.set(wall.x, config.walls.wallsHeight / 2, wall.z)
        mesh.rotateY(degToRad(wall.rotation))
        mesh.name = `wall-${index}`
        mesh.receiveShadow = true
        wallMeshes.push(mesh)
        scene.add(mesh)
    }
})

// Pictures
const pictureMeshes = {}
const audioObjects = {}
const pictureLights = {}
let shouldPauseMusic = false
pauseAllMusic = () => {
    shouldPauseMusic = true
    for (const audioObject of Object.values(audioObjects)) {
        if (audioObject.isPlaying) { audioObject.pause() }
    }

}

resumeAllMusic = () => { 
    shouldPauseMusic = false
}

const createPictureLights = (pictureConfig) => {
    let light1X = pictureConfig.x + pictureConfig.offsetX
    let light1Z = pictureConfig.z + pictureConfig.offsetZ
    let light2X = light1X
    let light2Z = light1Z

    if (pictureConfig.offsetX) {
        // image depth is in X axis
        light1X += pictureConfig.offsetX * config.pictures.lights.lightPositionOffset.depth
        light2X = light1X
        light1Z += config.pictures.lights.lightPositionOffset.width
        light2Z -= config.pictures.lights.lightPositionOffset.width
    } else {
        // image depth is in Z axis
        light1Z += pictureConfig.offsetZ * config.pictures.lights.lightPositionOffset.depth
        light2Z = light1Z
        light1X += config.pictures.lights.lightPositionOffset.width
        light2X -= config.pictures.lights.lightPositionOffset.width
    }

    const spotLight = new THREE.SpotLight(0xffffff, .4, 50, .2, .5, .1)
    spotLight.position.set(
        light1X, 
        config.walls.wallsHeight + config.pictures.lights.lightPositionOffset.height, 
        light1Z)
    scene.add(spotLight)
    spotLight.target.position.set(
        pictureConfig.x + pictureConfig.offsetX, 
        config.pictures.pictureHeight + config.pictures.lights.targetPositionHeightOffset, 
        pictureConfig.z + pictureConfig.offsetZ)
    scene.add(spotLight.target)

    const spotLight2 = new THREE.SpotLight(0xffffff, .4, 50, .2, .5, .1)
    spotLight2.position.set(
        light2X, 
        config.walls.wallsHeight + config.pictures.lights.lightPositionOffset.height, 
        light2Z)
    scene.add(spotLight2)
    spotLight2.target.position.set(
        pictureConfig.x + pictureConfig.offsetX, 
        config.pictures.pictureHeight + config.pictures.lights.targetPositionHeightOffset, 
        pictureConfig.z + pictureConfig.offsetZ)
    scene.add(spotLight2.target)

    spotLight.castShadow = true
    spotLight2.castShadow = true
    spotLight.visible = false
    spotLight2.visible = false

    pictureLights[pictureConfig.id] = [spotLight, spotLight2]
}

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
                new THREE.MeshStandardMaterial({ map: texture }),
                blackMaterial
            ]
        )
        image.material[4].metalness = config.pictures.materialMetalness
        image.material[4].roughness = config.pictures.materialRoughness
        image.position.set(
            picture.x + picture.offsetX,
            config.firstPersonHeight,
            picture.z + picture.offsetZ)
        image.rotateY(degToRad(picture.rotation))
        image.name = `${PICTURE_ID_PREFIX}${picture.id}`
        pictureMeshes[picture.id] = image
        image.castShadow = true
        scene.add(image)
    })
    // Picture Audio
    const positionalAudio = new THREE.PositionalAudio(listener)
    audioLoader.load(`assets/pictures/${picture.folder}/${picture.audioFile}`, (audioBuffer) => {
        positionalAudio.setBuffer(audioBuffer)
        positionalAudio.setRefDistance(config.pictures.pictureViewDistance)
        positionalAudio.setLoop(true)
        positionalAudio.setDirectionalCone(90, 180, 0.1)
        positionalAudio.position.set(
            picture.x + picture.offsetX,
            config.firstPersonHeight,
            picture.z + picture.offsetZ)
        positionalAudio.rotateY(degToRad(picture.rotation))
        audioObjects[picture.id] = positionalAudio
    })
    // Picture Lights
    createPictureLights(picture)
}

// Picture titles
fontLoader.load('assets/fonts/helvetiker_bold.typeface.json', (font) => {
    for (const picture of room.pictureConfig) {
        const geomery = new TextGeometry(
            picture.title,
            {
                font: font,
                ...config.text
            }
        )
        geomery.center()
        const text = new THREE.Mesh(geomery, pictureTitleMaterial)
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
renderer.shadowMap.enabled = true

/**
 * Animation
 */
// Moving
// Z is forward, X is sideways, Y unused - all relative to camera (not real axes)
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const raycaser = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3())
const clock = new THREE.Clock()
let prevTime = clock.getElapsedTime()
// Music Playing
const totalMusicSteps = (config.pictures.pictureMusicVolumeMax - config.pictures.pictureMusicVolumeMin) / config.pictures.pictureMusicVolumeStep
const distanceVolumeStepSize = config.pictures.pictureMusicDistance / totalMusicSteps
let currentDescPictureID = null

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const timeDelta = elapsedTime - prevTime
    prevTime = elapsedTime

    /**
     * Handle pictures
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
    // Stop and play music from pictures, adjust audio on all playing pictures
    for (const [pictureID, audioDevice] of Object.entries(audioObjects)) {
        if (!Object.keys(musicPlayingPictures).includes(pictureID) && audioDevice.isPlaying) {
            audioDevice.pause()
        } else if (Object.keys(musicPlayingPictures).includes(pictureID)) {
            if (!audioDevice.isPlaying && !shouldPauseMusic) {
                audioDevice.play()
            }
            const musicStepsMinus = Math.floor(musicPlayingPictures[pictureID] / distanceVolumeStepSize)
            const currentVolume = config.pictures.pictureMusicVolumeMax - config.pictures.pictureMusicVolumeStep * musicStepsMinus
            if (audioDevice.getVolume() !== currentVolume) {
                audioDevice.setVolume(currentVolume)
            }
        }
    }
    // Show description and turn on spotlight for closest picture
    let closestPictureID = null
    let closestPictureDistance = config.pictures.pictureViewDistance
    // Note: we depend on the fact that pictureMusicDistance > pictureViewDistance
    for (const [pictureID, pictureDistance] of Object.entries(musicPlayingPictures)) {
        if (pictureDistance < closestPictureDistance) {
            closestPictureDistance = pictureDistance
            closestPictureID = pictureID
        }
    }
    if (closestPictureID) {
        pictureDescContainer.classList.add('visible')
        if (!currentDescPictureID || currentDescPictureID !== closestPictureID) {
            if (currentDescPictureID) {
                for (const light of pictureLights[currentDescPictureID]) { light.visible = false }
            }
            currentDescPictureID = closestPictureID
            pictureDescContainer.src = getPictureConfig(closestPictureID).desc
            for (const light of pictureLights[currentDescPictureID]) { light.visible = true }   
        }
    } else {
        if (currentDescPictureID) {
            for (const light of pictureLights[currentDescPictureID]) { light.visible = false }
        }
        pictureDescContainer.classList.remove('visible')
        currentDescPictureID = null
    }

    /**
     * Moving animation
     */
    // "Friction"
    velocity.x -= velocity.x * timeDelta * config.movement.friction
    velocity.z -= velocity.z * timeDelta * config.movement.friction
    // make velocity zero if its lower than the threashold
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
    const moveDirection = new THREE.Vector3()
    camera.getWorldDirection(moveDirection)
    moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), deg)
    raycaser.set(currentPosition, moveDirection)
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

tick()