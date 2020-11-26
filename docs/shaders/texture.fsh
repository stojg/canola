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
uniform float wRcp;
uniform float hRcp;

// from vertexshader
varying vec3 WorldPos;
varying vec3 Normal;
varying vec3 CamDirection;
varying vec3 Albedo;
varying float Metallic;
varying float Roughness;
varying vec3 Position;
varying vec3 Scale;


vec4 getSampleFromArray(int ndx, vec3 uv);
float getDistanceAtt( vec3 unormalizedLightVector , float invSqrAttRadius);
float getAngleAtt(vec3 normalizedLightVector, vec3 lightDir, float lightAngleScale, float lightAngleOffset);
vec3 brdf(vec3 albedo, float metallic, vec3 F0, vec3 N, vec3 L, vec3 C, float roughness);

vec3 tonemap(vec3 v) {
    return pow((v / (v + vec3(1.0))), vec3(1.0/2.2));
}

// Some useful functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

/* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
vec3 random3(vec3 c) {
    float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0*j);
    j *= .125;
    r.x = fract(512.0*j);
    j *= .125;
    r.y = fract(512.0*j);
    return r-0.5;
}

/* skew constants for 3d simplex functions */
const float F3 =  0.3333333;
const float G3 =  0.1666667;

/* 3d simplex noise */
float simplex3d(vec3 p) {
    /* 1. find current tetrahedron T and it's four vertices */
    /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
    /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/

    /* calculate s and x */
    vec3 s = floor(p + dot(p, vec3(F3)));
    vec3 x = p - s + dot(s, vec3(G3));

    /* calculate i1 and i2 */
    vec3 e = step(vec3(0.0), x - x.yzx);
    vec3 i1 = e*(1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy*(1.0 - e);

    /* x1, x2, x3 */
    vec3 x1 = x - i1 + G3;
    vec3 x2 = x - i2 + 2.0*G3;
    vec3 x3 = x - 1.0 + 3.0*G3;

    /* 2. find four surflets and store them in d */
    vec4 w, d;

    /* calculate surflet weights */
    w.x = dot(x, x);
    w.y = dot(x1, x1);
    w.z = dot(x2, x2);
    w.w = dot(x3, x3);

    /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
    w = max(0.6 - w, 0.0);

    /* calculate surflet components */
    d.x = dot(random3(s), x);
    d.y = dot(random3(s + i1), x1);
    d.z = dot(random3(s + i2), x2);
    d.w = dot(random3(s + 1.0), x3);

    /* multiply d by w^4 */
    w *= w;
    w *= w;
    d *= w;

    /* 3. return the sum of the four surflets */
    return dot(d, vec4(52.0));
}

/* const matrices for 3d rotation */
const mat3 rot1 = mat3(-0.37, 0.36, 0.85,-0.14,-0.93, 0.34,0.92, 0.01,0.4);
const mat3 rot2 = mat3(-0.55,-0.39, 0.74, 0.33,-0.91,-0.24,0.77, 0.12,0.63);
const mat3 rot3 = mat3(-0.71, 0.52,-0.47,-0.08,-0.72,-0.68,-0.7,-0.45,0.56);

/* directional artifacts can be reduced by rotating each octave */
float simplex3d_fractal(vec3 m) {
    return 0.5333333*simplex3d(m*rot1) +0.2666667*simplex3d(2.0*m*rot2) +0.1333333*simplex3d(4.0*m*rot3) +0.0666667*simplex3d(8.0*m);
}


// https://www.shadertoy.com/view/XsX3zB
void main()
{
    float scale = 10.0;
    vec3 coord = vec3(Position.x * Scale.x , Position.y * Scale.y, Position.z * Scale.z) * scale;
    float val = simplex3d(coord);

    val = 0.5 * (val + 1.0);

    vec3 mtrlAlbedo = clamp(Albedo - (Albedo * val * .6), vec3(0), Albedo);
    float mtrlRoughness = clamp(Roughness * (1.0 - val * .4), 0.0, 1.0);
    float mtrlMetallic = Metallic;

    vec3 N = normalize(Normal);
    vec3 V = normalize(CamDirection);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, mtrlAlbedo, mtrlMetallic);

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

        vec3 pColor = brdf(mtrlAlbedo, mtrlMetallic, F0, N, L, V, mtrlRoughness) * radiance;
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
    Lo += brdf(mtrlAlbedo, mtrlMetallic, F0, N, normalize(dirLight.position.xyz), V, mtrlRoughness) * radiance;

    vec3 fakeAmbient = mtrlAlbedo * ao;
    vec3 color = fakeAmbient + Lo;

    gl_FragData[0] = vec4(tonemap(color), 1.0);
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
vec3 brdf(vec3 albedo, float metallic, vec3 F0, vec3 N, vec3 L, vec3 V, float roughness) {
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
    kDiffuse *= 1.0 - metallic;

    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0);
    vec3 specular = (NDF * G * F) / max(denominator, 0.001);

    return (kDiffuse * albedo / PI + specular) * NdotL;
}
