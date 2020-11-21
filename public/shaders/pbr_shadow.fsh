// needs to be highp for mobile devices HDR
precision highp float;

#define NUM_LIGHTS 4
#define EPSILON 0.0000000001
#define SHADOW_BIAS 1.1

const float PI = 3.14159265359;

// general uniforms
uniform float ao;
// light uniforms
struct Light {
    vec3 color;
    vec4 position;
    float intensity;
};
uniform Light lights[NUM_LIGHTS];
uniform samplerCube shadowCubes[NUM_LIGHTS];

// from vertexshader
varying vec3 WorldPos;
varying vec3 Normal;
varying vec3 CamDirection;
varying vec3 Albedo;
varying float Metallic;
varying float Roughness;

vec3 calcPointLight(vec3 normal, vec3 camDirection, vec3 F0 , Light light, float roughness);
vec4 getSampleFromArray(int ndx, vec3 uv);

void main()
{
    vec3 N = normalize(Normal);
    vec3 V = normalize(CamDirection);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, Albedo, Metallic);
    vec3 Lo = vec3(0.0);

    for (int i = 0; i < NUM_LIGHTS; ++i)
    {
        vec3 col = calcPointLight(N, V, F0, lights[i], Roughness);
        if (dot(col, col) < 0.0000000001) {
            continue;
        }
        vec3 lightRay = WorldPos - lights[i].position.xyz;
        if((getSampleFromArray(i, lightRay).r * SHADOW_BIAS) < (dot(lightRay, lightRay))) {
            continue;
        }
        Lo += col;
    }

    vec3 ambient = Albedo * ao;
    vec3 color = ambient + Lo;

    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));

    gl_FragColor = vec4(color, 1.0);
}

vec4 getSampleFromArray(int ndx, vec3 uv) {
    for (int i = 0; i < NUM_LIGHTS; ++i) {
        if (i == ndx) {
            return textureCube(shadowCubes[i], uv);
        }
    }
    return vec4(1.0, 1.0, 1.0, 1.0);
}

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    // according to disney and epic squaring the roughness in both the geometry and normal distribution function.
    float a      = roughness*roughness;
    float a2     = a*a;
    float NdotH  = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float num   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    // according to disney and epic squaring the roughness in both the geometry and normal distribution function.
    float k = (r*r) * 0.125; // (r*r) / 8

    float num   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2  = GeometrySchlickGGX(NdotV, roughness);
    float ggx1  = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

vec3 calcPointLight(vec3 normal, vec3 camDirection, vec3 F0 , Light light, float roughness) {

    vec3 lightDirection = light.position.xyz - WorldPos;
    float lightDistance = length(lightDirection);
    vec3 lightColor = light.color;

    float attenuation = 1.0;
    if (light.position.w < EPSILON) {
        vec3 polynomial = vec3(1.0, lightDistance, lightDistance * lightDistance);
        vec4 vLightAttenuation = vec4(1.0, 0.5, 0.1, light.intensity);
        attenuation = 1.0 / dot(polynomial,vLightAttenuation.xyz);
        attenuation *= clamp(1.0 - (lightDistance / vLightAttenuation.w), 0.0, 1.0);
    }

    vec3 L = normalize(lightDirection);
    vec3 H = normalize(camDirection + L);

    // cook-torrance brdf
    float NDF = DistributionGGX(normal, H, roughness);
    float G   = GeometrySmith(normal, camDirection, L, roughness);
    vec3 F    = fresnelSchlick(max(dot(H, camDirection), 0.0), F0);

    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - Metallic;

    vec3 numerator    = NDF * G * F;
    float denominator = 4.0 * max(dot(normal, camDirection), 0.0) * max(dot(normal, L), 0.0);
    vec3 specular     = numerator / max(denominator, 0.001);

    // add to outgoing radiance Lo
    float NdotL = max(dot(normal, L), 0.0);
    vec3 radiance = lightColor * attenuation;
    return (kD * Albedo / PI + specular) * radiance * NdotL;
}
