uniform float iGlobalTime;
uniform sampler2D  u_map;
uniform float u_base_pow;
uniform float u_opacity;
uniform float u_light_pow;
uniform vec3 u_light_color;
uniform float u_base_intensity;
uniform float u_light_intensity;
uniform float u_light_offset;

varying vec2 vUv;


void main(void)
{
	vec2 uv = vUv;
	vec4 basecolor= texture2D(u_map, uv);
	basecolor.rgb = pow(basecolor.rgb, vec3(u_base_pow));
	basecolor.a = pow(basecolor.a,2.2);

	float d = length(uv - vec2(0.5, 0.5));
	d = max(0.,d - u_light_offset);
	d = pow(d,u_light_pow);
	vec4 light_color = mix(vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.0, 0.0, 0.0), d) ;
	light_color.a = pow(light_color.a,2.2);
	light_color.r = u_light_color.r * light_color.r;
	light_color.g = u_light_color.g * light_color.g;
	light_color.b = u_light_color.b * light_color.b;
//	gl_FragColor = basecolor * u_base_intensity + light_color * u_light_intensity;
	gl_FragColor = vec4((basecolor * u_base_intensity).xyz + (light_color * u_light_intensity).xyz,basecolor.a *u_opacity);
}