precision lowp float;

// lights
struct Light {
    vec4 position;
};

varying vec3 lightDirection;

void main () {
    gl_FragColor = vec4(vec3(dot(lightDirection, lightDirection)), 1.0);
}