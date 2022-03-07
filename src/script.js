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

const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        console.log(child)
    }
    )
}

/**
 * Light
 */

const light1 = new THREE.PointLight()
light1.position.set (-0.1,0.25,0)

const light2 = new THREE.PointLight()
light2.position.set (0.1,0.05,0.2)

const light3 = new THREE.PointLight()
light3.position.set (-0.1,0.0,0.3)

scene.add(light1)
scene.add(light2)
scene.add(light3)


/**
 * 3d Font
 */

 const fontLoader = new FontLoader()


var textsize =0.02
var texts = ["testtext01","testtext02","testtext03","testtext04","testtext05","testtext06","testtext07",
"testtext08",
"testtext08",
"testtext08",
"testtext08",
] ;
var textList =[];

const textMaterialIns = new THREE.MeshBasicMaterial()
 fontLoader.load(
     '/fonts/helvetiker_regular.typeface.json',
     (font) =>
     {

         // Material
         for(var i=0;i<texts.length;i++)
         {
             var text = new THREE.Mesh()
             textsize = getRandomTextSize() ;
             var textGeometry = new TextGeometry(
                 texts[i],
                 {
                     font:font,
                     size: textsize,
                     height: 0.000001,
                     curveSegments: 5,
                     bevelEnabled: true,
                     bevelThickness: 0.000001,
                     bevelSize: 0.000001,
                     bevelOffset: 0,
                     bevelSegments: 5
                 }
             )
             textGeometry.center()
             textGeometry.rotateX(-Math.PI/2)
             var px = getRandomPX();
             var pz =  Math.round(Math.random()*10)/10 - 0.6 ;
             textGeometry.translate(px,0.1,pz) ;
             text.material = textMaterialIns ;
             text.geometry = textGeometry ;
            // temperaly display background
            //  scene.add(text) ;
             textList[i] = text ;
         }
         //生成文本移动速度
         generateRandomSpeeds() ;
     }
 )
//  textMaterialIns.transparent = true;
 textMaterialIns.opacity = 0.3

function getRandomPX()
{
    var px = Math.round(Math.random()*3)/10 - 0.15 ;
    return px ;
}

function getRandomTextSize()
{
    const minsize =0.013
    var textSize =  Math.random()*minsize +minsize;
    return textSize ;
}
/**
 * Cube
 */
//  const cubesize = 0.04;
//  const cubesize = 1;
//  const cubeGeo = new THREE.BoxGeometry( cubesize, cubesize, cubesize )
 const cubeMaterial = new THREE.MeshPhysicalMaterial( )
 cubeMaterial.transparent = true
 cubeMaterial.side = THREE.DoubleSide


 const cube = new THREE.Mesh()
 cube.position.set(0,0.15,0.22)
//  scene.add( cube )

 /**
  * Material Cube
  */
 
//  cubeMaterial.color.set('#ffb9df')
 cubeMaterial.transmission = 0.9
 cubeMaterial.opacity= 0.7
 cubeMaterial.ior= 1.25
//  cubeMaterial.emissive.set('#ffb9df')
 cubeMaterial.emissive.set('#ffb9bc')
 cubeMaterial.emissiveIntensity = 0.1

 cubeMaterial.roughness= 0.45
 cubeMaterial.metalness= 0.06 
 cubeMaterial.reflectivity = 0.2
 cubeMaterial.thickness= 4.5
 cubeMaterial.envMap = environmentMap;
 cubeMaterial.envMapIntensity = 1.2;
 cubeMaterial.clearcoat = 2;
 cubeMaterial.clearcoatMap= environmentMap;
gui.add(cubeMaterial, 'metalness').min(0).max(1).step(0.0001)
gui.add(cubeMaterial,'roughness').min(0).max(1).step(0.001)
gui.add(cubeMaterial,'ior').min(1).max(2).step(0.001)
gui.add(cubeMaterial,'transmission').min(0).max(1).step(0.001)
gui.add(cubeMaterial,'opacity').min(0).max(1).step(0.001)
gui.add(cubeMaterial,'thickness').min(0).max(5).step(0.001)
gui.add(cubeMaterial,'reflectivity').min(0).max(1).step(0.001)
gui.add(cubeMaterial,'emissiveIntensity').min(0).max(1).step(0.001)

/**
 * Models
 */
 const dracoLoader = new DRACOLoader()
 dracoLoader.setDecoderPath('/draco/')
 
 const gltfLoader = new GLTFLoader()
 gltfLoader.setDRACOLoader(dracoLoader)
 
//  let mixer = null

let beveledCube =null;

 
 gltfLoader.load(
     '/models/bevelCube2.gltf',
     (gltf) =>
     {
        beveledCube = gltf.scene.children[0];
         const scale =0.3 
         gltf.scene.scale.set(scale, scale, scale) 
         // temperaly display background
        //  scene.add(gltf.scene)
         beveledCube.material = cubeMaterial
        gltf.scene.position.set(0,0.15,0.22)
        updateAllMaterials();
     }
 )

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
controls.enablePan = false
controls.maxAzimuthAngle =0 
controls.minAzimuthAngle =0
// controls.maxPolarAngle = 0
// controls.minPolarAngle = 0
camera.position.set(0, 0.462, 0.244)
// controls.enableRotate = false

controls.enableZoom = false

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
const rotationSpeed = 0.005
const maxtextSpeed = 0.008
const mintextSpeed = maxtextSpeed*0.1
const watercoloroffsetSpeed = 0.01;

var upPz = -0.6 ;
var downPz = 1 ;
var textSpeeds = []
function generateRandomSpeeds()
{
    for(var i=0 ;i<textList.length;i++)
    {
        var speed = Math.random()*mintextSpeed+mintextSpeed ;
        speed = Math.max(speed,mintextSpeed)
        speed = Math.min(speed,maxtextSpeed)
        textSpeeds[i] = speed ;
    }
}


const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Water
    waterMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()
    
    //cube animation 
    if(beveledCube!=null)
    {
        beveledCube.rotation.x += rotationSpeed
        beveledCube.rotation.y += rotationSpeed
        beveledCube.rotation.z += rotationSpeed
    }

    //text animation

    for(var i=0;i<textList.length;i++)
    {
        var t = textList[i] ;
        var pz = t.position.z ;
        pz += textSpeeds[i] ;
        if(pz > downPz)
        {
            pz = upPz ;
            t.position.x = getRandomTextSize() ;
            t.geometry.size = getRandomTextSize() ;
        }
        t.position.z = pz ;
    }

    //Water Color offset

    // var waterColorOffset = (Math.sin(elapsedTime * watercoloroffsetSpeed)+0.7)*0.1;
    // waterMaterial.uniforms.uColorOffset.value = waterColorOffset


    //log camera position and camera angle
    // console.log(camera.position)
    // console.log(camera.rotation)

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}


tick()