precision lowp float;

attribute vec3 position, normal;

uniform mat4 projection;
uniform mat4 view;
attribute vec4 modelA;
attribute vec4 modelB;
attribute vec4 modelC;
attribute vec4 modelD;
attribute vec3 albedo;

varying vec3 WorldPos;
varying vec3 Normal;
varying vec3 Albedo;

void main()
{
    mat4 model = mat4(modelA, modelB, modelC, modelD);
    Normal = mat3(model) * normal;
    WorldPos = vec3(model * vec4(position, 1.0));
    Albedo = albedo;
    gl_Position = projection * view * vec4(WorldPos, 1.0);
}