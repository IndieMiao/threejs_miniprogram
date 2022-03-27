uniform float iGlobalTime;
uniform float u_intensity;
uniform int u_ray;

varying vec2 vUv;

const float PI = acos(-1.0);

// _ _ _
//  _ _ 
//
float square(float x) { return sign(sin(x * PI)) * 0.5 + 0.5; }
//
// /_/_/
//
float ramps(float x) { return mod(x,1.0)*square(x); }
// 
// S_S_S
//
float smoothed_ramps(float x) { return smoothstep(0.0,1.0,ramps(x)); }
//      
//    __
//  __
// _
//
float steps(float x) { return floor(x / 2.0 + 0.5); }
//
//    _/
//  _/
// /
//
float ramps_step(float x) { return ramps(x) + steps(x); }
//
//    _S
//  _S
// S
//
float smoothed_ramps_step(float x) { return smoothed_ramps(x) + steps(x); }

float sphere(vec3 o, float r) { return length(o) - r; }

float cylinder(vec3 o, float r) { return length(o.xz) - r; }

mat2 rotate(float a) { return mat2(cos(a),sin(a),-sin(a),cos(a)); }

vec3 fetch(vec3 o) {
//    float deform = linear_steps(iGlobalTime + 1.5) * 2.0;
    float deform = iGlobalTime / 0.35;
    o.yz *= rotate(smoothed_ramps_step(iGlobalTime + 1.0) * PI / 4.0);
    o.xy *= rotate(smoothed_ramps_step(iGlobalTime + 0.5) * PI / 4.0);
    o.zx *= rotate(smoothed_ramps_step(iGlobalTime) * PI / 4.0);
    o.z += 0.1 * sin(o.y * 10.0 + deform);
    o.x += 0.1 * sin(o.z * 10.0 + deform);
    o.y += 0.1 * sin(o.x * 10.0 + deform);
    
    float object = sphere(o, 0.5);
    if (object < 0.0) {
        vec3 color = vec3((sin(o.x * 10.0 + iGlobalTime) + 1.0) * 0.02 + 0.01,(sin(o.y * 10.0 + iGlobalTime) + 1.0) * 0.01 + 0.02,(sin(o.z * 10.0 + iGlobalTime) + 1.0) * 0.01 + 0.01);
        color /= 4.0;
        return color;
    } else {
	 	return vec3(0.0);
    }
}

float generic_desaturate(vec3 color)
{
	vec3 lum = vec3(0.299, 0.587, 0.114);
	vec3 gray = vec3(dot(lum, color));
	return gray.x;
}


void main(void) {
//     vec2 p = (2.0 * gl_fragCoord.xy - iResolution.xy) / iResolution.y;
    vec2 p = (-1.0 + 2.0 *vUv)*3.; 
//     vec2 p = (2.0 * gl_fragCoord.xy - iResolution.xy) / iResolution.y;
    vec3 light = vec3(0.0);

    vec3 o = vec3(0.0,0.0,-1.0);
    vec3 d = normalize(vec3(p.xy, 2.0));
    
    float t = 0.0;
    for (int i = 0; i < u_ray; i++) {
        t += 0.01;
        light += fetch(d * t + o);
    }


    gl_FragColor = vec4(light*u_intensity,pow(generic_desaturate(light),1.));
}