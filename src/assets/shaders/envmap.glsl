#ifndef ENVMAP_GLSL
#define ENVMAP_GLSL

// Converts a Y-up world-space direction to a coordinate on the 2:1 panorama
// the environment map is stored as, so any direction can be sampled from it.
// Mirrors Three's own equirect sampling (function equirectUV) so results
// stay consistent with the scene background.
vec2 equirectUV(vec3 direction) {
  const float PI = 3.141592653589793;
  vec3 d = normalize(direction);
  float u = atan(d.z, d.x) / (2.0 * PI) + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5;
  return vec2(u, v);
}

// Samples the equirectangular panorama of `envMap` along `direction`.
vec3 sampleEquirectangular(sampler2D envMap, vec3 direction) {
  return texture(envMap, equirectUV(direction)).xyz;
}

#endif
