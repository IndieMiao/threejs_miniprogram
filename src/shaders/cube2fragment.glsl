#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define SHCOUNT 6.
#define GLOFFSET 0.211
#define RFCOUNT 3

uniform float iGlobalTime;

varying vec2 vUv;

//NOTE: this style of very compact, hard-to-read code makes
//things easier for shaders, especially in the view of
//livecoding compos where you have very limited time to
//write them, but it would be absolutely awful anywhere else,
//and I definitely don't recommend doing it outside of shaders like this

//all the variables that can be are global because it makes things easier and more compact
vec3 cp,cn,cr,ro,rd,cc,oc,fc,ss,gl;
float tt,cd,sd=1.,ot,ct=1.,iv=1.,io;

//in order: current ray position, normal, ray direction, ray origin,
//original ray direction, current colour, object colour, final colour,
//subsurface (colour), glow (color), time, current distance, scene distance,
//object transmission, current transmission, inversion (for transparency), index of refraction

//cube SDF, inlined
float bx(vec3 p,vec3 s)
{
    vec3 q=abs(p)-s;
    return min(max(q.x,max(q.y,q.z)),0.)+length(max(q,0.));
}

//"shatter" function - subtracts a bunch of semi-random planes from the object
float sh(vec3 p, float d, float n, float a, float s, float o)
{
	for(float i=0.;i<n;i++) //loop for each plane
	{
		p.xy*=rot(a);
        p.xz*=rot(a*0.5);
        p.yz*=rot(a+a); //apply semi-random rotation
		float c=mod(i,3.)==0.?p.x:mod(i,3.)==1.?p.y:p.z; //pick semi-random axis for plane
		c=abs(c-o)-s;
        d=max(d,-c);//subtract plane from object, using onioning and offset
        //to give the plane thickness and move it away from the centre
	}
	return d; //return final sdf value
}

//scene/map function
float mp(vec3 p)
{
    //rotate entire scene slowly
	p.xz *= rot(tt*0.03+1.); 
	p.yz *= rot(tt*0.05+0.5);
    //create 2 boxes - one is the actual object, one is purely used for my fake subsurface
	float d=bx(p,vec3(2,2,2))-0.1;
	float c=bx(p,vec3(1.2,1.2,1.2));
    //shatter box
	d=sh(p,d,SHCOUNT,sin(tt*0.01+0.3)*3.,(cos(tt*0.1)*0.5+0.5)*0.5+0.008,0.4);
    //set scene distance, add glow
	sd=d;
    gl+=0.001/(0.001+d*d)*normalize(p*p)*0.008;
    //set object values - doing inside the scene allows for easier and nicer effects!
	if(sd<0.001) 
	{
		oc=vec3(0.5,0.5,0.8);//base colour - changing this will have a big impact
		ss=pow(c,3.)*vec3(0.5, 0.4,0.6);//fake subsurface
		io=1.5+c*0.1;//index of refraction
		ot=0.8-c*0.2;//object transmission
	}
	return sd;//return the distance - this is only used for the normals function
}

//inlined raymarcher. Mostly standard, but multiplies the scene distance by the inversion factor
void tr(){cd=0.;for(float i=0.;i<222.;i++){mp(ro+rd*cd);sd*=iv;cd+=sd;if(sd<0.00005||cd>16.)break;}}
//inlined normal calculation. Using this mat3 is actually slightly less compact, but much cleaner
void nm(){mat3 k=mat3(cp,cp,cp)-mat3(.0001);cn=normalize(mp(cp)-vec3(mp(k[0]),mp(k[1]),mp(k[2])));}

//pixel "shader" (coloury bits)
void px()
{
//   cc=vec3(0.3,0.45,0.7)+length(cr*cr)*0.2+gl; //assign current color to background colour + glow
  cc=length(cr*cr)*0.2+gl; //assign current color to background colour + glow
  if(cd>16.)return;  //return if we just want background
  //axis-based diffuse lighting
  vec3 l=vec3(0.7,0.4,0.9);
  float df=length(cn*l);
  //very basic fresnel effect and custom specular effect
  float fr=pow(1.-df,2.)*0.5;
  float sp=(1.-length(cross(cr,cn)))*0.2;
  float ao=min(mp(cp+cn*0.5)-0.5,0.3)*0.3; //custom ambient occulusion effect
  cc=oc*(df+fr+ss)+fr+sp+ao;  //mix it all together
}

void main(void)
{
  tt=mod(iGlobalTime*10.+19., 1200.);//keep time low to reduce issues
  vec2 uv=vUv;
  uv-=0.5;
//   uv/=vec2(iResolution.y/iResolution.x,1.);
  ro=vec3(0,0,-8);rd=normalize(vec3(uv,1));//ray origin and direction
  for(int i=0;i<RFCOUNT*2;i++) //compacted transparency loop - depth 6 (2 pass per layer)
  {
     tr();cp=ro+rd*cd;nm();cr=rd;ro=cp-cn*(0.01*iv);//trace and calculate values
     rd=refract(cr,cn*iv,iv>0.?1./io:io);//refract
     if(length(rd)==0.)rd=reflect(cr,cn*iv);//reflect if refraction failed
     px();iv*=-1.;if(iv<0.)fc=mix(fc,cc,ct);//get colour and mix it
     ot*=1.8;
     ot = min(1.,ot);
     ct*=ot;if(ct<=0.||cd>128.)break;//update trasmission and break if needed
  }
  fc -= GLOFFSET;
  fc = max(vec3(0),fc);
  gl_FragColor = vec4(fc,1);//output colour
}