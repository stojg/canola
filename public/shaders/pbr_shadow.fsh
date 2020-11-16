precision highp float;

const float PI = 3.14159265359;

// material parameters
uniform vec3  albedo;
uniform float metallic;
uniform float roughness;

// general params
uniform float ao;

#define numLights 4
uniform samplerCube shadowCubes[numLights];

// lights
struct Light {
    vec3 color;
    vec4 position;
    float radius;
};
uniform Light lights[numLights];

// camera
uniform vec3 camPos;

// from vertexshader
varying vec3 WorldPos;
varying vec3 Normal;

float DistributionGGX(vec3 N, vec3 H, float roughness);
float GeometrySchlickGGX(float NdotV, float roughness);
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness);
vec3 fresnelSchlick(float cosTheta, vec3 F0);
vec4 getSampleFromArray(samplerCube textures[numLights], int ndx, vec3 uv);
vec3 directIllumination(float distance, float lightRadius, vec3 lightColour, float cutoff);

void main()
{
    vec3 N = normalize(Normal);
    vec3 V = normalize(camPos - WorldPos);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    vec3 Lo = vec3(0.0);

    for (int i = 0; i < numLights; ++i)
    {
        vec3 direction = lights[i].position.xyz - WorldPos;
        float distance = length(direction);

        vec3 radiance = directIllumination(distance, lights[i].radius, lights[i].color, 0.1);
        if(dot(radiance, radiance) == 0.0) {
            continue;
        }

        const float bias = 0.2;
        float env = getSampleFromArray(shadowCubes, i, direction * -1.0 * vec3(0.1)).r;
        if((env + bias) < (distance)) {
            continue;
        }

        // calculate per-light radiance
        vec3 L = normalize(direction);
        vec3 H = normalize(V + L);

        // cook-torrance brdf
        float NDF = DistributionGGX(N, H, roughness);
        float G   = GeometrySmith(N, V, L, roughness);
        vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        vec3 numerator    = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0);
        vec3 specular     = numerator / max(denominator, 0.001);

        // add to outgoing radiance Lo
        float NdotL = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    vec3 ambient = albedo * ao;
    vec3 color = ambient + Lo;

    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));

    gl_FragColor = vec4(color, 1.0);
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
    float k = (r*r) / 8.0;

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

vec4 getSampleFromArray(samplerCube textures[numLights], int ndx, vec3 uv) {
    for (int i = 0; i < numLights; ++i) {
        if (i == ndx) {
            return textureCube(shadowCubes[i], uv);
        }
    }
    return vec4(1.0, 1.0, 1.0, 1.0);
}

vec3 directIllumination(float distance, float lightRadius, vec3 lightColour, float cutoff)
{
    float d = max(distance - lightRadius, 0.0);

    // calculate basic attenuation
    float denom = d/lightRadius + 1.0;
    float attenuation = 1.0 / (denom*denom);

    // scale and bias attenuation such that:
    //   attenuation == 0 at extent of max influence
    //   attenuation == 1 when d == 0
    attenuation = (attenuation - cutoff) / (1.0 - cutoff);
    attenuation = max(attenuation, 0.0);

    return lightColour * attenuation;
}

void doSoftShadows() {
    //        const float bias = 0.1;
    //        float visibility = 0.0;
    // do soft shadows:
    //        for (int x = 0; x < 2; x++) {
    //            for (int y = 0; y < 2; y++) {
    //                for (int z = 0; z < 2; z++) {
    //                    vec4 env = getSampleFromArray(shadowCubes, i, direction * -1.0 + vec3(x, y, z) * vec3(0.1));
    //                    visibility += (env.x + bias) < (distance) ? 0.0 : 1.0;
    //                }
    //            }
    //        }
    //        visibility *= 0.125;
    //        vec4 env = getSampleFromArray(shadowCubes, i, direction * -1.0 * vec3(0.1));
    //        visibility += (env.r + bias) < (distance) ? 0.0 : 1.0;
}
