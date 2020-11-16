precision lowp float;

struct Light {
    vec4 position;
};

attribute vec3 position;

uniform mat4 projectionView;
uniform mat4 model;
uniform Light light;

varying vec3 lightDirection;

void main()
{
    vec3 worldPos = vec3(model * vec4(position, 1.0));
    gl_Position = projectionView * vec4(worldPos, 1.0);
    lightDirection = (worldPos - light.position.xyz);
}