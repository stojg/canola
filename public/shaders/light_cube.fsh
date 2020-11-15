precision lowp float;

// lights
struct Light {
    vec4 position;
};

uniform Light light;
varying vec3 WorldPos;

void main () {
    gl_FragColor = vec4(vec3(distance(WorldPos, light.position.xyz)), 1.0);
}