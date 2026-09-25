#include "./noise.glsl";

out vec3 vWorldPosition;
out vec3 vNormal;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);

  vWorldPosition = worldPosition.xyz;
  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
