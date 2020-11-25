#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define NUM_POINT_LIGHTS 4
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
    float radius;
    float invSqrRadius;
};
uniform Light pointLights[NUM_POINT_LIGHTS];
uniform Light dirLight;
uniform samplerCube pointLightShadows[NUM_POINT_LIGHTS];
uniform sampler2D dirShadow;

// from vertexshader
varying vec3 WorldPos;
varying vec3 Normal;
varying vec3 CamDirection;
varying vec3 Albedo;
varying float Metallic;
varying float Roughness;

vec4 getSampleFromArray(int ndx, vec3 uv);
float getDistanceAtt( vec3 unormalizedLightVector , float invSqrAttRadius);
float getAngleAtt(vec3 normalizedLightVector, vec3 lightDir, float lightAngleScale, float lightAngleOffset);
vec3 brdf(vec3 albedo, vec3 F0, vec3 N, vec3 L, vec3 C, float roughness);

void main()
{
    vec3 N = normalize(Normal);
    vec3 V = normalize(CamDirection);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, Albedo, Metallic);
    vec3 Lo = vec3(0.0);

    for (int i = 0; i < NUM_POINT_LIGHTS; ++i)
    {
        vec3 L_ray = pointLights[i].position.xyz - WorldPos;
        vec3 L = normalize(L_ray);

        float attenuation = 1.0;
        attenuation *= getDistanceAtt(L_ray, pointLights[i].invSqrRadius);
        attenuation *= getAngleAtt(L, L, 1.0, 0.0);
        if (attenuation < EPSILON) {
            continue;
        }

        vec3 lightColor = pointLights[i].color * (pointLights[i].intensity / (4.0 * PI));
        vec3 radiance = lightColor * attenuation;

        vec3 pColor = brdf(Albedo, F0, N, L, V, Roughness) * radiance;
        if (dot(pColor, pColor) < EPSILON) {
            continue;
        }

        // shadow check
        if ((getSampleFromArray(i, -L_ray).r * SHADOW_BIAS) < dot(L_ray, L_ray)) {
            continue;
        }

        Lo += pColor;
    }

    vec3 radiance = dirLight.color * (dirLight.intensity / (4.0 * PI));
    Lo += brdf(Albedo, F0, N, normalize(dirLight.position.xyz), V, Roughness) * radiance;

    vec3 fakeAmbient = Albedo * ao;
    vec3 color = fakeAmbient + Lo;

    gl_FragData[0] = vec4(color, 1.0);
}

vec4 getSampleFromArray(int ndx, vec3 uv) {
    for (int i = 0; i < NUM_POINT_LIGHTS; ++i) {
        if (i == ndx) {
            return textureCube(pointLightShadows[i], uv);
        }
    }
    return vec4(0.0, 1.0, 1.0, 1.0);
}

float smoothDistanceAtt (float squaredDistance, float invSqrAttRadius) {
    float factor = squaredDistance * invSqrAttRadius;
    float smoothFactor = clamp(1.0 - factor * factor, 0.0, 1.0);
    return smoothFactor * smoothFactor;
}

float getDistanceAtt(vec3 L_ray, float invSqrAttRadius) {
    float sqrDist = dot(L_ray, L_ray);
    return 1.0 / sqrDist * smoothDistanceAtt(sqrDist , invSqrAttRadius);
}

float getAngleAtt(vec3 L, vec3 lightForward, float lightAngleScale, float lightAngleOffset)
{
    float attenuation = clamp(dot(lightForward, L) * lightAngleScale + lightAngleOffset, 0.0, 1.0);
    return attenuation * attenuation;
}

// cook-torrance brdf
//
// albedo is the colour of the dialetric or the tint of the metal
// F0 surface reflection at zero incidence, dielectric
// N is the normal vector
// L is the normalised light ray
// V is the world vector to the camera / view
// V is the world vector to the camera / views
// roughness is the roughness param in 0.0 - 1.0
//
// remember to map the result back to gamma corrected space
vec3 brdf(vec3 albedo, vec3 F0, vec3 N, vec3 L, vec3 V, float roughness) {
    const float PI = 3.14159265359;

    // world position of the light
    vec3 H = normalize(V + L);

    // the normal distribution
    float a = roughness * roughness;
    // this is something disney and EPIC mention, square roughness looks better apparently
    float sqrA   = a*a;
    float NdotH  = max(dot(N, H), 0.0);
    float sqrNdotH = NdotH * NdotH;
    float denom = (sqrNdotH * (sqrA - 1.0) + 1.0);
    float NDF = sqrA / (PI * denom * denom);

    // geometry distribution
    float r = roughness + 1.0;
    float k = (r*r) * 0.125; // divide by 8

    float NdotL = max(dot(N, L), 0.0);
    float ggx1 = NdotL / (NdotL * (1.0 - k) + k);
    float NdotV = max(dot(N, V), 0.0);
    float ggx2 = NdotV / (NdotV * (1.0 - k) + k);

    float G = ggx1 * ggx2;

    // the Schlick approximation to fresnel reflection
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);

    // divide the energy into reflective and absorbant
    vec3 kSpecular = F;
    vec3 kDiffuse = vec3(1.0) - kSpecular;
    kDiffuse *= 1.0 - Metallic;

    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0);
    vec3 specular = (NDF * G * F) / max(denominator, 0.001);

    return (kDiffuse * Albedo / PI + specular) * NdotL;
}
