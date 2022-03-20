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
import cubeVertexShader from './shaders/cubeRound/cubevertex.glsl'
import cubeFragmentShader from './shaders/cubeRound/cubefragment.glsl'
import fractureCubeVertex from './shaders/cubeFracture/fracturecubevertex.glsl'
// import fractureCubeFragment from './shaders//cubeFracture/fracturecubefragment.glsl'
// import textplanefragment from './shaders/textShader/textplanefragment.glsl'

import distordfragment from './shaders/distordVolume/distordfragment.glsl'

import sptfragment from './shaders/spt/sptfragment.glsl'
import sptvertex from './shaders/spt/sptvertex.glsl'
import Stats from 'stats.js'



/***
 * Gloabal viable
 */

let DEBUGMODE = false;
let LOCKCAM = false;

let gltfLoader, gltfLoader2

let gui, debugObject

let canvas, scene, sizes ,renderer, camera, controls, clock

let environmentMap

let textPlanemesh, textPlaneMaterial

let roundCube_mesh, roundCube_material, roundCube_uniform

let distordFxMesh, distordFxMaterial, distordFx_uniform


let cubeModel = null, cubeMaterial,cubeLoad
let cube_in_model = null, cubeInnerMaterial,cube_in_Load, cubeShellMateral,cube_line_model = null,cube_shell_model = null
let cubeMeshGroup, cubeFxGroup ,cubeRootGroup

let waterMesh,waterMaterial

let axesHelper

/**
 * Base
 */
// Debug

function init()
{
    initScene()
    initTick()
    initEvent()
    initLight()

    initEnvMap()
    initDebug()
    initHelper()
    

    initCameraControl()
    initJiduCubeMesh()
    // initWater()

    initRoundCube()
    initDistordFx()

    initHierarchy()

    initBackground()
}
function initHierarchy()
{
    // cubeRootGroup.rotateX(90)
    cubeFxGroup.position.set(0.0,0.0,0.38)

    // if(cube_shell_model!=null)
    // {

    // cubeRootGroup.position.set(0.0,2,-0.12);
    // cubeRootGroup.rotation.x = - Math.PI * 0.5
    // // }
    // cubeMeshGroup.position.set(0,0.2,0.1)

    // scene.add(cubeRootGroup)

}

function initScene()
{
    canvas = document.querySelector('canvas.webgl')
    scene = new THREE.Scene()
    sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }
    renderer = new THREE.WebGLRenderer({
        canvas: canvas
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //groups
    cubeMeshGroup = new THREE.Group()
    cubeFxGroup = new THREE.Group()
    cubeRootGroup = new THREE.Group()
    // cubeMeshGroup.parent = cubeRootGroup
    // cubeFxGroup.parent = cubeRootGroup
}
function initLight()
{
    const intensity = 5;
        const light1 = new THREE.PointLight()
        light1.intensity =intensity;
    light1.position.set (-0.1,0.25,0)

    const light2 = new THREE.PointLight()
    light2.position.set (0.1,0.05,0.2)

    const light3 = new THREE.PointLight()
    light3.position.set (-0.1,0.0,0.3)

    light2.intensity =intensity;
    light3.intensity =intensity;

    scene.add(light1)
    scene.add(light2)
    scene.add(light3)
}
function initDebug()
{
    gui = new dat.GUI({ width: 220 })
    debugObject = {}
    // const stats = new Stats()
    // document.body.appendChild(stats.dom)
    // gui.hide()
}


function initJiduCubeMesh()
{
    const size =.3;
    const sptuniform = {
        iGlobalTime:{type:'f',value:0.01},
        _IOR:{type:'f',value:1.5},
        _IOROffset:{type:'f',value:0.005},
        _FresnelPower:{type:'f',value:1},
        _FresnelAlpha:{type:'f',value:0.5},
        _ReflRefrMix:{type:'f',value:0.5},
        _ReflOffset:{type:'f',value:0.02},
        _Ke:{type:'f',value:10.3},
        _Opacity:{type:'f',value:0.6},
        _EnvTex:{value:environmentMap},
        // uColor:{value:new THREE.Color('gray')},
        uColorOverLay:{value:new THREE.Color('#ffb8ff')},
    };
    const sptShelluniform = {
        iGlobalTime:{type:'f',value:0.01},
        _IOR:{type:'f',value:1.1},
        _IOROffset:{type:'f',value:0.005},
        _FresnelPower:{type:'f',value:1},
        _FresnelAlpha:{type:'f',value:0.7},
        _ReflRefrMix:{type:'f',value:0.5},
        _ReflOffset:{type:'f',value:0.02},
        _Ke:{type:'f',value:10.3},
        _Opacity:{type:'f',value:0.5},
        _EnvTex:{value:environmentMap},
        // uColor:{value:new THREE.Color('gray')},
        uColorOverLay:{value:new THREE.Color('#ffb8ff')},
        
    }
        cubeInnerMaterial = new THREE.ShaderMaterial({
            vertexShader: sptvertex,
            fragmentShader: sptfragment,
            side:THREE.DoubleSide,
            uniforms:sptuniform
        })
        cubeShellMateral = new THREE.ShaderMaterial({
            vertexShader: sptvertex,
            fragmentShader: sptfragment,
            side:THREE.DoubleSide,
            uniforms:sptShelluniform
        })


    cubeInnerMaterial.transparent = true
    cubeInnerMaterial.side = THREE.DoubleSide
    // cubeInnerMaterial.blending = THREE.AdditiveBlending

    
    cubeShellMateral.transparent = true
    cubeShellMateral.side = THREE.DoubleSide
    // cubeShellMateral.blending = THREE.AdditiveBlending

    debugObject.uColorOverLay= '#012dbc'
    debugObject.uShellColorOverLay= '#012dbc'
    
    gui.addColor(debugObject, 'uColorOverLay').onChange(() => { cubeInnerMaterial.uniforms.uColorOverLay.value.set(debugObject.uColorOverLay) })
    gui.addColor(debugObject, 'uShellColorOverLay').onChange(() => { cubeInnerMaterial.uniforms.uColorOverLay.value.set(debugObject.uColorOverLay) })

   cube_in_Load = false
   gltfLoader2 = new GLTFLoader()
   gltfLoader2.load('/models/jiduCube_in.gltf', (gltf2) =>
    {
        cube_in_model = gltf2.scene;

        cube_in_model.children[0].material = cubeInnerMaterial
        gltf2.scene.scale.set(size, size ,size)
        cube_in_Load = true;
        cubeMeshGroup.add(cube_in_model)
    });


    const gltfLoader3 = new GLTFLoader()
    gltfLoader3.load('/models/jiduCube_line.gltf', (gltf2) =>
     {
        cube_line_model = gltf2.scene;
 
        cube_line_model.children[0].material = cubeInnerMaterial
         gltf2.scene.scale.set(size, size ,size)
 
        cubeMeshGroup.add(cube_line_model)
     });

     const gltfLoader4 = new GLTFLoader()
     gltfLoader4.load('/models/jiduCube_shell.gltf', (gltf3) =>
      {
        cube_shell_model = gltf3.scene;
  
        cube_shell_model.children[0].material = cubeShellMateral
        gltf3.scene.scale.set(size, size ,size)
  
         cubeMeshGroup.add(cube_shell_model)
      });

     scene.add(cubeMeshGroup)


gui.add(cubeInnerMaterial.uniforms._IOROffset, 'value').min(0).max(1).step(0.001).name('_IOROffset')
}



function initEnvMap()
{
    const cubeTextureLoader = new THREE.CubeTextureLoader()

    environmentMap = cubeTextureLoader.load(
        [
            '/envmap/hdr2/px.png',
            '/envmap/hdr2/nx.png',
            '/envmap/hdr2/py.png',
            '/envmap/hdr2/ny.png',
            '/envmap/hdr2/pz.png',
            '/envmap/hdr2/nz.png'
        ]
    )
}

function initBackground()
{
    scene.background = new THREE.Color('gray')
    // scene.background = new THREE.Color(debugObject.uColorBG)
    // gui.addColor(debugObject, 'uColorBG').onChange(() => { scene.background = new THREE.Color(debugObject.uColorBG)})
}

function initRoundCube()
{
    const roundcube_size = 0.48
    //Geometry
    roundCube_uniform = {
            iGlobalTime:{type:'f',value:0.01},
            iChannel0: { value: environmentMap}
    };
    const cubePlaneGeometry = new THREE.PlaneGeometry(roundcube_size,roundcube_size,2,2)
    roundCube_material = new THREE.ShaderMaterial(
        {
            vertexShader: cubeVertexShader,
            fragmentShader: cubeFragmentShader,
            side:THREE.DoubleSide,
            uniforms:roundCube_uniform
        }
    )
    roundCube_material.transparent = true
    // cubePlaneMaterial.opacity = 0.1
    roundCube_material.blending = THREE.AdditiveBlending

    // Mesh
    roundCube_mesh = new THREE.Mesh(cubePlaneGeometry, roundCube_material)
    // cubePlaneMesh.rotation.x = - Math.PI * 0.5
    // cubePlaneMesh.position.y = 0.1
    // cubePlaneMesh.position.z = 0.19
    cubeFxGroup.add(roundCube_mesh)
}

function initDistordFx()
{
    const distord_size = 0.9
    //Geometry
    distordFx_uniform = {
        iGlobalTime:{type:'f',value:0.01},
    };
    const cubePlane2Geometry = new THREE.PlaneGeometry(distord_size,distord_size,2,2)
    distordFxMaterial = new THREE.ShaderMaterial(
        {
            vertexShader: fractureCubeVertex,
            fragmentShader: distordfragment,
            side:THREE.DoubleSide,
            uniforms:distordFx_uniform
        }
    )
    distordFxMaterial.transparent = true
    // cubePlaneMaterial.opacity = 0.2
    // cubePlane3Material.blending = THREE.AdditiveBlending
    // Mesh
    distordFxMesh = new THREE.Mesh(cubePlane2Geometry, distordFxMaterial)
    // distordFxMesh.rotation.x = - Math.PI * 0.5
    // distordFxMesh.position.y = 0.1
    // distordFxMesh.position.z = 0.19
    cubeFxGroup.add(distordFxMesh)
    scene.add(cubeFxGroup)
}

function initWater()
{
    
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
    debugObject.uColorBG = 'black'




    // gui.addColor(debugObject, 'uColor1').onChange(() => { waterMaterial.uniforms.uColor1.value.set(debugObject.uColor1) })
    // gui.addColor(debugObject, 'uColor2').onChange(() => { waterMaterial.uniforms.uColor2.value.set(debugObject.uColor2) })
    // gui.addColor(debugObject, 'uColor3').onChange(() => { waterMaterial.uniforms.uColor3.value.set(debugObject.uColor3) })
    // gui.addColor(debugObject, 'uColor4').onChange(() => { waterMaterial.uniforms.uColor4.value.set(debugObject.uColor4) })


    // Water Material
    waterMaterial = new THREE.ShaderMaterial({
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
            uFar:{value:0.48},
            uNear:{value:0.015}
        }
    })


    // gui.add(waterMaterial.uniforms.uColorMiddeloffset, 'value').min(0.0001).max(5).step(0.01).name('uColorMiddeloffset')
    // gui.add(waterMaterial.uniforms.uFar, 'value').min(0.0001).max(2).step(0.001).name('uFar')
    // gui.add(waterMaterial.uniforms.uNear, 'value').min(0.0001).max(0.1).step(0.001).name('uNear')
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
    waterMesh = new THREE.Mesh(waterGeometry, waterMaterial)
    waterMesh.rotation.x = - Math.PI * 0.5
    waterMesh.position.set(0.,0.,-0.8)
    scene.add(waterMesh)
}


function initHelper()
{

    axesHelper = new THREE.AxesHelper( 5 );
}

function initCameraControl()
{
    // Base camera
    camera = new THREE.PerspectiveCamera(55, sizes.width / sizes.height, 0.1, 100)

    // Controls
    controls = new OrbitControls(camera, canvas)
    camera.position.set(0., 0., 2)
    // camera.position.set(0., 0.28, 0.356)
    // camera.position.set(0, 0.403, 0.330)

    // LockControls
    if(LOCKCAM)
    {
        controls.enableZoom = false
        controls.enablePan = false
        controls.enableRotate = false
        controls.maxAzimuthAngle =0 
        controls.minAzimuthAngle =0
    }
    
    scene.add(camera)
}



function initEvent()
{
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
}


function initTick()
{
    clock = new THREE.Clock()
}


function debugTick()
{
    if(DEBUGMODE)
    {
        //log camera position and camera angle
        console.log(camera.position)
        // console.log(camera.rotation)
    }
}




const tick = () =>
{
    // stats.begin()
    const elapsedTime = clock.getElapsedTime()

    // Water
    if(waterMaterial)
    {
        waterMaterial.uniforms.uTime.value = elapsedTime
    }

    if( cube_in_model !=null )
    {

        // cubeModel.rotation.y += 0.001
        // cubeModel2.rotation.y += 0.001
        cubeMeshGroup.rotation.y +=0.001
        cubeMeshGroup.rotation.x +=0.001
        cubeMeshGroup.rotation.z +=0.001
    }
    // Update controls
    controls.update()

    //Water Color offset

    // var waterColorOffset = (Math.sin(elapsedTime * watercoloroffsetSpeed)+0.7)*0.1;
    // waterMaterial.uniforms.uColorOffset.value = waterColorOffset

    roundCube_uniform.iGlobalTime.value  = elapsedTime*0.3
    distordFx_uniform.iGlobalTime.value  = elapsedTime*0.3
    // tuniform2.iGlobalTime.value  = elapsedTime

    debugTick()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
    // stats.end()
}

init()
tick()