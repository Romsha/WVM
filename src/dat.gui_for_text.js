import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import * as dat from 'dat.gui'
const gui = new dat.GUI()
const fontLoader = new FontLoader()
fontLoader.load('/fonts/helvetiker_bold.typeface.json', (font) => {
    const textConfig = {
        font: font,
        size: 0.7,
        height: 0.05,
        curveSegments: 6,
        bevelEnabled: false,
    }

    const geomery = new TextGeometry(
        'Picture caption (2022)',
        textConfig
    )
    geomery.center()
    const material = new THREE.MeshBasicMaterial( {color: 0x1e73e6} )
    const text = new THREE.Mesh(geomery, material)

    const updateGeometry = () => {
        const geomery = new TextGeometry(
            'Picture caption (2022)',
            textConfig
        )
        geomery.center()
        text.geometry.dispose()
        text.geometry = geomery
    }
    
    scene.add(text)
    text.position.set(170-1, 17, 50)
    text.rotateY(-Math.PI / 2)
    gui.add(textConfig, 'size').min(0.1).max(10).step(0.1).onFinishChange(() => updateGeometry())
    gui.add(textConfig, 'height').min(0).max(0.2).step(0.01).onFinishChange(() => updateGeometry())
    gui.add(textConfig, 'curveSegments').min(0).max(30).step(1).onFinishChange(() => updateGeometry())
})
