precision lowp float;

uniform float ao;
// material parameters
varying vec3 Albedo;

void main()
{
    vec3 ambient = Albedo * ao;
    vec3 color = ambient;
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));
    gl_FragColor = vec4(color, 1.0);
}
