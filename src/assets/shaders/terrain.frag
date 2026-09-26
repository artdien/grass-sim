#include "./lighting.glsl";

uniform sampler2D uEnvMap;
uniform vec3 uTerrainColor;
uniform vec3 uSkyColor;
uniform vec3 uGroundColor;
uniform vec3 uLightColor;
uniform vec3 uLightDirection;
uniform float uShininess;
uniform float uSpecularIntensity;

in vec3 vWorldPosition;
in vec3 vWorldNormal;

layout(location = 0) out vec4 vFragColor;

const float ENVIRONMENT_MAP_LIGHTING_STRENGTH = 0.5;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(cameraPosition - vWorldPosition);

  // Guard against a zero-length direction so the light degrades to off instead of NaN.
  float lightLength = length(uLightDirection);
  vec3 L = lightLength > 0.0 ? -uLightDirection / lightLength : vec3(0.0);
  vec3 H = normalize(L + V);

  vec3 ambient = ambientLighting(uGroundColor, uSkyColor, N);
  vec3 diffuse = diffuseLighting(uLightColor, L, N);
  vec3 specular = specularLighting(uLightColor, L, H, N, uSpecularIntensity, uShininess);
  vec3 env = ENVIRONMENT_MAP_LIGHTING_STRENGTH * envLighting(uEnvMap, V, N);

  vec3 color = uTerrainColor * (ambient + diffuse) + specular + env;

  vFragColor = vec4(color, 1.0);
}
