precision highp float;

attribute vec3 position, normal;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
uniform vec3 camPos;

varying vec3 WorldPos;
varying vec3 Normal;
varying vec3 CamDirection;

void main()
{
    Normal = mat3(model) * normal;
    WorldPos = vec3(model * vec4(position, 1.0));
    CamDirection = camPos - WorldPos;
    gl_Position = projection * view * vec4(WorldPos, 1.0);
}