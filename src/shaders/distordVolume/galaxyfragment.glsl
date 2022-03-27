// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Created by L. Haeussler 2021

uniform float iGlobalTime;
uniform int u_ray;

varying vec2 vUv;

// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Created by L. Haeussler 2021

float powi( float b, int e )
{
    float result = b;
    
    int ae = abs( e );
    for( int i = 1; i < ae; i++ )
        result *= b;
        
    return e >= 0 ? result : 1. / result;
}

vec2 iSphere( in vec3 ro, in vec3 rd, in vec3 sph, float radius ) // from iq
{
	vec3 oc = ro - sph;
	float b = dot( oc, rd );
	float c = dot( oc, oc ) - radius*radius;
	float h = b*b - c;
	if( h<0.0 ) return vec2(-1.0);
	h = sqrt(h);
	return vec2(-b-h, -b+h );
}

float map( in vec3 p )
{
	float res = 0.;
    
    float v = .8 - .7 * powi( sin( 0.15 * iTime ), 3 );
	
    vec3 c = p;
	for( int i = 0; i < 2; ++i ) {
        p = v * p.zyx*p.zyx*powi(length(p),-3) - v;
        p.xy = vec2( p.x*p.x - p.z*p.z, 2.*p.x*p.z );
        res += exp( -12. * abs( dot( p, c ) ) );
	}
    
	return res;
}

vec3 raymarch( in vec3 ro, vec3 rd, vec2 tminmax, float radius )
{
    vec3 col = vec3( 0. );
    
    float rfactor = 1. / radius;

    float c = 1.;
    float t = max( 0., tminmax.x );
    float translucency = 1.;
    for( int i=0; i<u_ray; i++ )
	{
        float dt = mix( 0.05, 0.01, step( 0.001, c ) );
        
        t += dt;
        
        if( t >= tminmax.y )
            break;

        vec3 pos = ro + t*rd;
        
        float corona = 1.;
        corona -= rfactor * length( pos );
        corona = 4. * corona * ( 1. - corona );
        c = map( pos ) * corona;
        
        
        float hilights = 1.;
        //hilights -= 0.95 * smoothstep( 0.9, 1.1, c );
        col += translucency * dt * hilights * vec3( 5.1*c*c*c, 4.*c*c, 3.1*c );
        translucency *= 1. - 1.5 * dt * sqrt( c );
        
        if( translucency < 0.1 )
            break;
    }
    return col * sqrt( col );
}

mat3 setCamera( vec3 ro, vec3 ta, vec3 wu )
{
	vec3 cw = normalize(ta-ro),
	     cu = normalize( cross(cw,wu) ),
	     cv = cross(cu,cw);
    return mat3( cu, cv, cw );
}

vec3 fromSpherical( vec3 s ) // vec3( phi, theta, radius )
{
    return s.z * vec3(sin(s.x)*cos(s.y), sin(s.y),
                      cos(s.x)*cos(s.y));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 q = fragCoord.xy / iResolution.xy;
    vec2 p = -1.0 + 2.0 * q;
    p.x *= iResolution.x/iResolution.y;

    
    // camera
    vec3 ro = fromSpherical( vec3( 3.1, 1.5, 4. ));
    mat3 ca = setCamera( ro, vec3( 0., 0, 0. ), vec3( 0., .1, 0. ) );
    
    // ray
    vec3 rd = ca * normalize( vec3( p, 2. ) );

    // intersection
    float radius = 2. + .1 * sin( 1. * iTime );
    vec2 tmm = iSphere( ro, rd, vec3(0.), radius );

	// background
    vec3 col = texture(iChannel0, rd).rgb;
    
    // bubble
    vec3 nor = normalize( ro + tmm.x * rd );
    float spec = 1. + dot( nor, rd );

    // raymarch
    vec3 innerColor = raymarch( ro, rd, tmm, radius );

    // anti alias
    float r = sqrt( dot( ro, ro ) - powi( dot( ro, rd ), 2 ) );
    col = mix( col, innerColor, smoothstep( 0., 2. * fwidth( r ), radius - r ) );
	
	// shade
    col = 1. - exp( -col );
    fragColor = vec4( innerColor, 1.0 );
}
