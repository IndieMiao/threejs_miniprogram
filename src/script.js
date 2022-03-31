import '../static/css/swiper-bundle.min.css'
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import {  RGBA_ASTC_10x5_Format, Vector2, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import cubeVertexShader from './shaders/cubeRound/cubevertex.glsl'
import cubeFragmentShader from './shaders/cubeRound/cubefragment.glsl'
import fractureCubeVertex from './shaders/cubeFracture/fracturecubevertex.glsl'
import distordfragment from './shaders/distordVolume/distordfragment.glsl'
import gradientfragment from './shaders/gradient/fragment.glsl'
import gradientvertex from './shaders/gradient/vertex.glsl'
import energyfragment from './shaders/energy/energyfragment.glsl'
import energyvertex from './shaders/energy/energyvertex.glsl'
import {Text} from 'troika-three-text'
import Stats from 'stats.js'
import gsap from 'gsap'
import {abs} from "three/examples/jsm/nodes/ShaderNode";
gsap.registerPlugin(CustomEase)
// import { floorPowerOfTwo } from 'three/src/math/mathutils'
// import {TextGl} from './textFx.js'



/***
 * Gloabal viable
 */

let DEBUGMODE = false;
let LOCKCAM = false;
let gui, debugObject
let canvas, scene, sizes ,renderer, camera, controls, clock
let environmentMap
let roundCube_mesh, roundCube_material, roundCube_uniform
let distordFxMesh, distordFxMaterial, distordFx_uniform
let cube_in_model = null, cubeInnerMaterial,cube_in_Load, cubeShellMateral,cube_line_model = null,cube_shell_model = null
let cubeMeshGroup, cubeFxGroup ,cubeRootGroup
// let roundcube_size
let gradient_material
let energy_mesh
let axesHelper
let stats


var colorlayers_uniform=[]
let vertDeform_uniform
let gradient_global_uniform
let energy_uniform, energy_material
const uniseed = 1.0

let myText


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
    // initText()

    initRoundCube()
    // initDistordFx()
    scene.add(cubeFxGroup)


    initHierarchy()

    initBackground()
}

function initText()
{
    myText = new TextGl('选项一 test , 测试')
    console.log(myText.getLength())
    scene.add(myText.text)
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
    const energy_size = 0.2
    // instantiate a loader
    const texture = new THREE.TextureLoader().load('textures/RGBNoiseMedium.png');
    energy_uniform = {
        iGlobalTime:{type:'f',value:0.01},
        iChannel0: { type: 't', value: texture },
        u_intensity:{value:0.8},
        u_rot:{value:new Vector2(0)},
    };

    //Geometry

    const energy_geometory= new THREE.PlaneGeometry(energy_size,energy_size,2,2)
    energy_material= new THREE.ShaderMaterial(
        {
            vertexShader: energyvertex,
            fragmentShader: energyfragment,
            // side:THREE.DoubleSide,
            uniforms:energy_uniform
        }
    )
    energy_material.transparent = true
    energy_material.blending = THREE.AdditiveBlending
    // Mesh
    energy_mesh = new THREE.Mesh(energy_geometory, energy_material)
    cubeFxGroup.add(energy_mesh)
}

//gradient color define
let active_color_number = 4

const sectionColorList =
    [
        {
            colorLayers: ['#9f5ffe','#4c39ec','#d04e98', '#6c1fff'],
            cubeColor: '#151515',
            baseColor: '#76f6fa',
            absorbColor: '#000000'
        },
        {
            colorLayers: ['#3397FF', '#6BC4FF', '#AD7DF0', '#A7AEFE'],
            cubeColor: '#311b6f',
            baseColor: '#dcf2ff',
            absorbColor: '#380f05'
        },
        {
            colorLayers: ['#2A74F0', '#5BF4C3', '#70D3EA', '#57C9E2'],
            cubeColor: '#06264d',
            baseColor: '#acffe5',
            absorbColor: '#2f0512'
        },
        //a2cd7a ,3be05b
        {
            colorLayers: ['#ab890d', '#F3BB40', '#8acc52', '#a2cd7a'],
            cubeColor: '#3d3f0e',
            baseColor: '#ffe7b9',
            absorbColor: '#2f0821'
        },
        {
            colorLayers: ['#F5689B', '#fd4b89', '#E8E39B', '#9f1f4e'],
            cubeColor: '#480729',
            baseColor: '#ffb9d5',
            absorbColor: '#130823'
        },
        {
            colorLayers: ['#F37DB2', '#E68BD6', '#F37DB2', '#E68BD6'],
            cubeColor: '#420a27',
            baseColor: '#ffb8d4',
            absorbColor: '#0b2d18'
        },
        {
            colorLayers: ['#42a6be', '#6bceec', '#B984F6', '#8861F5'],
            cubeColor: '#100d45',
            baseColor: '#a9deef',
            absorbColor: '#2f0926'
        }
    ];


function initGradientUniform ()
{
    let rotateangle = Math.PI/2
    gradient_global_uniform = {
        noiseFreq : 0.9,
        noiseSpeed : 0.2,
        intensity : 0.5,
        u_rampMaskOffset:1,
        u_rampMaskPow:0.4,
    }
    vertDeform_uniform = {
        incline:Math.sin(10)/Math.cos(10),
        offsetTop:-0.5,
        offsetBottom:-0.5,
        noiseFreq:new Vector2(3,4),
        noiseAmp:1,
        noiseSpeed:5,
        noiseFlow:5,
        noiseSeed:uniseed
    };
    // init color
    colorlayers_uniform = getColorLayers(sectionColorList[0])
}
function getColorLayers(colorsection)
{
    let colorlayer=[];
    for (let e = 0; e < active_color_number; e += 1) {

        colorlayer[e] =
            {
                color: new THREE.Color(colorsection.colorLayers[e]),
                noiseFreq: new Vector2(2 + e / active_color_number, 3 + e / active_color_number),
                noiseSpeed: 5 + .3 * e,
                noiseFlow:  3.5 + .3 * e,
                noiseSeed: uniseed + 10 * e,
                noiseFloor: .01,
                noiseCeil: .63 + .07 * e,
                baseColor:colorsection.baseColor,
                cubeColor:colorsection.cubeColor,
                // noiseCeil: .63 + .07 * e,
            }
    }
    return colorlayer
}

function initGradientBG()
{
    initGradientUniform()

    // Geometry
    const gradient_geometory= new THREE.PlaneGeometry(6.1, 6.1, 256,256)

    let Uniforms = {
        u_time: {value: 0 },
        u_intensiy :{value: 1},
        u_baseColor: {value: new THREE.Color(colorlayers_uniform[0].baseColor)},
        u_tile:{value: new Vector2(1,1)},
        u_waveLayers_length: { value: active_color_number },
        u_rampMaskOffset: {value:gradient_global_uniform.u_rampMaskOffset},
        u_rampMaskPow: {value:gradient_global_uniform.u_rampMaskPow},
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
    gradient_material.transparent = true

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
            '/textures/hdr5/px.png',
            '/textures/hdr5/nx.png',
            '/textures/hdr5/py.png',
            '/textures/hdr5/ny.png',
            '/textures/hdr5/pz.png',
            '/textures/hdr5/nz.png'
        ]
    )
}

function initBackground()
{
    scene.background = new THREE.Color('black')
    // scene.background = new THREE.Color(debugObject.uColorBG)
    // gui.addColor(debugObject, 'uColorBG').onChange(() => { scene.background = new THREE.Color(debugObject.uColorBG)})
}

function initRoundCube()
{
    const roundcube_size = 0.32
    //Geometry
    roundCube_uniform = {
        iGlobalTime:{type:'f',value:0.01},
        u_intensity:{type:'f',value:1.6},
        u_opacityOffset:{type:'f',value:0.55},
        u_opacity:{type:'f',value:1},
        u_chromeOffset:{type:'f',value:0.01},
        u_colorOverlay:{value:new THREE.Color('#131313')},
        u_colorOverlayIntensity:{value:0.7},
        u_cameraPerspective:{value:3.5},
        u_cameraOffset:{value:6},
        u_absorb:{value:new THREE.Color('#000')},
        u_cubePhi:{value:4.4},
        u_dist:{value:12},
        u_inner_rot_offset:{value: new Vector3(0,0,0)},
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
    roundCube_mesh.position.y = -1.5
}

function initDistordFx()
{
    const distord_size = 0.9
    //Geometry
    distordFx_uniform = {
        iGlobalTime: {type: 'f', value: 0.01},
        u_ray: {value: 96},
        u_intensity: {value: 100.},
    } ;
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
    if(energy_material)
    {
        energy_material.uniforms.iGlobalTime.value = elapsedTime*1.5
        energy_material.uniforms.u_rot.value = new Vector2((Math.sin(elapsedTime)+1)*0.15,0.2)
        // energyMaterial.uniforms.u_rot.value = new Vector2(0.5,0.5)
    }
    // Update controls
    controls.update()

    if(roundCube_mesh!=null && distordFxMesh!=null)
    {
        roundCube_uniform.iGlobalTime.value  = elapsedTime*0.3
        distordFx_uniform.iGlobalTime.value  = elapsedTime*0.3
    }
    // myText.text.sync()
    debugTick()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
    stats.end()
}

init()
tick()



CustomEase.create("custom", "M0,0 C0.126,0.382 0.136,1 0.37,1 0.61,1 0.818,0.001 1,0 ");
// const energy_fx= {
//     absorb_fx:function (){
//         const absorb_scale = {scale:0.5}
//         const duration = 4
//         energy_mesh.scale.set(absorb_scale.scale)
//         energy_material.uniforms.u_intensity.value = 0
//
//         gsap.to(energy_material.uniforms.u_intensity,{value:1.3, duration:duration, ease:'custom'})
//         gsap.to(absorb_scale,{scale:1.8,duration:duration,ease:'custom', onUpdate:()=>{
//             energy_mesh.scale.set(absorb_scale.scale,absorb_scale.scale,absorb_scale.scale)
//         }})
//     }
// }
// gui.add(energy_fx,'absorb_fx')

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
    color5:5,
    color6:6
}

let latest_color_id = 0
gui.add(changecolor,'colorID',colorselection).onChange(()=>{
    console.log(changecolor.colorID)
    animate_gradient(latest_color_id,changecolor.colorID,2)
latest_color_id = changecolor.colorID
})

function animate_gradient(origin_id,target_id, duration)
{
    const origin_gradient = getGradient(origin_id)
    const target_gradient = getGradient(target_id)
    let tl = gsap.timeline();
    let base_color_trans = {base_color:origin_gradient.baseColor}
    let cube_color_trans = {overlay_color:origin_gradient.cubeColor, absorb_color: origin_gradient.absorbColor}

    function getGradient(gradient_id)
    {
        return sectionColorList[gradient_id]
    }

    // energy_fx color
    const origin_scale = 1.7
    const absorb_scale = {scale:1.}
    const energy_duration = duration*2
    const inner_rot = {inner_rot_offset:0}
    energy_mesh.scale.set(origin_scale)
    energy_material.uniforms.u_intensity.value = 0.8

    tl.to(energy_material.uniforms.u_intensity,{value:1.5, duration:energy_duration, ease:'custom'},'+=1.5')
    tl.fromTo(absorb_scale,{scale:origin_scale},{scale:3.5,duration:energy_duration,ease:'custom', onUpdate:()=>{
        energy_mesh.scale.set(absorb_scale.scale,absorb_scale.scale,absorb_scale.scale)
    }}, "<")

    tl.fromTo(inner_rot,{inner_rot_offset:0},{inner_rot_offset:10,duration:energy_duration*2,ease:'custom', onUpdate:()=>{
            roundCube_material.uniforms.u_inner_rot_offset.value = new Vector3(inner_rot.inner_rot_offset)
        }}, "<-1")
    //cube color
    tl.to(cube_color_trans,{overlay_color:target_gradient.cubeColor, duration:duration, onUpdate:()=>
        {
            // console.log('overlay:'+ target_gradient.cubeColor)
            roundCube_material.uniforms.u_colorOverlay.value = new THREE.Color(cube_color_trans.overlay_color)
        }
},"<0.75")
    tl.to(cube_color_trans,{absorb_color:target_gradient.absorbColor, duration:duration, onUpdate:()=>
        {
            roundCube_material.uniforms.u_absorb.value = new THREE.Color(cube_color_trans.absorb_color)
        }
},"<")


    //gradient color
    tl.to(base_color_trans,{base_color:target_gradient.baseColor, duration:duration, onUpdate:()=>
        {
            gradient_material.uniforms.u_baseColor.value = new THREE.Color( base_color_trans.base_color)
        }
},"<")

    for(let i=0; i<active_color_number; i+=1)
    {
        const gradient_color = {color:origin_gradient.colorLayers[i]}
        // console.log(gradient_color)
        tl.to(gradient_color,{color:target_gradient.colorLayers[i], duration:duration, onUpdate:()=>
            {
                gradient_material.uniforms.u_waveLayers.value[i].color = new THREE.Color( gradient_color.color)
            }},"<")
    }
}

const cube_fx= {
    pos:{ x:0, y:0, },
    size: 0.5,
}

const cube_fx_function = {
    scale_up:function(){
        cube_fx.size = 1
        gsap.to(cube_fx,{size:1.7, duration:1, onUpdate:()=>{
            roundCube_mesh.scale.set(cube_fx.size,cube_fx.size,cube_fx.size)
            energy_mesh.scale.set(cube_fx.size,cube_fx.size,cube_fx.size)
        }})
    },
    scale_down:function(){
        cube_fx.size = 1.7
        gsap.to(cube_fx,{size:1, duration:1, onUpdate:()=>{
            roundCube_mesh.scale.set(cube_fx.size,cube_fx.size,cube_fx.size)
            energy_mesh.scale.set(cube_fx.size,cube_fx.size,cube_fx.size)
        }})
    },
    pos_fx:()=>{animate_cube_posy(-1.5,0.38,1.5)},
rot_fx:function(){},
}
function animate_cube_posy(origin_y, target_y, duration){
    roundCube_mesh.position.y = origin_y
    energy_mesh.position.y = origin_y
    gsap.to(roundCube_mesh.position,{y:target_y, duration:duration })
    gsap.to(energy_mesh.position,{y:target_y, duration:duration })
}
gui.add(cube_fx_function,'scale_up')
gui.add(cube_fx_function,'scale_down')
gui.add(cube_fx_function,'pos_fx')

let intro_number = 0
let intro_offset_list = [-0.66,-0.55,-0.38,1]

const gradient_fx = {
    intro:function (){
        const intro_step = intro_number % 4
        // let intro_offset= -0.66 + (1+0.66)*intro_step/4
        gsap.to(gradient_material.uniforms.u_rampMaskOffset,{value:intro_offset_list[intro_step], duration:4})
        console.log(intro_step)
        intro_number +=1
    },
}
gui.add(gradient_fx,'intro')




var changecolorFun=function(colorID){
    animate_gradient(latest_color_id,colorID,2)
    latest_color_id = colorID;
}


var swiper = new Swiper(".mySwiper", {
    direction: 'vertical',
    on: {
        slideChange: function (e) {
            intro_number=e.realIndex;
            gradient_fx.intro();
            if(e.realIndex==2){
                cube_fx_function.pos_fx();
            }
            else{
                setTimeout(function(){
                    animate_cube_posy(-1.5,-1,1)
                },1);
            }


        }
    }
});

if(window.location.href.indexOf("step=2")>-1){

    $(".success").addClass("active");
    cube_fx_function.pos_fx();
}
else{
    $(".mySwiper").show();
    animate_cube_posy(-1.5,-1.5,0);
    gradient_fx.intro();

}



$("#btn1").click(function () {
    $(".mySwiper").hide();
    $(".logo").hide();
    $("#startCol").addClass("active");
    $(".content1").addClass("active");
    $(".bottom-icon").show();
    gradient_fx.intro();
    animate_cube_posy(0.38,0,1);
    cube_fx_function.scale_up();

    /*$(".success").addClass("active");
    gradient_fx.intro();*/

})

$("#btn2").click(function () {
    window.location.href="index.html";
})

$("#startBtn").click(function(){

    for(var i=0;i<configJson.length;i++){
        if(codeResult==configJson[i].CODE){


            var ua = navigator.userAgent.toLowerCase();
            if(ua.match(/MicroMessenger/i)=="micromessenger") {
                //ios的ua中无miniProgram，但都有MicroMessenger（表示是微信浏览器）
                wx.miniProgram.getEnv((res)=>{
                    if (res.miniprogram) {
                            wx.miniProgram.navigateTo({
                                url:'/pages/natureTest?id='+configJson[i].ID,
                                success: function(){
                                    console.log('success')
                                },
                                fail: function(){
                                    console.log('fail');
                                    window.location.href="result.html?id="+configJson[i]+"&date=2022.03.25&name="+escape("测试");
                                },
                                complete:function(){
                                    console.log('complete');
                                }
                            });
                    }
                    else{
                        window.location.href="noWx.html?id="+configJson[i].ID;
                    }
            })
            }else{
                window.location.href="noWx.html?id="+configJson[i].ID;
            }



            return false;
        }
    }


});


var codeResult="";
$(".content .list div").click(function () {

    var index=$(".content").index($(this).parent().parent());

    $(this).parent().find("div").removeClass("active");
    $(this).addClass("active");
    $(this).parent().addClass("animation");

    var cIndex=index+1;
    if(cIndex==6){
        console.log("结束");

        $(".mySwiper").hide();
        $("#startCol").hide();
        $(".bottom-icon").hide();
        $(".success").addClass("active");
        cube_fx_function.scale_down();
        animate_cube_posy(0,0.15,1);
        return;
    }

    if(index<4){
        var selectIndex=$(this).index();
        if(selectIndex<=1){
            codeResult=codeResult+"0";
        }
        else{
            codeResult=codeResult+"1";
        }
        console.log("题目："+index+"选项："+selectIndex+"结果编码："+codeResult);
    }



    console.log("colorId:"+(cIndex+1));
    changecolorFun(cIndex+1);


    var $parent=$(this).parent();
    setTimeout(function(){
        $(".content").removeClass("active");
        $(".content"+(cIndex+1)).addClass("active");
        $parent.removeClass("animation");
    },3000);




})

$(".bottom-icon .left").click(function () {
    var index=$(".content").index($(".content.active"));
    console.log(index);
    if(index>0){
        var cIndex=index-1;
        changecolorFun(cIndex+1);
        $(".content").removeClass("active");
        $(".content"+(cIndex+1)).addClass("active");
    }
})

$(".bottom-icon .right").click(function () {

    if($(".content.active").find(".list div.active").length==0){
        return;
    }

    var index=$(".content").index($(".content.active"));
    console.log(index);
    if(index<5){
        var cIndex=index+1;
        changecolorFun(cIndex);
        $(".content").removeClass("active");
        $(".content"+(cIndex+1)).addClass("active");
    }
})



