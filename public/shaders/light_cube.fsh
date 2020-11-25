precision lowp float;

// lights
struct Light {
    vec4 position;
};

varying float depth;

void main () {
    gl_FragColor = vec4(depth, 0, 0, 1.0);
}