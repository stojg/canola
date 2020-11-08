precision mediump float;
uniform mat4 projection, view;
uniform mat4 model;
attribute vec3 position, normal;

varying vec3 vnormal;
void main () {
    vnormal = normal;
    gl_Position = projection * view * model * vec4(position, 1.0);
}