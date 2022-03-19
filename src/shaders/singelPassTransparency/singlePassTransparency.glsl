// Upgrade NOTE: replaced '_Object2World' with 'unity_ObjectToWorld'
// Upgrade NOTE: replaced 'mul(UNITY_MATRIX_MVP,*)' with 'UnityObjectToClipPos(*)'

// uniform samplerCUBE _EnvTex;
uniform float _IOR;
uniform float _IOROffset;
uniform float _FresnelPower;
uniform float _FresnelAlpha;

varying vec2 vUv;
// varying vec3 vNormal;

void main()
{
	vec3 N = normalize(normal);

	// vec3 V = normalize(I);
	// vec3 R = reflect(V, N);
	// vec3 refl = texCUBE(_EnvTex, R).rgb;

	// vec3 tr = refract(V, N, _IOR + _IOROffset);
	// vec3 tg = refract(V, N, _IOR);
	// vec3 tb = refract(V, N, _IOR - _IOROffset);

	// vec3 refr;
	// refr.r = texCUBE(_EnvTex, tr).r;
	// refr.g = texCUBE(_EnvTex, tg).g;
	// refr.b = texCUBE(_EnvTex, tb).b;

	// float fresnel = saturate(-dot(N, V));
	// fresnel = pow(fresnel, _FresnelPower);

	// vec3 c = refl * fresnel + refr * (1 - fresnel);
	// gl_FragColor  = vec4(c, 1 - fresnel * _FresnelAlpha);
	gl_FragColor  = vec4(N,1.);
}
