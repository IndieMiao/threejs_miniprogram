uniform float _IOR;
uniform float _IOROffset;
uniform float _ReflOffset;
uniform float _FresnelPower;
uniform float _FresnelAlpha;
uniform float _ReflRefrMix;
uniform float _Ke;
uniform float _Opacity;
uniform float iGlobalTime;
uniform vec3 uColor;
uniform vec3 uColorOverLay;
uniform samplerCube _EnvTex;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

float saturate2(float v)
{
	return clamp(v,0.0,1.0);
}
vec3 pow3(vec3 col, float p)
{
	return vec3(pow(col.r,p),pow(col.g,p),pow(col.b,p));
}

void main(void)
{
	vec3 N = normalize(vNormal);
	vec3 reflOffset = vec3(_ReflOffset);

	vec3 V = normalize(vViewPosition);
	vec3 Rr = reflect(V+reflOffset, N);
	vec3 Rg = reflect(V, N);
	vec3 Rb = reflect(V-reflOffset, N);
	vec3 refl; 
	refl.r = textureCube(_EnvTex, Rr).r;
	refl.g = textureCube(_EnvTex, Rg).g;
	refl.b = textureCube(_EnvTex, Rb).b;

	vec3 tr = refract(V, N, _IOR + _IOROffset);
	vec3 tg = refract(V, N, _IOR);
	vec3 tb = refract(V, N, _IOR - _IOROffset);

	vec3 refr;
	refr.r = textureCube(_EnvTex, tr).r;
	refr.g = textureCube(_EnvTex, tg).g;
	refr.b = textureCube(_EnvTex, tb).b;

	float fresnel = saturate2(-dot(N, V));
	fresnel = pow(fresnel, _FresnelPower);

	vec3 col;
	col =  refl* vec3(fresnel) * uColorOverLay - refr * vec3(1.0 - fresnel) *uColorOverLay;
	col = mix(refr,refl*uColorOverLay ,_ReflRefrMix) ;
	// col += uColor;
	// col =  refr;
	// col =  refr  ;
	col = pow3(col,2.2);
	col *= _Ke;
	// col =  refl* vec3(fresnel) ;
	gl_FragColor =  vec4(col, (1. - fresnel * _FresnelAlpha) *_Opacity);
	// gl_FragColor =  vec4(col, 0.5);
}

