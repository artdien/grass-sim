#ifndef HASH_GLSL
#define HASH_GLSL

// Maps a 2D lattice point to a pseudo-random float in [0, 1).
// The lattice hash shared by the noise functions in noise.glsl.
float hash21(vec2 p) {
  uvec2 q = uvec2(ivec2(p));
  q = q * 3266489909u + 1u;
  q.x += q.y * 3266489909u;
  q.y += q.x * 3266489909u;
  q ^= q >> 16u;
  q.x += q.y * 3266489909u;
  q.y += q.x * 3266489909u;
  q ^= q >> 16u;
  return float(q.x) * (1.0 / 4294967295.0);
}

// Permuted Congruential Generator (PCG) hash function.
// Output is vec3 with random values in [0.0, 1.0].
vec3 hashPCG(uint x) {
  uint state = x * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  uint result = (word >> 22u) ^ word;

  // Convert to float in [0, 1]
  return vec3(float(result & 0xFFFu) / 4095.0, float((result >> 12u) & 0xFFFu) / 4095.0,
              float((result >> 24u) & 0xFFu) / 255.0);
}

#endif
