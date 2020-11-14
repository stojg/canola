precision mediump float;

// lights
struct Light {
    vec3 color;
    vec4 position;
    bool on;
};

uniform Light light;
varying vec3 WorldPos;

void main () {
    gl_FragColor = vec4(vec3(distance(WorldPos, light.position.xyz)), 1.0);
}