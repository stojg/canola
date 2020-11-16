precision lowp float;

// material parameters
uniform vec3 albedo;
uniform float ao;

void main()
{
    vec3 ambient = albedo * ao;
    vec3 color = ambient;
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));
    gl_FragColor = vec4(color, 1.0);
}
