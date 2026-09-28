#include "./common/lighting.glsl";

uniform sampler2D uNormalMap;
uniform sampler2D uEnvMap;
uniform vec3 uSkyColor;
uniform vec3 uGroundColor;
uniform vec3 uLightColor;
uniform vec3 uLightDirection;
uniform float uShininess;
uniform float uSpecularIntensity;
uniform float uEnvironmentStrength;
uniform float uGrassBladeSelfShadowing; // range [0, 10]

in vec3 vWorldPosition;
in vec3 vWorldNormal;
in vec3 vTangent;
in vec3 vBitangent;
in vec2 vUV;
in vec3 vGrassBladeColor;
in float vGrassBladeHeight;

layout(location = 0) out vec4 vFragColor;

void main() {
  float faceSign = gl_FrontFacing ? 1.0 : -1.0;
  vec3 tangent = normalize(faceSign * vTangent);
  vec3 bitangent = normalize(faceSign * vBitangent);
  vec3 normal = normalize(faceSign * vWorldNormal);

  mat3 TBN = mat3(tangent, bitangent, normal);

  // Perturb the geometric normal with the blade's normal map through its world TBN basis.
  vec3 N = normalize(TBN * (texture(uNormalMap, vUV).xyz * 2.0 - 1.0));
  vec3 V = normalize(cameraPosition - vWorldPosition);

  // Guard against a zero - length direction so the light degrades to off instead of NaN.
  float lightLength = length(uLightDirection);
  vec3 L = lightLength > 0.0 ? -uLightDirection / lightLength : vec3(0.0);
  vec3 H = normalize(L + V);

  vec3 ambient = ambientLighting(uGroundColor, uSkyColor, N);
  vec3 diffuse = diffuseLighting(uLightColor, L, N);
  vec3 specular = specularLighting(uLightColor, L, H, N, uSpecularIntensity, uShininess);
  vec3 env = uEnvironmentStrength * envLighting(uEnvMap, V, N);

  float selfShadowing = 0.8 * pow(vGrassBladeHeight, uGrassBladeSelfShadowing) + 0.2;
  vec3 color = selfShadowing * vGrassBladeColor * (ambient + diffuse) + specular + env;

  vFragColor = vec4(color, 1.0);
}
