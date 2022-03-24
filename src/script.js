import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'
import { Blending, CubeTextureLoader, RGBA_ASTC_10x5_Format, Vector2, Vector3 } from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import typefaceFont from 'three/examples/fonts/helvetiker_regular.typeface.json'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader} from 'three/examples/jsm/loaders/HDRCubeTextureLoader'
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

import gradientfragment from './shaders/gradient/fragment.glsl'
import gradientvertex from './shaders/gradient/vertex.glsl'

import energyfragment from './shaders/energy/energyfragment.glsl'
import energyvertex from './shaders/energy/energyvertex.glsl'
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

let gradient_material, energy_material

let axesHelper

let stats


var colorlayers_uniform=[] 
let vertDeform_uniform
let gradient_global_uniform
let energy_uniform, energyMaterial
const uniseed = 1


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
    // initJiduCubeMesh()
    initGradientBG()

    initEnergy()

    initRoundCube()
    // initDistordFx()
    scene.add(cubeFxGroup)
    

    initHierarchy()

    initBackground()
}

function initHierarchy()
{
    // cubeRootGroup.rotateX(90)
    cubeFxGroup.position.set(0.0,0.0,0.48)

    // if(cube_shell_model!=null)
    // {

    // cubeRootGroup.position.set(0.0,2,-0.12);
    // cubeRootGroup.rotation.x = - Math.PI * 0.5
    // // }
    // cubeMeshGroup.position.set(0,0.2,0.1)

    // scene.add(cubeRootGroup)

}

function initEnergy()
{
    const energy_size = 0.8
    // instantiate a loader
    const texture = new THREE.TextureLoader().load('textures/RGBNoiseMedium.png');
    // const texture = new THREE.TextureLoader().load('textures/RGBNoiseBig.png');
    energy_uniform = {
        iGlobalTime:{type:'f',value:0.01},
        iChannel0: { type: 't', value: texture },
        u_intensity:{value:1.},
        u_rot:{value:new Vector2(0)},
    };

    //Geometry

    const energy_geometory= new THREE.PlaneGeometry(energy_size,energy_size,2,2)
    energyMaterial= new THREE.ShaderMaterial(
        {
            vertexShader: energyvertex,
            fragmentShader: energyfragment,
            // side:THREE.DoubleSide,
            uniforms:energy_uniform
        }
    )
    energyMaterial.transparent = true
    // cubePlaneMaterial.opacity = 0.2
    energyMaterial.blending = THREE.AdditiveBlending
    // Mesh
    const energy_mesh = new THREE.Mesh(energy_geometory, energyMaterial)
    // distordFxMesh.rotation.x = - Math.PI * 0.5
    // distordFxMesh.position.y = 0.1
    // distordFxMesh.position.z = 0.19
    cubeFxGroup.add(energy_mesh)
}

//gradient color define
var sectionColors = [ '#3397FF', '#6BC4FF', '#AD7DF0', '#A7AEFE','#311b6f' ]
// var sectionColors = [ '#2A74F0', '#5BF4C3', '#70D3EA', '#57C9E2' ,'#073d54']
// var sectionColors = [ '#F3BB40', '#6AE5CE', '#CDC77A', '#F3BB40' ,'#0a0e43']
// var sectionColors = [ '#F5689B', '#F5689B', '#E8E39B', '#F5689B' ,'#473010']
// var sectionColors = [ '#F37DB2', '#E68BD6', '#F37DB2', '#E68BD6' ,'#49122d']
// var sectionColors = [ '#9DE3F5', '#9DE3F5', '#B984F6', '#8861F5' ,'#100d45']
let activeColor = 4

function initGradientUniform ()
{
    let rotateangle = Math.PI/2
    gradient_global_uniform = {
        noiseFreq : 0.9,
        noiseSpeed : 0.2,
        intensity : 0.5,
    }
    vertDeform_uniform = {
        incline:Math.sin(10)/Math.cos(10),
        offsetTop:-0.5,
        offsetBottom:-0.5,
        noiseFreq:new Vector2(3,4),
        noiseAmp:1,
        noiseSpeed:5,
        noiseFlow:3,
        noiseFlow:uniseed,
    };
    for (let e = 0; e < activeColor; e += 1) {

        colorlayers_uniform[e] = 
        {
            color:  new THREE.Color( sectionColors[e]),
            noiseFreq: new Vector2(2 + e / activeColor, 3 + e / activeColor),
            noiseSpeed: 5 + .3 * e,
            noiseFlow:  3.5 + .3 * e,
            noiseSeed: uniseed + 10 * e,
            noiseFloor: .1,
            noiseCeil: .63 + .07 * e,
        }
    }
}



function initGradientBG()
{
     initGradientUniform()
        
    // Geometry
    const gradient_geometory= new THREE.PlaneGeometry(6.1, 6.1, 256,256) 

     let Uniforms = {
        u_time: { value: 0 },
        u_intensiy :{value: 1},
        u_baseColor: { value: new THREE.Color(debugObject.uRampColor1) },
        u_tile:{value: new Vector2(1,1)},
        u_waveLayers_length: { value: 4 },
        u_active_colors: { value: [1,1,1,1] },
        u_global:{
            value:gradient_global_uniform},
        u_vertDeform:{
            value:vertDeform_uniform},
        u_waveLayers:
        {
            value: colorlayers_uniform,
        }
    }

    gradient_material= new THREE.ShaderMaterial({
        vertexShader: gradientvertex,
        fragmentShader: gradientfragment,
        uniforms:Uniforms
    })

    // Mesh
    const gradient_mesh= new THREE.Mesh(gradient_geometory, gradient_material)
    // gradient_mesh.rotation.x = - Math.PI * 0.5
    gradient_mesh.position.set(0.,-0.9,-0.8)


    scene.add(gradient_mesh)

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
    stats = new Stats()
    document.body.appendChild(stats.dom)
    // gui.hide()
}


function initJiduCubeMesh()
{
    const size =.3;
    const sptuniform = {
        iGlobalTime:{type:'f',value:0.01},
        _IOR:{type:'f',value:1.3},
        _IOROffset:{type:'f',value:0.007},
        _FresnelPower:{type:'f',value:1},
        _FresnelAlpha:{type:'f',value:1},
        _ReflRefrMix:{type:'f',value:1},
        _ReflOffset:{type:'f',value:0.002},
        _Ke:{type:'f',value:9.3},
        _Opacity:{type:'f',value:0.3},
        _EnvTex:{value:environmentMap},
        uColor:{value:new THREE.Color('white')},
        uColorOverLay:{value:new THREE.Color('white')},
    };
    const sptShelluniform = {
        iGlobalTime:{type:'f',value:0.01},
        _IOR:{type:'f',value:1.1},
        _IOROffset:{type:'f',value:0.003},
        _FresnelPower:{type:'f',value:1},
        _FresnelAlpha:{type:'f',value:0.7},
        _ReflRefrMix:{type:'f',value:0.5},
        _ReflOffset:{type:'f',value:0.002},
        _Ke:{type:'f',value:10.3},
        _Opacity:{type:'f',value:0.2},
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
    cubeShellMateral.blending = THREE.AdditiveBlending

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
  
        //  cubeMeshGroup.add(cube_shell_model)
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
    const roundcube_size = 0.58
    //Geometry
    debugObject.u_colorOverlay= '#33203c'

    gui.addColor(debugObject, 'u_colorOverlay').onChange(() => { roundCube_material.uniforms.u_colorOverlay.value= new THREE.Color(debugObject.u_colorOverlay)})
    roundCube_uniform = {
            iGlobalTime:{type:'f',value:0.01},
            u_intensity:{type:'f',value:2.8},
            u_opacityOffset:{type:'f',value:0.55},
            u_opacity:{type:'f',value:1},
            u_colorOverlay:{value:new THREE.Color(debugObject.u_colorOverlay)},
            u_colorOverlayIntensity:{value:0.7},
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
    // roundCube_material.blending = THREE.AdditiveBlending

    // Mesh
    roundCube_mesh = new THREE.Mesh(cubePlaneGeometry, roundCube_material)
    cubeFxGroup.add(roundCube_mesh)
    roundCube_mesh.position.z = -0.02
    
    


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
    stats.begin()
    const elapsedTime = clock.getElapsedTime()

    if(roundCube_material)
    {
        roundCube_material.uniforms.iGlobalTime.value = elapsedTime*0.5
    }

    if(gradient_material)
    {
        gradient_material.uniforms.u_time.value = elapsedTime*0.1
    }
    if(energyMaterial)
    {
        energyMaterial.uniforms.iGlobalTime.value = elapsedTime*1.5
        energyMaterial.uniforms.u_rot.value = new Vector2((Math.sin(elapsedTime)+1)*0.15,0.2)
        // energyMaterial.uniforms.u_rot.value = new Vector2(0.5,0.5)
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
    if(roundCube_mesh!=null && distordFxMesh!=null)
    {
        roundCube_uniform.iGlobalTime.value  = elapsedTime*0.3
        distordFx_uniform.iGlobalTime.value  = elapsedTime*0.3
    }
    // tuniform2.iGlobalTime.value  = elapsedTime

    debugTick()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
    stats.end()
}

init()
tick()