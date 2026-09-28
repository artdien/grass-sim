#include "./common/noise.glsl";

uniform float uHeight;
uniform float uFrequency;

out vec3 vWorldPosition;
out vec3 vWorldNormal;

// Height of the terrain at a point on the ground plane (world XZ), in world Y.
float terrainHeight(vec2 xz) {
  vec2 q = xz * uFrequency;
  float n = perlin_noise(q);
  return n * uHeight;
}

void main() {
  vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vec2 xz = worldPosition.xz;

  // Sample the height field and its two neighbors to reconstruct the surface
  // normal, so the slopes actually catch the light instead of staying flat.
  const float e = 0.01;
  float h = terrainHeight(xz);
  float hx = terrainHeight(xz + vec2(e, 0.0));
  float hz = terrainHeight(xz + vec2(0.0, e));

  worldPosition.y += h;
  vec3 n = normalize(vec3(-(hx - h) / e, 1.0, -(hz - h) / e));

  vWorldPosition = worldPosition;
  vWorldNormal = n;

  gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
}
