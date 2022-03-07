// Created by David Gallardo - xjorma/2020
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0


#if HW_PERFORMANCE==0
#else
#define AA
#endif

#define GAMMA 0


// my modified round intersection from https://www.shadertoy.com/view/wsyyWw

// intersect capsule : http://www.iquilezles.org/www/articles/intersectors/intersectors.htm
float capIntersect( in vec3 ro, in vec3 rd, in vec3 pa, in vec3 pb, in float r )
{
    vec3  ba = pb - pa;
    vec3  oa = ro - pa;

    float baba = dot(ba,ba);
    float bard = dot(ba,rd);
    float baoa = dot(ba,oa);
    float rdoa = dot(rd,oa);
    float oaoa = dot(oa,oa);

    float a = baba      - bard*bard;
    float b = baba*rdoa - baoa*bard;
    float c = baba*oaoa - baoa*baoa - r*r*baba;
    float h = b*b - a*c;
    if( h>=0.0 )
    {
        float t = (-b-sqrt(h))/a;

        float y = baoa + t*bard;
        
        // body
        if( y>0.0 && y<baba ) return t;

        // caps
        vec3 oc = (y<=0.0) ? oa : ro - pb;
        b = dot(rd,oc);
        c = dot(oc,oc) - r*r;
        h = b*b - c;
        if( h>0.0 )
        {
            return -b - sqrt(h);
        }
    }
    return -1.;
}

// intersect a ray with a rounded box
// http://iquilezles.org/www/articles/intersectors/intersectors.htm
// Modified to support bigger radius, probably more optimal solution, but was too lazy and nor as good as IQ :(
// I kept the -1 for no collision paradigm even if I hate it (Make code more complex), but I prefered to stay compatible with IQ interface.
float roundedboxIntersect( in vec3 ro, in vec3 rd, in vec3 size, in float rad )
{
    
	// bounding box
    vec3 m = 1.0/rd;
    vec3 n = m*ro;
    vec3 k = abs(m)*(size+rad);
    vec3 t1 = -n - k;
    vec3 t2 = -n + k;
	float tN = max( max( t1.x, t1.y ), t1.z );
	float tF = min( min( t2.x, t2.y ), t2.z );
	if( tN > tF || tF < 0.0) return -1.0;
    float t = tN;

    // convert to first octant
    vec3 pos = ro+t*rd;
    vec3 s = sign(pos);
    ro  *= s;
    rd  *= s;
    pos *= s;
        
    // faces
    pos -= size;
    pos = max( pos.xyz, pos.yzx );
    if( min(min(pos.x,pos.y),pos.z)<0.0 ) return t;
  
  	// fat edges
    float d;
    d = capIntersect(ro, rd, size * vec3(-1, 1, 1), size, rad);
    t = d > 0. ? d : 1e20;
    d = capIntersect(ro, rd, size * vec3( 1,-1, 1), size, rad);
    t = min(d > 0. ? d : 1e20, t);    
    d = capIntersect(ro, rd, size * vec3( 1, 1,-1), size, rad);
    t = min(d > 0. ? d : 1e20, t);    

    if( t>1e19 ) t=-1.0;
    
	return t;
}

// normal of a rounded box
vec3 roundedboxNormal( in vec3 pos, in vec3 siz, in float rad )
{
    return sign(pos)*normalize(max(abs(pos)-siz,0.0));
    
}

mat3 fromEuler(vec3 ang)
{
    mat3 mx = mat3(
			1.0,		0.0,		0.0,
			0.0,		cos(ang.x),	-sin(ang.x),
			0.0,		sin(ang.x),	cos(ang.x));
    mat3 my = mat3(
			cos(ang.y), 0.0,		sin(ang.y),
			0.0,		1.0,		0.0,
			-sin(ang.y),0.0,		cos(ang.y));
    mat3 mz = mat3(
			cos(ang.z), -sin(ang.z),0.0,
			sin(ang.z),	cos(ang.z),	0.0,
			0.0,		0.0,		1.0);
        
    return mx*my*mz;
}


struct objDec
{
    float r;
    float s;
    mat3  m;
};
    
const float offset = 4.;

        
bool intersectObjFromInside( in vec3 ro, in vec3 rd, float tmax, out float oDis, out vec3 oNor, in objDec o)
{
    ro = o.m * ro;
    rd = o.m * rd;
    ro = ro + rd * offset;
    rd = -rd;
    float d = roundedboxIntersect( ro, rd, vec3(o.s), o.r);
    if(d > 0.)
    {
        oNor = -roundedboxNormal( ro + rd *d, vec3(o.s), o.r ) * o.m;
        oDis = offset - d;
		return true;
    }
    oDis = tmax;
    return false;
}

bool intersectObjFromOutside( in vec3 ro, in vec3 rd, float tmax, out float oDis, out vec3 oNor, in objDec o)
{
    ro = o.m * ro;
    rd = o.m * rd;
    float d = roundedboxIntersect( ro, rd, vec3(o.s), o.r);
    if(d > 0.)
    {
        oNor = roundedboxNormal( ro + rd *d, vec3(o.s), o.r ) * o.m;
        oDis = d;
		return true;
    }
    oDis = tmax;
    return false;
}

bool intersectSceneFromOutside( in vec3 ro, in vec3 rd, float tmax, out float oDis, out vec3 oNor, in objDec inner, in objDec outter)
{
	intersectObjFromOutside(ro, rd, tmax, oDis, oNor, outter);
    float d2;
    vec3  n2;
    intersectObjFromInside(ro, rd, tmax, d2, n2, inner);
    if(d2 < oDis)
    {
        oDis = d2;
        oNor = n2;
    }
    return oDis < tmax;
}

bool intersectSceneFromInside( in vec3 ro, in vec3 rd, float tmax, out float oDis, out vec3 oNor, in objDec inner, in objDec outter)
{
	intersectObjFromOutside(ro, rd, tmax, oDis, oNor, inner);
    float d2;
    vec3  n2;
    intersectObjFromInside(ro, rd, tmax, d2, n2, outter);
    if(d2 < oDis)
    {
        oDis = d2;
        oNor = n2;
    }
    return oDis < tmax;
}



vec3 getSkyColor(vec3 rd)
{
    vec3 col = texture(iChannel0, rd).rgb;
    #if GAMMA
    	col = pow(col, vec3(2.2));
    #endif
    return col;
}



#define MAX_BOUNCES 3
#define ABSORB		vec3(0, 0, 0)

vec3 Render(in vec3 ro, in vec3 rd, in float dist, float cref, in objDec inner, in objDec outter)
{
    float sgn = 1.;
    vec3  col = vec3(0);
    vec3  rel = vec3(1);
    float transp = 0.99;
    vec3  absorb = ABSORB;
    for(int i = 0; i < MAX_BOUNCES; i++)
    {
        vec3	n;
        float 	d;
        bool	inter;
        if(sgn > 0.)
        {
            inter = intersectSceneFromOutside(ro, rd, dist, d, n, inner, outter);
        }
        else
        {
            inter = intersectSceneFromInside(ro, rd, dist, d, n, inner, outter);
        }
        
        if(!inter)
        {
            col += rel * getSkyColor(rd);
            return col;
        }
        vec3 rabs = mix(absorb, vec3(0), (sgn + 1.) / 2.);
        vec3 beerlamb = exp(-rabs * d);
        vec3 p = ro + rd * d;
        //n *= sgn;
        vec3 refl = reflect(rd, n);
        vec3 refr = refract(rd, n, cref);
        //float fresnel = 1.0 - pow(dot(n, -rd), 2.);
        float fresnel = pow(1.0 - abs(dot(n, rd)), 2.0);
        float reflectorFactor = mix (0.2, 1.0, fresnel);
        float refractionFactor = mix (transp, 0., fresnel);
    
    	col += (1.0 - refractionFactor) * rel * beerlamb * getSkyColor(refl) * reflectorFactor;
    	rel *= refractionFactor * beerlamb;     
        
       	ro = p;     
        if (refr == vec3(0.0))
        {
            rd = refl;
        }
        else
        {
            rd = refr; 
            sgn *= -1.;
            cref = 1. / cref;
        }        
    }
    col += rel * getSkyColor(rd);
    return col;
}

mat3 setCamera( in vec3 ro, in vec3 ta )
{
	vec3 cw = normalize(ta-ro);
	vec3 up = vec3(0, 1, 0);
	vec3 cu = normalize( cross(cw,up) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

/*
vec3 vignette(vec3 color, vec2 q, float v)
{
    color *= 0.3 + 0.8 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), v);
    return color;
}
*/

/*
vec3 desaturate(in vec3 c, in float a)
{
    float l = dot(c, vec3(1. / 3.));
    return mix(c, vec3(l), a);
}
*/

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
  //  float t = iTime * 0.95;
    float t =3.14;
    float v = (cos(t) + 1.) * 0.5;
    
    objDec inner, outter;
    outter.r = v * 0.75 + 0.1;
    outter.s   = (1.-v) * 0.75;
    outter.m = fromEuler(vec3(t * 0.9 + 0.2,  t * 0.6 + 1.2, t * 0.5 + 0.9));
    inner.r  = (1.-v) * 0.35 + 0.1;
    inner.s	   = v * 0.35;
    inner.m = fromEuler(vec3(t * 0.8 + 1.5,  t * 0.4 + 0.7, t * 0.7 + 2.3));

  
	vec3 tot = vec3(0.0);   
/* remove aa
#ifdef AA
	vec2 rook[4];
    rook[0] = vec2( 1./8., 3./8.);
    rook[1] = vec2( 3./8.,-1./8.);
    rook[2] = vec2(-1./8.,-3./8.);
    rook[3] = vec2(-3./8., 1./8.);
    for( int n=0; n<4; ++n )
    {
        // pixel coordinates
        vec2 o = rook[n];
        vec2 p = (-iResolution.xy + 2.0*(fragCoord+o))/iResolution.y;
#else //AA
*/
        vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;
        
//#endif //AA
 
        // camera
        
        float theta	= radians(360.)*(iMouse.x/iResolution.x-0.5) + radians(180.);
        float phi	= radians(90.)*(iMouse.y/iResolution.y-0.5) + radians(90.);
        vec3 ro = 2. * vec3( sin(phi)*cos(theta),cos(phi),sin(phi)*sin(theta));
        //vec3 ro = vec3(0.0,.2,4.0);
        vec3 ta = vec3( 0 );
        // camera-to-world transformation
        mat3 ca = setCamera( ro, ta );
        //vec3 cd = ca[2];    
        
        vec3 rd =  ca*normalize(vec3(p,1.5));        
        
        vec3 col;
        col.r = Render(ro, rd, 12.,0.67, inner, outter).r;
        col.g = Render(ro, rd, 12.,0.7, inner, outter).g;
        col.b = Render(ro, rd, 12.,0.73, inner, outter).b;
        
      	tot += col;
            
/*
#ifdef AA
    }
    tot /= 4.;
    
#endif
*/
    
 //   tot = desaturate(tot, -0.4);
//    tot = vignette(tot, fragCoord / iResolution.xy, 1.2);
    #if GAMMA
    	tot = pow(tot, vec3(1. / 2.2));
    #endif

	fragColor = vec4( tot, 1.0 );
}