#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 uv;
uniform sampler2D tex;

void main() {
    vec3 color = texture2D(tex, uv).rgb;
    // reinhard
    color = color / (color + vec3(1.0));
    // gamma
    color = pow(color, vec3(1.0/2.2));
    gl_FragColor = vec4(color, 1.0);
}