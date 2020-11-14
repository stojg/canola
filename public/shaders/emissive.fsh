precision mediump float;

// material parameters
uniform vec3 albedo;
uniform float ao;

void main()
{
    vec3 color = albedo;
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));
    gl_FragColor = vec4(color, 1.0);
}
