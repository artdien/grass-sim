uniform vec3 uTerrainColor;
uniform vec3 uSkyColor;
uniform vec3 uGroundColor;
uniform vec3 uDiffuseColor;
uniform vec3 uLightDirection;
uniform float uShininess;
uniform float uSpecularIntensity;

in vec3 vWorldPosition;
in vec3 vWorldNormal;

layout(location = 0) out vec4 vFragColor;

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);

  // Guard against a zero-length direction so the light degrades to off
  // instead of NaN.
  float lightLength = length(uLightDirection);
  vec3 l = lightLength > 0.0 ? -uLightDirection / lightLength : vec3(0.0);
  vec3 h = normalize(l + v);

  vec3 ambient = mix(uGroundColor, uSkyColor, n.y * 0.5 + 0.5);
  float diffuseTerm = max(dot(n, l), 0.0);
  float specularTerm =
      uSpecularIntensity * pow(max(dot(n, h), 0.0), uShininess);

  vec3 color =
      (ambient + uDiffuseColor * (diffuseTerm + specularTerm)) * uTerrainColor;

  vFragColor = vec4(color, 1.0);
}
