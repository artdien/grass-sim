#include "./noise.glsl"

void main() {
  // For testing purposes
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
