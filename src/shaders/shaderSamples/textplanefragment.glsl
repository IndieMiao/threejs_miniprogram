uniform float iGlobalTime;
uniform sampler2D  map;

varying vec2 vUv;
void main(void)
{
	vec2 uv = vUv;
	vec4 tex1 = texture2D(map, uv);
	gl_FragColor = tex1;
}