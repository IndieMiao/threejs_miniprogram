import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'
import { Vector3 } from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import typefaceFont from 'three/examples/fonts/helvetiker_regular.typeface.json'


/**
 * Base
 */
// Debug
const gui = new dat.GUI({ width: 220 })
const debugObject = {}
// gui.hide()

// Canvas
const canvas = document.querySelector('canvas.webgl')

//Loader Manager
const loadingManager = new THREE.LoadingManager()
loadingManager.onStart = () =>
{
    console.log('loadingManager: loading started')
}
loadingManager.onLoad = () =>
{
    console.log('loadingManager: loading finished')
}
loadingManager.onProgress = () =>
{
    console.log('loadingManager: loading progressing')
}
loadingManager.onError = () =>
{
    console.log('loadingManager: loading error')
}

const textureLoader = new THREE.TextureLoader(loadingManager)

//Textures
const whitetext= textureLoader.load('/textures/white_text.png')
const blacktext= textureLoader.load('/textures/black_text.png')

// Scene
const scene = new THREE.Scene()

/**
 * Text Plane
 */
 const planGeo= new THREE.PlaneGeometry( 1, 1 );
 const PlaneMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide, map:whitetext} );
 const plane = new THREE.Mesh( planGeo, PlaneMaterial );
 plane.rotation.set(Math.PI/2,Math.PI,0)
 plane.position.set(0,0.07,0)
 PlaneMaterial.transparent = true;
 PlaneMaterial.alphaTest = 0.1;
 PlaneMaterial.depthWrite = false;
//  PlaneMaterial.depthTest = true;
//  scene.add( plane );

/**
 * 3d Texture
 */

/**
 * Fonts
 */
 const fontLoader = new FontLoader()

const text = new THREE.Mesh()
const textsize =0.02

 fontLoader.load(
     '/fonts/helvetiker_regular.typeface.json',
     (font) =>
     {
         // Material
         const material = new THREE.MeshBasicMaterial()
 
         // Text
 
         const textGeometry = new TextGeometry(
            'Option Test 1',
            {
                font:font,
                size: textsize,
                height: 0.000001,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.000001,
                bevelSize: 0.001,
                bevelOffset: 0,
                bevelSegments: 5
            }
         )
         
         textGeometry.center()
         textGeometry.rotateX(-Math.PI/2)
         textGeometry.translate(0,0.1,0)

        // const text = new THREE.Mesh(textGeometry,material)
        text.geometry = textGeometry
        text.material = material

     }
 )

scene.add(text)

/**
 * Cube
 */
 const cubesize = 0.04;
//  const cubesize = 1;
 const cubeGeo = new THREE.BoxGeometry( cubesize, cubesize, cubesize )
 const cubeMaterial = new THREE.MeshPhysicalMaterial( )
 cubeMaterial.transparent = true
 cubeMaterial.side = THREE.DoubleSide


 const cube = new THREE.Mesh( cubeGeo, cubeMaterial )
 cube.position.set(0,0.15,0.22)
 scene.add( cube )

 /**
  * Material Cube
  */
 
 cubeMaterial.transmission = 1
 cubeMaterial.opacity= 1
 cubeMaterial.ior= 1.3

 cubeMaterial.roughness= 0.45
 cubeMaterial.metalness= 0.06 
 cubeMaterial.reflectivity = 0.11
 cubeMaterial.thickness= 0.3
gui.add(cubeMaterial, 'metalness').min(0).max(1).step(0.0001)
gui.add(cubeMaterial,'roughness').min(0).max(1).step(0.001)
gui.add(cubeMaterial,'ior').min(1).max(2).step(0.001)
gui.add(cubeMaterial,'transmission').min(0).max(1).step(0.001)
gui.add(cubeMaterial,'opacity').min(0).max(1).step(0.001)
gui.add(cubeMaterial,'thickness').min(0).max(5).step(0.001)
gui.add(cubeMaterial,'reflectivity').min(0).max(1).step(0.001)

/**
 * Water
 */
// Geometry
const waterGeometry = new THREE.PlaneGeometry(2, 2, 1024, 1024)

// Colors
debugObject.JiduColorTest1 = '#1052bc'
debugObject.JiduColorTest2 = '#bf00e6'
gui.addColor(debugObject, 'JiduColorTest1').onChange(() => { waterMaterial.uniforms.uDepthColor.value.set(debugObject.JiduColorTest1) })
gui.addColor(debugObject, 'JiduColorTest2').onChange(() => { waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.JiduColorTest2) })

// Water Material
const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms:
    {
        uTime: { value: 0 },
        
        uBigWavesElevation: { value: 0.074 },
        uBigWavesFrequency: { value: new THREE.Vector2(10,10) },
        uBigWavesSpeed: { value: 0.03 },

        uSmallWavesElevation: { value: 0.152 },
        uSmallWavesFrequency: { value: 5.013 },
        uSmallWavesSpeed: { value: 0.06 },
        uSmallIterations: { value: 1 },

        uDepthColor: { value: new THREE.Color(debugObject.JiduColorTest1) },
        uSurfaceColor: { value: new THREE.Color(debugObject.JiduColorTest2) },
        uColorOffset: { value: 0.13 },
        uColorMultiplier: { value: 4.45 }
    }
})

// gui.add(waterMaterial.uniforms.uBigWavesElevation, 'value').min(0).max(1).step(0.001).name('uBigWavesElevation')
// gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x').min(0).max(10).step(0.001).name('uBigWavesFrequencyX')
// gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y').min(0).max(10).step(0.001).name('uBigWavesFrequencyY')
// gui.add(waterMaterial.uniforms.uBigWavesSpeed, 'value').min(0).max(4).step(0.001).name('uBigWavesSpeed')


// gui.add(waterMaterial.uniforms.uSmallWavesElevation, 'value').min(0).max(1).step(0.001).name('uSmallWavesElevation')
// gui.add(waterMaterial.uniforms.uSmallWavesFrequency, 'value').min(0).max(30).step(0.001).name('uSmallWavesFrequency')
// gui.add(waterMaterial.uniforms.uSmallWavesSpeed, 'value').min(0).max(4).step(0.001).name('uSmallWavesSpeed')
// gui.add(waterMaterial.uniforms.uSmallIterations, 'value').min(0).max(5).step(1).name('uSmallIterations')

// gui.add(waterMaterial.uniforms.uColorOffset, 'value').min(0).max(1).step(0.001).name('uColorOffset')
// gui.add(waterMaterial.uniforms.uColorMultiplier, 'value').min(0).max(10).step(0.001).name('uColorMultiplier')

// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = - Math.PI * 0.5
scene.add(water)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Helper
 */
 const axesHelper = new THREE.AxesHelper( 5 );
 scene.add( axesHelper );

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0.466, 0.248)
// camera.rotation.set(-2.0527,0.3930,2.50948)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
const rotationSpeed = 0.01
const textSpeed = 0.001


const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Water
    waterMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()
    
    //cube animation 
    cube.rotation.x += rotationSpeed
    cube.rotation.y += rotationSpeed
    cube.rotation.z += rotationSpeed

    //text animation
    // text.translateZ += textSpeed
    text.position.z += textSpeed

    //log camera position and camera angle
    // console.log(camera.position)
    // console.log(camera.rotation)

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()