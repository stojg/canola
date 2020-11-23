precision highp float;

uniform float ao;
varying vec3 Albedo;

void main()
{
    vec3 color = Albedo;
    gl_FragColor = vec4(color, 1.0);
}
