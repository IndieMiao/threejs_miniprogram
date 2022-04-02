
uniform float u_darken_top;
uniform float u_shadow_power;
uniform float u_rampMaskOffset;
uniform float u_rampMaskPow;
uniform float u_intensiy;

varying vec3 v_color;
varying vec2 v_UV;

void main() {

    vec3 color = v_color;
    vec2 st = v_UV;
    float mask = 1.;
    if (u_darken_top == 1.0)
     {
        color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;
    }
    mask = pow(clamp(1.-st.y + u_rampMaskOffset, 0., 1.),u_rampMaskPow);
            gl_FragColor = vec4(color * u_intensiy* mask, 1.);
//    gl_FragColor = vec4(vec3(mask), 1.0);
}