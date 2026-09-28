#ifndef LIGHTING_GLSL
#define LIGHTING_GLSL

#include "./envmap.glsl";

// Schlick's approximation for Fresnel term
float fresnel(vec3 direction, vec3 reflectionAxis) {
  const float F0 = 0.04; // Base reflectivity, 0.04 is common value for dielectrics
  return F0 + (1.0 - F0) * pow(1.0 - max(dot(direction, reflectionAxis), 0.0), 5.0);
}

// Environmental lighting
vec3 envLighting(sampler2D envMap, vec3 viewDirection, vec3 normal) {
  return sampleEquirectangular(envMap, normalize(reflect(-viewDirection, normal))) * fresnel(viewDirection, normal);
}

// Hemispherical lighting
vec3 ambientLighting(vec3 groundColor, vec3 skyColor, vec3 normal) {
  return mix(groundColor, skyColor, normal.y * 0.5 + 0.5);
}

// Lambertian lighting
vec3 diffuseLighting(vec3 lightColor, vec3 lightDirection, vec3 normal) {
  return lightColor * max(dot(lightDirection, normal), 0.0);
}

// Half-lambertian lighting — remaps dot(lightDirection, normal) to [0, 1] so faces not directly facing the light stay softly lit; `softness` exponent controls how sharply the shading wraps the terminator (1 is pure half-lambertian)
vec3 halfDiffuseLighting(vec3 lightColor, vec3 lightDirection, vec3 normal, float softness) {
  return lightColor * pow(dot(lightDirection, normal) * 0.5 + 0.5, softness);
}

// Blinn-Phong model
vec3 specularLighting(vec3 lightColor, vec3 lightDirection, vec3 halfwayVector, vec3 normal, float intensity,
                      float shininess) {
  return lightColor * intensity * pow(max(dot(halfwayVector, normal), 0.0), shininess) *
         fresnel(lightDirection, halfwayVector);
}

#endif
