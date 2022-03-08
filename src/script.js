import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'
import { Blending, CubeTextureLoader, Vector3 } from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import typefaceFont from 'three/examples/fonts/helvetiker_regular.typeface.json'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { floorPowerOfTwo } from 'three/src/math/mathutils'
import cubeVertexShader from './shaders/water/cubevertex.glsl'
import cubeFragmentShader from './shaders/water/cubefragment.glsl'
import cube2VertexShader from './shaders/cube2vertex.glsl'
import cube2FragmentShader from './shaders/cube2fragment.glsl'



/**
 * Base
 */
// Debug
const gui = new dat.GUI({ width: 220 })
const debugObject = {}
gui.hide()

// Canvas
const canvas = document.querySelector('canvas.webgl')

//Scene
const scene = new THREE.Scene()

// cubemap
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMap = cubeTextureLoader.load(
    [
        '/envmap/hdr2/px.png',
        '/envmap/hdr2/nx.png',
        '/envmap/hdr2/py.png',
        '/envmap/hdr2/ny.png',
        '/envmap/hdr2/pz.png',
        '/envmap/hdr2/nz.png'
    ]
)
scene.background = environmentMap

/**
 * Text intro
 */



 /**
  * New Cube Plane
  */

    //Geometry
    var tuniform = {
            iGlobalTime:{type:'f',value:0.01},
            iChannel0: { value: environmentMap}
    };
    const cubePlaneGeometry = new THREE.PlaneGeometry(0.15,0.15,64,64)
    const cubePlaneMaterial = new THREE.ShaderMaterial(
        {
            vertexShader: cubeVertexShader,
            fragmentShader: cubeFragmentShader,
            side:THREE.DoubleSide,
            uniforms:tuniform
        }
    )
    cubePlaneMaterial.transparent = true
    // cubePlaneMaterial.opacity = 0.2
    cubePlaneMaterial.blending = THREE.AdditiveBlending
    // Mesh
    const cubePlane = new THREE.Mesh(cubePlaneGeometry, cubePlaneMaterial)
    cubePlane.rotation.x = - Math.PI * 0.5
    cubePlane.position.y = 0.1
    cubePlane.position.z = 0.19
    // scene.add(cubePlane)

/**
  * New Cube Plane 2
  */

    //Geometry
    var tuniform2 = {
        iGlobalTime:{type:'f',value:0.01},
};
const cubePlane2Geometry = new THREE.PlaneGeometry(0.08,0.08,2,2)
const cubePlane2Material = new THREE.ShaderMaterial(
    {
        vertexShader: cube2VertexShader,
        fragmentShader: cube2FragmentShader,
        side:THREE.DoubleSide,
        uniforms:tuniform2
    }
)
cubePlane2Material.transparent = true
// cubePlaneMaterial.opacity = 0.2
cubePlane2Material.blending = THREE.AdditiveBlending
// Mesh
const cubePlane2 = new THREE.Mesh(cubePlane2Geometry, cubePlane2Material)
cubePlane2.rotation.x = - Math.PI * 0.5
cubePlane2.position.y = 0.1
cubePlane2.position.z = 0.19
scene.add(cubePlane2)

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
        uSmallWavesSpeed: { value: 0.15 },
        uSmallIterations: { value: 1 },

        uDepthColor: { value: new THREE.Color(debugObject.JiduColorTest1) },
        uSurfaceColor: { value: new THREE.Color(debugObject.JiduColorTest2) },
        uColorOffset: { value: 0.13 },
        uColorMultiplier: { value: 5 }
    }
})


gui.add(waterMaterial.uniforms.uBigWavesElevation, 'value').min(0).max(1).step(0.001).name('uBigWavesElevation')
gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x').min(0).max(10).step(0.001).name('uBigWavesFrequencyX')
gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y').min(0).max(10).step(0.001).name('uBigWavesFrequencyY')
gui.add(waterMaterial.uniforms.uBigWavesSpeed, 'value').min(0).max(4).step(0.001).name('uBigWavesSpeed')


gui.add(waterMaterial.uniforms.uSmallWavesElevation, 'value').min(0).max(1).step(0.001).name('uSmallWavesElevation')
gui.add(waterMaterial.uniforms.uSmallWavesFrequency, 'value').min(0).max(30).step(0.001).name('uSmallWavesFrequency')
gui.add(waterMaterial.uniforms.uSmallWavesSpeed, 'value').min(0).max(4).step(0.001).name('uSmallWavesSpeed')
gui.add(waterMaterial.uniforms.uSmallIterations, 'value').min(0).max(5).step(1).name('uSmallIterations')

gui.add(waterMaterial.uniforms.uColorOffset, 'value').min(0).max(1).step(0.001).name('uColorOffset')
gui.add(waterMaterial.uniforms.uColorMultiplier, 'value').min(0).max(10).step(0.001).name('uColorMultiplier')

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
 * helper
 */
 const axesHelper = new THREE.AxesHelper( 5 );
//  scene.add( axesHelper );

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
// camera.rotation.set(-2.0527,0.3930,2.50948)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enableZoom = false
controls.enablePan = false
controls.enableRotate = false
controls.maxAzimuthAngle =0 
controls.minAzimuthAngle =0
camera.position.set(0, 0.462, 0.244)


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
const watercoloroffsetSpeed = 0.01;


const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Water
    waterMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    //Water Color offset

    // var waterColorOffset = (Math.sin(elapsedTime * watercoloroffsetSpeed)+0.7)*0.1;
    // waterMaterial.uniforms.uColorOffset.value = waterColorOffset

    tuniform.iGlobalTime.value  = elapsedTime
    tuniform2.iGlobalTime.value  = elapsedTime

    //log camera position and camera angle
    // console.log(camera.position)
    // console.log(camera.rotation)

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}


tick()