#ifndef NOISE_GLSL
#define NOISE_GLSL

#include "./hash.glsl";

// Pick a unit gradient direction for a [0, 1) hash.
vec2 grad(float h) {
  float angle = h * 6.28318530718;
  return vec2(cos(angle), sin(angle));
}

// 2D Perlin (improved) gradient noise on a square lattice, output range is [-1, 1].
// Broad, smooth undulations, well suited to large terrain features.
float perlin_noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  // Quintic interpolation curve (smooth C2 transitions)
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  // Calculate dot products using matching relative offsets
  float n00 = dot(grad(hash21(i)), f);
  float n10 = dot(grad(hash21(i + vec2(1.0, 0.0))), f - vec2(1.0, 0.0));
  float n01 = dot(grad(hash21(i + vec2(0.0, 1.0))), f - vec2(0.0, 1.0));
  float n11 = dot(grad(hash21(i + vec2(1.0, 1.0))), f - vec2(1.0, 1.0));

  // Bilinear mixing
  float x0 = mix(n00, n10, u.x);
  float x1 = mix(n01, n11, u.x);

  // Scale the exact mathematical peak (0.70710678) to 1.0
  return mix(x0, x1, u.y) * 1.41421356;
}

// Height of the terrain at a point on the ground plane (world XZ), in world Y.
float terrainHeight(vec2 xz, float frequency, float amplitude) {
  return 3.0 * amplitude * perlin_noise(0.2 * xz * frequency);
}

#endif
