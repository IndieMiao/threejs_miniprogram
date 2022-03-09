uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform vec3 uFarColor;
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
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    
    // gl_FragColor = vec4(color, 1.0);
float ndcDepth = 
    (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) /
    (gl_DepthRange.far - gl_DepthRange.near);
float clipDepth = ndcDepth / gl_FragCoord.w;
clipDepth = (clipDepth*1.) ;
    vec3 color2 = mix(uDepthColor, uSurfaceColor, clipDepth);
// gl_FragColor = vec4(clipDepth,clipDepth,clipDepth,1.); 

    float x = clipDepth;
    float h = uColorMiddeloffset;

    vec3 col = mix(mix(uDepthColor, uSurfaceColor, x), mix(uSurfaceColor, uFarColor, (x - h)/(1.0 - h)), step(h, x));

    gl_FragColor = vec4(col, 1.0);


// gl_FragColor.xyz = clipDepth;

}