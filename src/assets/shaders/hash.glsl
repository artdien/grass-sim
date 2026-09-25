#ifndef HASH_GLSL
#define HASH_GLSL

// Maps a 2D lattice point to a pseudo-random float in [0, 1).
// The lattice hash shared by the noise functions in noise.glsl.
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

#endif
