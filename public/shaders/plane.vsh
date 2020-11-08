precision mediump float;
attribute vec3 position, normal;
uniform mat4 projection, view, model;
varying vec3 fragNormal, fragPosition;
void main() {
    fragNormal = normal;
    fragPosition = position;
    gl_Position = projection * view * model * vec4(position, 1.0);
}