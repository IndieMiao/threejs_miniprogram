
uniform float u_darken_top;
uniform float u_shadow_power;
uniform float u_intensiy;

varying vec3 v_color;
varying vec2 v_UV;

void main() {

    vec3 color = v_color;
    if (u_darken_top == 1.0)
     {
        vec2 st = v_UV;
        color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;
    }
        gl_FragColor = vec4(color * u_intensiy, 1.0);
}