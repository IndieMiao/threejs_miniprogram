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
import textplanefragment from './shaders/textplanefragment.glsl'
import Stats from 'stats.js'





/**
 * Base
 */
// Debug
const gui = new dat.GUI({ width: 220 })
const debugObject = {}
// const stats = new Stats()
// document.body.appendChild(stats.dom)
gui.hide()

// Canvas
const canvas = document.querySelector('canvas.webgl')


//Scene
const scene = new THREE.Scene()
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Renderer
 */

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

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

/**
 * Text intro test
 */

// Create video and play
const textureVid = document.createElement("video")
textureVid.src = '/video/Title3.mp4' ; 
// textureVid.src = '/textures/Text1.gif' ; 
textureVid.loop = true;
textureVid.playsInline = true;
textureVid.muted = true;

textureVid.play();


// const textureVid = document.getElementById( 'video' );
// textureVid.play();
// textureVid.addEventListener( 'play', function () {

//     this.currentTime = 3;

// } );


// Load video texture
const videoTexture = new THREE.VideoTexture(textureVid);
videoTexture.format = THREE.RGBAFormat;
videoTexture.minFilter = THREE.NearestFilter;
videoTexture.maxFilter = THREE.NearestFilter;
videoTexture.generateMipmaps = false;


// Create mesh
const textPlaneGeo = new THREE.PlaneGeometry( 0.12,0.25,32,32);

const textPlaneMaterial = new THREE.ShaderMaterial(
    {
        vertexShader: cube2VertexShader,
        fragmentShader: textplanefragment,
        side:THREE.DoubleSide,
        uniforms:{map:{value:videoTexture}}
    }
)
// const textPlaneMaterial = new THREE.MeshBasicMaterial({map: videoTexture} );
const textPlanemesh= new THREE.Mesh( textPlaneGeo, textPlaneMaterial );

textPlanemesh.position.y = 0.2

textPlaneMaterial.side= THREE.DoubleSide;
textPlaneMaterial.transparent= true;
textPlaneMaterial.blending = THREE.AdditiveBlending;
textPlaneMaterial.update = true;

// scene.add(textPlanemesh);

 /**
  * New Cube Plane
  */

    //Geometry
    var tuniform = {
            iGlobalTime:{type:'f',value:0.01},
            iChannel0: { value: environmentMap}
    };
    // const cubePlaneGeometry = new THREE.PlaneGeometry(0.3,0.3,64,64)
    const cubePlaneGeometry = new THREE.PlaneGeometry(0.065,0.065,2,2)
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
    // cubePlane.rotation.x = - Math.PI * 0.5
    // cubePlane.position.y = 0.1
    // cubePlane.position.z = 0.19
    scene.add(cubePlane)

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
// scene.add(cubePlane2)

/**
 * Water
 */
// Geometry
const waterGeometry = new THREE.PlaneGeometry(2.1, 2.1, 256,256) 

// // ColorPat 1
// debugObject.uColor1 = '#1052bc'
// debugObject.uColor2 = '#9407b0'
// debugObject.uColor3 = '#d39296'
// debugObject.uColor4 = '#c1b9b9'
// debugObject.uColorBG = '#d39296'

// //ColorPat 2
// debugObject.uColor1 = '#090e58'
// debugObject.uColor2 = '#093a53'
// debugObject.uColor3 = '#c5f1ea'
// debugObject.uColor4 = '#e4d8d8'
// debugObject.uColorBG = '#f0e6e6'

// // //ColorPat 3
// debugObject.uColor1 = '#7900ff'
// debugObject.uColor2 = '#548cff'
// debugObject.uColor3 = '#cfffdc'
// debugObject.uColor4 = '#b43c3c'
// debugObject.uColorBG = '#93ffd8'

// // //ColorPat 4
// debugObject.uColor1 = '#000b49'
// debugObject.uColor2 = '#2666cf'
// debugObject.uColor3 = '#ebe645'
// debugObject.uColor4 = '#b43c3c'
// debugObject.uColorBG = '#93ffd8'


// //ColorPat 4
debugObject.uColor1 = '#012dbc'
debugObject.uColor2 = '#3eafcc'
debugObject.uColor3 = '#ffffff'
debugObject.uColor4 = '#c1b9b9'
debugObject.uColorBG = '#5ee6eb'




scene.background = new THREE.Color(debugObject.uColorBG)
gui.addColor(debugObject, 'uColor1').onChange(() => { waterMaterial.uniforms.uColor1.value.set(debugObject.uColor1) })
gui.addColor(debugObject, 'uColor2').onChange(() => { waterMaterial.uniforms.uColor2.value.set(debugObject.uColor2) })
gui.addColor(debugObject, 'uColor3').onChange(() => { waterMaterial.uniforms.uColor3.value.set(debugObject.uColor3) })
gui.addColor(debugObject, 'uColor4').onChange(() => { waterMaterial.uniforms.uColor4.value.set(debugObject.uColor4) })
gui.addColor(debugObject, 'uColorBG').onChange(() => { scene.background = new THREE.Color(debugObject.uColorBG)})


// Water Material
const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms:
    {
        uTime: { value: 0 },
        
        uBigWavesElevation: { value: 0.25 },
        uBigWavesFrequency: { value: new THREE.Vector2(12,12) },
        uBigWavesSpeed: { value: 0.001 },
        uColorMiddeloffset: { value: 0.8 },

        uSmallWavesElevation: { value: 0.552 },
        uSmallWavesFrequency: { value: 4.013 },
        uSmallWavesSpeed: { value: 0.01 },
        uSmallIterations: { value: 3 },

        uSinFreq: { value: 210. },
        uSinElevation: { value: 0.15 },

        uColor1: { value: new THREE.Color(debugObject.uColor1) },
        uColor2: { value: new THREE.Color(debugObject.uColor2) },
        uColor3: { value: new THREE.Color(debugObject.uColor3) },
        uColor4: { value: new THREE.Color(debugObject.uColor4) },
        uColorOffset: { value: 1. },
        uColorMultiplier: { value: 5 },
        uFar:{value:0.58},
        uNear:{value:0.015}
    }
})


// gui.add(waterMaterial.uniforms.uColorMiddeloffset, 'value').min(0.0001).max(5).step(0.01).name('uColorMiddeloffset')
gui.add(waterMaterial.uniforms.uFar, 'value').min(0.0001).max(2).step(0.001).name('uFar')
gui.add(waterMaterial.uniforms.uNear, 'value').min(0.0001).max(0.1).step(0.001).name('uNear')
// gui.add(waterMaterial.uniforms.uBigWavesElevation, 'value').min(0).max(1).step(0.001).name('uBigWavesElevation')
// gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x').min(0).max(10).step(0.001).name('uBigWavesFrequencyX')
// gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y').min(0).max(10).step(0.001).name('uBigWavesFrequencyY')
gui.add(waterMaterial.uniforms.uBigWavesSpeed, 'value').min(0).max(4).step(0.001).name('uBigWavesSpeed')


// gui.add(waterMaterial.uniforms.uSmallWavesElevation, 'value').min(0).max(1).step(0.001).name('uSmallWavesElevation')
// gui.add(waterMaterial.uniforms.uSmallWavesFrequency, 'value').min(0).max(30).step(0.001).name('uSmallWavesFrequency')
// gui.add(waterMaterial.uniforms.uSmallWavesSpeed, 'value').min(0).max(4).step(0.001).name('uSmallWavesSpeed')
// gui.add(waterMaterial.uniforms.uSmallIterations, 'value').min(0).max(5).step(1).name('uSmallIterations')

// gui.add(waterMaterial.uniforms.uColorOffset, 'value').min(0).max(1).step(0.001).name('uColorOffset')
// gui.add(waterMaterial.uniforms.uColorMultiplier, 'value').min(0).max(10).step(0.001).name('uColorMultiplier')

// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = - Math.PI * 0.5
water.position.set(0.,0.,-0.8)
scene.add(water)



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

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(55, sizes.width / sizes.height, 0.1, 100)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
camera.position.set(0., 0.32, 0.31)
// camera.position.set(0., 0.28, 0.356)
// camera.position.set(0, 0.403, 0.330)
// LockControls
controls.enableZoom = false
controls.enablePan = false
controls.enableRotate = false
controls.maxAzimuthAngle =0 
controls.minAzimuthAngle =0


// scene.background = new THREE.Color(1,1,1,1);


/**
 * Animate
 */

const clock = new THREE.Clock()


// var sss =camera.localToWorld(new Vector3(0,0,-0.1))
textPlanemesh.parent = camera;

textPlanemesh.position.set(0,0,-0.3 );

cubePlane.parent = camera;

cubePlane.position.set(0,-0.1,-0.3);


const tick = () =>
{
    // stats.begin()
    const elapsedTime = clock.getElapsedTime()

    // Water
    waterMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    //Water Color offset

    // var waterColorOffset = (Math.sin(elapsedTime * watercoloroffsetSpeed)+0.7)*0.1;
    // waterMaterial.uniforms.uColorOffset.value = waterColorOffset

    tuniform.iGlobalTime.value  = elapsedTime
    // tuniform2.iGlobalTime.value  = elapsedTime

    //log camera position and camera angle
    // console.log(camera.position)
    // console.log(camera.rotation)
    // console.log(textPlanemesh.position);
    


// textPlaneMaterial.emissiveMap.needsUpdate = true;

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
    // stats.end()
}

tick()