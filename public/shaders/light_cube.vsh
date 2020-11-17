precision lowp float;

struct Light {
    vec4 position;
};

attribute vec3 position;
attribute vec4 modelA;
attribute vec4 modelB;
attribute vec4 modelC;
attribute vec4 modelD;

uniform mat4 projectionView;
uniform Light light;

varying vec3 lightDirection;

void main()
{
    mat4 model = mat4(modelA, modelB, modelC, modelD);

    vec3 worldPos = vec3(model * vec4(position, 1.0));
    gl_Position = projectionView * vec4(worldPos, 1.0);
    lightDirection = (worldPos - light.position.xyz);
}