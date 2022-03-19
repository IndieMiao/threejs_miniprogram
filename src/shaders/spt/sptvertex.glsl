varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() 
{
    vUv = uv;
    vNormal = normalMatrix * normal;
    vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
    gl_Position = projectionMatrix * mvPosition; 
} 