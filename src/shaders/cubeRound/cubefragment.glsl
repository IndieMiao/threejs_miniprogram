#define MAX_BOUNCES 2
//#define ABSORB		vec3(0, 0, 0)
#define GAMMA

uniform float iGlobalTime;
uniform float iInnerRotateSpeed;
uniform float iOutterRotateSpeed;
uniform samplerCube iChannel0;
uniform float u_intensity;
uniform float u_opacityOffset;
uniform float u_opacity;
uniform vec3 u_colorOverlay;
uniform vec3 u_absorb;
uniform float u_chromeOffset;
uniform float u_cameraOffset;
uniform float u_cameraPerspective;
uniform float u_cubePhi;
uniform float u_dist;
uniform float u_colorOverlayIntensity;

varying vec2 vUv;
// varying float distToCamera;


float linearize_depth(float d,float zNear,float zFar)
{
    float z_n = 2.0 * d - 1.0;
    return 2.0 * zNear * zFar / (zFar + zNear - z_n * (zFar - zNear));
}

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
    if( tN>tF || tF<0.0) return -1.0;
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
    if( min(min(pos.x,pos.y),pos.z) < 0.0 ) return t;

    // some precomputation
    vec3 oc = ro - size;
    vec3 dd = rd*rd;
    vec3 oo = oc*oc;
    vec3 od = oc*rd;
    float ra2 = rad*rad;

    t = 1e20;

    // corner
    {
        float b = od.x + od.y + od.z;
        float c = oo.x + oo.y + oo.z - ra2;
        float h = b*b - c;
        if( h>0.0 ) t = -b-sqrt(h);
    }
    // edge X
    {
        float a = dd.y + dd.z;
        float b = od.y + od.z;
        float c = oo.y + oo.z - ra2;
        float h = b*b - a*c;
        if( h>0.0 )
        {
            h = (-b-sqrt(h))/a;
            if( h>0.0 && h<t && abs(ro.x+rd.x*h)<size.x ) t = h;
        }
    }
    // edge Y
    {
        float a = dd.z + dd.x;
        float b = od.z + od.x;
        float c = oo.z + oo.x - ra2;
        float h = b*b - a*c;
        if( h>0.0 )
        {
            h = (-b-sqrt(h))/a;
            if( h>0.0 && h<t && abs(ro.y+rd.y*h)<size.y ) t = h;
        }
    }
    // edge Z
    {
        float a = dd.x + dd.y;
        float b = od.x + od.y;
        float c = oo.x + oo.y - ra2;
        float h = b*b - a*c;
        if( h>0.0 )
        {
            h = (-b-sqrt(h))/a;
            if( h>0.0 && h<t && abs(ro.z+rd.z*h)<size.z ) t = h;
        }
    }

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

float remap2(float value, float low1, float high1, float low2,float  high2)
{
   float remapvalue = 0.0;
   remapvalue = low2 + (value - low1) * (high2 - low2) / (high1 - low1);
   return remapvalue;
}
        
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
    vec3 col = textureCube(iChannel0, rd).rgb;
    // #if GAMMA
//    	col = pow(col, vec3(2.2));
    // #endif
    return col;
}




vec4 Render(in vec3 ro, in vec3 rd, in float dist, float cref, in objDec inner, in objDec outter)
{
    float sgn = 1.;
    vec3  col = vec3(0);
    vec3  rel = vec3(1);
    float transp = 1.;
    vec3  absorb = u_absorb;
    for(int i = 0; i < MAX_BOUNCES; i++)
    {
        vec3	n;
        float 	d;
        bool	inter;
        if(sgn > 0.0)
        {
            inter = intersectSceneFromOutside(ro, rd, dist, d, n, inner, outter);
        }
        else
        {
            inter = intersectSceneFromInside(ro, rd, dist, d, n, inner, outter);
        }
        
        if(!inter)
        {
        // add and remove background here
            col += rel * getSkyColor(rd);
            return  vec4( col,0. );
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
    //col += rel;
    return vec4( col, 1.0 );
}

float map2(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

mat3 setCamera( in vec3 ro, in vec3 ta )
{
	vec3 cw = normalize(ta-ro);
	vec3 up = vec3(0, 1, 0);
	vec3 cu = normalize( cross(cw,up) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

vec3 desaturate(in vec3 c, in float a)
{
    float l = dot(c, vec3(1. / 3.));
    return mix(c, vec3(l), a);
}


void main( void)
{
    float cameraOffset = max(1., u_cameraOffset);
    float cameraPerspective= max(1.,u_cameraPerspective);
    float tt = iGlobalTime * 0.8;
    // float tt = 3.14;
    float t = 3.14;
//    float v = map2(cos(tt),-1.,1.,0.08,0.08);
    float v = map2(cos(tt),-1.,1.,0.00,0.02);
    float v2 = map2(cos(tt*1.68),-1.,1.,0.5,1.);
    
    objDec inner, outter;
//    outter.r = v * 0.75 + 0.10;
//    outter.s   = (1.-v) * 0.75;
    outter.r = 0.02;
    outter.s = 1.- 0.11;
    outter.m = fromEuler(vec3(t * 0.9 + 0.2,  t * 0.6 + 1.2, t * 0.5 + 0.9));
    inner.r  = (1.-v2) * 0.35 + 0.1;
    // inner.r  = (1.-v2) * 0.35 + 0.1;
    inner.s	  = v2 * 0.35;
    inner.m = fromEuler(vec3(t * 0.8 + 1.5,  t * 0.4 + 0.7, t * 0.7 + 2.3));

  
	vec3 tot = vec3(0.0);   

    vec2 p = -1.0 + 2.0 *vUv;
        
 
        // camera
        
        //float theta	= radians(360.)*(iMouse.x/iResolution.x-0.5) + radians(180.);
        float theta	= tt*0.5;
        //float phi	= radians(90.)*(iMouse.y/iResolution.y-0.5) + radians(90.);
        float phi = u_cubePhi;

        vec3 ro = cameraOffset * vec3( sin(phi)*cos(theta),cos(phi),sin(phi)*sin(theta));
//        vec3 ro = vec3(0.0,.2,4.0);
        vec3 ta = vec3( 0 );
        // camera-to-world transformation
        mat3 ca = setCamera( ro, ta );
        //vec3 cd = ca[2];    
        float alpha = 0.0;

    //Camera perspactive
        vec3 rd =  ca*normalize(vec3(p,cameraPerspective));
        
        vec3 col;
        vec2 ga_temp;
        col.r = Render(ro, rd, u_dist,0.7-u_chromeOffset, inner, outter).r;
        ga_temp = Render(ro, rd, u_dist,0.7, inner, outter).ga;
        col.g = ga_temp.x;
        col.b = Render(ro, rd, u_dist,0.7+u_chromeOffset, inner, outter).b;
//        alpha = u_opacity*(Render(ro, rd, u_dist,0.7, inner, outter).a*((col.r+col.g+col.b)/3.+u_opacityOffset));
        alpha = u_opacity*ga_temp.y*((col.r+col.g+col.b)/3.+u_opacityOffset);
    // alpha = (col.r+col.g+col.b)/3.;
        
      	tot += col;
        
        
            
   tot = desaturate(tot, -0.4);
   tot += u_colorOverlay*vec3(u_colorOverlayIntensity);
//    tot = vignette(tot, fragCoord / iResolution.xy, 1.2);
    // #if GAMMA
//    	 tot = pow(tot, vec3(1. / 2.));
    // #endif
    // alpha = clamp(pow(alpha,1./2.),0.,1.);

	gl_FragColor  = vec4( tot*vec3(u_intensity), alpha );
//	 gl_FragColor  = vec4( tot*vec3(u_intensity), 1.);

}