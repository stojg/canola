precision mediump float;

//layout (location = 0) in vec3 aPos;
//layout (location = 1) in vec2 aTexCoords;
//layout (location = 2) in vec3 aNormal;

attribute vec3 position, normal;
//attribute vec2 uv;

varying vec2 TexCoords;
varying vec3 WorldPos;
varying vec3 Normal;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

void main()
{
//    TexCoords = uv;
    Normal = mat3(model) * normal;
    WorldPos = vec3(model * vec4(position, 1.0));
    gl_Position = projection * view * vec4(WorldPos, 1.0);
}