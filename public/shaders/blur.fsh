precision lowp float;

varying vec2 uv;
uniform sampler2D tex;
uniform vec2 scale;
uniform float wRcp, hRcp;

void main()
{
    float offset[3];
    offset[0] = 0.0;
    offset[1] = 1.3846153846;
    offset[2] = 3.2307692308;
    float weight[3];
    weight[0] = 0.2270270270;
    weight[1] = 0.3162162162;
    weight[2] = 0.0702702703;

    vec2 tex_offset = vec2(wRcp, hRcp); // gets size of single texel

    vec3 result = texture2D(tex, uv).rgb * weight[0]; // current fragment's contribution

    for(int i = 1; i<3; i++) {
        result += texture2D(tex, uv + vec2(tex_offset.x * offset[i]) * scale).rgb * vec3(weight[i]);
        result += texture2D(tex, uv - vec2(tex_offset.x * offset[i]) * scale).rgb * vec3(weight[i]);
    }
    gl_FragColor = vec4(result, 1.0);
}
