precision highp float;

uniform float ao;
varying vec3 Albedo;

void main()
{
    vec3 color = Albedo;
    // reinhart
    color = color / (color + vec3(1.0));
    // gamma
    color = pow(color, vec3(1.0/2.2));
    gl_FragColor = vec4(color, 1.0);
}
