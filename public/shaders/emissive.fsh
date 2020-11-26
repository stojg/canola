#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float ao;
varying vec3 Albedo;

vec3 tonemap(vec3 v) {
    return pow((v / (v + vec3(1.0))), vec3(1.0/2.2));
}
void main()
{
    vec3 color = Albedo;
    gl_FragData[0] = vec4(tonemap(color), 1.0);
}
