uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform float uColorOffset;
uniform float uColorMultiplier;
uniform float uColorScale;
uniform float uFar;
uniform float uNear;
uniform float uColorMiddeloffset;

varying float vElevation;


// float linearize_depth(float d,float zNear,float zFar)
// {
//     float z_n = 2.0 * d - 1.0;
//     return 2.0 * zNear * zFar / (zFar + zNear - z_n * (zFar - zNear));
// }
vec3 RAMP(vec3 cols[5], float x) {
    x *= float(cols.length() - 1);
    return mix(cols[int(x)], cols[int(x) + 1], smoothstep(0.0, 1.0, fract(x)));
}

float remap2(float value, float low1, float high1, float low2,float  high2)
{
   float remapvalue = 0.0;
   remapvalue = low2 + (value - low1) * (high2 - low2) / (high1 - low1);
   return remapvalue;
}

float linearize_depth(float d,float zNear,float zFar)
{
    return zNear * zFar / (zFar + d * (zNear - zFar));
}

void main()
{
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    vec3 color = mix(uColor1, uColor2, mixStrength);
    
    // gl_FragColor = vec4(color, 1.0);
float ndcDepth = 
    (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) /
    (gl_DepthRange.far - gl_DepthRange.near);
float clipDepth = ndcDepth / gl_FragCoord.w;
clipDepth = (clipDepth*1.) ;
    vec3 color2 = mix(uColor1, uColor2, clipDepth);
// gl_FragColor = vec4(clipDepth,clipDepth,clipDepth,1.); 


    vec3 colors[] = vec3[](
    vec3(0,0,0),
    uColor1,
    uColor2,
    uColor3,
    uColor4
    );

float Depthnew = clamp(pow(((gl_FragCoord.z - uNear - uFar) / (uFar-uNear)),uColorMiddeloffset),0.0001,1.);


    float x = clamp(pow(clipDepth,uColorMiddeloffset),0.0001,1.);
    
    vec3 col = RAMP(colors,Depthnew);
    // vec3 col = RAMP(colors,x);

    gl_FragColor = vec4(col, 1.0);

}