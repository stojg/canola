precision mediump float;

attribute vec3 position, normal;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

varying vec3 WorldPos;
varying vec3 Normal;

void main()
{
    Normal = mat3(model) * normal;
    WorldPos = vec3(model * vec4(position, 1.0));
    gl_Position = projection * view * vec4(WorldPos, 1.0);
}