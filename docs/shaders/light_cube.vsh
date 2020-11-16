precision lowp float;

attribute vec3 position;

uniform mat4 projectionView;
uniform mat4 model;

varying vec3 WorldPos;

void main()
{
    WorldPos = vec3(model * vec4(position, 1.0));
    gl_Position = projectionView * vec4(WorldPos, 1.0);
}