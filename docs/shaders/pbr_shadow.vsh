#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

attribute vec3 position, normal;
attribute vec4 modelA;
attribute vec4 modelB;
attribute vec4 modelC;
attribute vec4 modelD;
attribute vec3 albedo;
attribute float metallic;
attribute float roughness;

uniform mat4 projection;
uniform mat4 view;
uniform vec3 camPos;

varying vec3 WorldPos;
varying vec3 Normal;
varying vec3 CamDirection;
varying vec3 Albedo;
varying float Metallic;
varying float Roughness;

void main()
{
    mat4 model = mat4(modelA, modelB, modelC, modelD);
    Albedo = albedo;
    Metallic = metallic;
    Roughness = roughness;
    Normal = mat3(model) * normal;
    WorldPos = vec3(model * vec4(position, 1.0));
    CamDirection = camPos - WorldPos;
    gl_Position = projection * view * vec4(WorldPos, 1.0);
}