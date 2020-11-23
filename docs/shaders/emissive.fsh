#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float ao;
varying vec3 Albedo;

void main()
{
    vec3 color = Albedo;
    gl_FragData[0] = vec4(color, 1.0);
}
