import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import {  RGBA_ASTC_10x5_Format, Vector2, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { floorPowerOfTwo } from 'three/src/math/mathutils'
import cubeVertexShader from './shaders/cubeRound/cubevertex.glsl'
import cubeFragmentShader from './shaders/cubeRound/cubefragment.glsl'
import fractureCubeVertex from './shaders/cubeFracture/fracturecubevertex.glsl'
import distordfragment from './shaders/distordVolume/distordfragment.glsl'
import gradientfragment from './shaders/gradient/fragment.glsl'
import gradientvertex from './shaders/gradient/vertex.glsl'
import energyfragment from './shaders/energy/energyfragment.glsl'
import energyvertex from './shaders/energy/energyvertex.glsl'
import Stats from 'stats.js'
import gsap from 'gsap'



/***
 * Gloabal viable
 */

let DEBUGMODE = false;
let LOCKCAM = true;
let gui, debugObject
let canvas, scene, sizes ,renderer, camera, controls, clock
let environmentMap
let roundCube_mesh, roundCube_material, roundCube_uniform
let distordFxMesh, distordFxMaterial, distordFx_uniform
let cube_in_model = null, cubeInnerMaterial,cube_in_Load, cubeShellMateral,cube_line_model = null,cube_shell_model = null
let cubeMeshGroup, cubeFxGroup ,cubeRootGroup
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

    initEnvMap()
    initDebug()
    initHelper()
    

    initCameraControl()
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
    energyMaterial.blending = THREE.AdditiveBlending
    // Mesh
    const energy_mesh = new THREE.Mesh(energy_geometory, energyMaterial)
    cubeFxGroup.add(energy_mesh)
}

//gradient color define
let activeColor = 4

var sectionColorList = 
[
    [ '#3397FF', '#6BC4FF', '#AD7DF0', '#A7AEFE', '#311b6f'],
    [ '#2A74F0', '#5BF4C3', '#70D3EA', '#57C9E2' ,'#073d54'],
    [ '#F3BB40', '#6AE5CE', '#CDC77A', '#F3BB40' ,'#52430f'],
    [ '#F5689B', '#F5689B', '#E8E39B', '#F5689B' ,'#473010'],
    [ '#F37DB2', '#E68BD6', '#F37DB2', '#E68BD6' ,'#49122d'],
    [ '#9DE3F5', '#9DE3F5', '#B984F6', '#8861F5' ,'#100d45']
];


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
        noiseFlow:uniseed
    };
    // init color
    colorlayers_uniform = getColorLayers(sectionColorList[0])
}
function getColorLayers(colorsection)
{   
    let colorlayer=[];
    for (let e = 0; e < activeColor; e += 1) {

        colorlayer[e] = 
        {
            color:  new THREE.Color( colorsection[e]),
            noiseFreq: new Vector2(2 + e / activeColor, 3 + e / activeColor),
            noiseSpeed: 5 + .3 * e,
            noiseFlow:  3.5 + .3 * e,
            noiseSeed: uniseed + 10 * e,
            noiseFloor: .1,
            noiseCeil: .63 + .07 * e,
        }
    }
    return colorlayer 
}
function SetLayersColor(colorlist)
{
    for (let e = 0; e < activeColor; e += 1) {

        gradient_material.uniforms.u_waveLayers.value[e].color=  new THREE.Color( colorlist[e])
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
}

function initDebug()
{
    gui = new dat.GUI({ width: 220 })
    debugObject = {}
    stats = new Stats()
    document.body.appendChild(stats.dom)
    // gui.hide()
}

function initEnvMap()
{
    const cubeTextureLoader = new THREE.CubeTextureLoader()

    environmentMap = cubeTextureLoader.load(
        [
            '/envmap/hdr4/px.png',
            '/envmap/hdr4/nx.png',
            '/envmap/hdr4/py.png',
            '/envmap/hdr4/ny.png',
            '/envmap/hdr4/pz.png',
            '/envmap/hdr4/nz.png'
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
            u_chromeOffset:{type:'f',value:0.01},
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
        // console.log(camera.rotation)    }
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
    // Update controls
    controls.update()

    if(roundCube_mesh!=null && distordFxMesh!=null)
    {
        roundCube_uniform.iGlobalTime.value  = elapsedTime*0.3
        distordFx_uniform.iGlobalTime.value  = elapsedTime*0.3
    }

    debugTick()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
    stats.end()
}

init()
tick()

function animatColor()
{
    colorlayers_uniform = getColorLayers(sectionColorList[0])
    gradient_material.uniforms.u_waveLayers.value = colorlayers_uniform;

    for(var e = 0 ;e<activeColor; e+=1)

    {
        var tempColor= {color:'white'};
        gsap.to(tempColor, {color:(sectionColorList[2][e]), duration:1, onUpdate:()=>{
        try{
            gradient_material.uniforms.u_waveLayers.value[e].color = new THREE.Color(tempColor.color)
            console.log(tempColor);
        }
        catch(err)
        {}
        }
    })
    
    }
}
// animatColor()

var changecolor =
{
    colorID:0
}
var colorselection ={
    color0:0,
    color1:1,
    color2:2,
    color3:3,
    color4:4,
    color5:5
}
gui.add(changecolor,'colorID',colorselection).onChange(()=>{
    colorlayers_uniform = getColorLayers(sectionColorList[changecolor.colorID])
    console.log(colorlayers_uniform)
    gradient_material.uniforms.u_waveLayers.value = colorlayers_uniform
    roundCube_material.uniforms.u_colorOverlay.value = new THREE.Color(sectionColorList[changecolor.colorID][4])
    
})
