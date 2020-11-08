precision mediump float;
uniform vec3 color;

varying vec3 vnormal;
void main () {
    vec3 col = color * 0.66 + abs(vnormal) * 0.33;
    gl_FragColor = vec4(col, 1.0);
}