#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 uv;
uniform sampler2D tex;
uniform float wRcp;
uniform float hRcp;

const int u_showEdges = 0;
const float u_lumaThreshold = 0.90;
const float u_maxSpan = 8.0;
const float u_mulReduce = 1.0/8.0;
const float u_minReduce = 1.0/128.0;

vec3 tonemap(vec3 v) {
    return pow((v / (v + vec3(1.0))), vec3(1.0/2.2));
}

vec4 textureSampling(sampler2D t, vec2 coord) {
    return vec4(tonemap(texture2D(t, coord).rgb), 1.0);
}

void main() {
    vec3 rgbM = textureSampling(tex, uv).rgb;
    gl_FragColor = vec4(rgbM, 1.0);
    return;

    vec2 u_texelStep = vec2(1.0/wRcp, 1.0/hRcp);

    // do some fxaa

    vec3 rgbNW = textureSampling(tex, uv + vec2(-1, 1) * u_texelStep).rgb;
    vec3 rgbNE = textureSampling(tex, uv + vec2(1, 1)* u_texelStep).rgb;
    vec3 rgbSW = textureSampling(tex, uv + vec2(-1, -1)* u_texelStep).rgb;
    vec3 rgbSE = textureSampling(tex, uv + vec2(1, -1)* u_texelStep).rgb;

    // see http://en.wikipedia.org/wiki/Grayscale
    const vec3 toLuma = vec3(0.299, 0.587, 0.114);

    // Convert from RGB to luma.
    float lumaNW = dot(rgbNW, toLuma);
    float lumaNE = dot(rgbNE, toLuma);
    float lumaM =  dot(rgbM, toLuma);
    float lumaSW = dot(rgbSW, toLuma);
    float lumaSE = dot(rgbSE, toLuma);

    // Gather minimum and maximum luma.
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    // If contrast is lower than a maximum threshold, do no AA and return.
    if (lumaMax - lumaMin <= lumaMax * u_lumaThreshold) {
        gl_FragColor = vec4(rgbM, 1.0);
        return;
    }

    vec2 samplingDirection;
    samplingDirection.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    samplingDirection.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

    // Sampling step distance depends on the luma: The brighter the sampled texels, the smaller the final sampling step direction.
    // This results, that brighter areas are less blurred/more sharper than dark areas.
    float samplingDirectionReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * 0.25 * u_mulReduce, u_minReduce);

    // Factor for norming the sampling direction plus adding the brightness influence.
    float minSamplingDirectionFactor = 1.0 / (min(abs(samplingDirection.x), abs(samplingDirection.y)) + samplingDirectionReduce);

    // Calculate final sampling direction vector by reducing, clamping to a range and finally adapting to the texture size.
    samplingDirection = clamp(samplingDirection * minSamplingDirectionFactor, vec2(-u_maxSpan), vec2(u_maxSpan)) * u_texelStep;

    // Inner samples on the tab.
    vec3 rgbSampleNeg = textureSampling(tex, uv + samplingDirection * (1.0/3.0 - 0.5)).rgb;
    vec3 rgbSamplePos = textureSampling(tex, uv + samplingDirection * (2.0/3.0 - 0.5)).rgb;

    vec3 rgbTwoTab = (rgbSamplePos + rgbSampleNeg) * 0.5;

    // Outer samples on the tab.
    vec3 rgbSampleNegOuter = textureSampling(tex, uv + samplingDirection * (0.0/3.0 - 0.5)).rgb;
    vec3 rgbSamplePosOuter = textureSampling(tex, uv + samplingDirection * (3.0/3.0 - 0.5)).rgb;

    vec3 rgbFourTab = (rgbSamplePosOuter + rgbSampleNegOuter) * 0.25 + rgbTwoTab * 0.5;

    // Calculate luma for checking against the minimum and maximum value.
    float lumaFourTab = dot(rgbFourTab, toLuma);

    // Are outer samples of the tab beyond the edge ...
    if (lumaFourTab < lumaMin || lumaFourTab > lumaMax)
    {
        // ... yes, so use only two samples.
        gl_FragColor = vec4(rgbTwoTab, 1.0);
    }
    else
    {
        // ... no, so use four samples.
        gl_FragColor = vec4(rgbFourTab, 1.0);
    }

    // Show edges for debug purposes.
    if (u_showEdges != 0)
    {
        gl_FragColor.r = 1.0;
    }

}