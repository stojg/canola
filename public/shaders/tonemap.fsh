precision highp float;
varying vec2 uv;
uniform sampler2D tex;
uniform float wRcp, hRcp;
void main() {
    vec3 FragColor = texture2D(tex, uv).rgb;
    // reinhard
    FragColor = FragColor / (FragColor + vec3(1.0));
    // gamma
    FragColor = pow(FragColor, vec3(1.0/2.2));
    gl_FragColor = vec4(FragColor, 1.0);
}