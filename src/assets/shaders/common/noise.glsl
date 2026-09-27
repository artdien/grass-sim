#ifndef NOISE_GLSL
#define NOISE_GLSL

#include "./hash.glsl";

// Pick a unit gradient direction for a [0, 1) hash.
vec2 grad(float h) {
  float a = h * 2.0 * 3.14159265359;
  return vec2(cos(a), sin(a));
}

// 2D Perlin (improved) gradient noise on a square lattice, output range is [-1, 1].
// Broad, smooth undulations, well suited to large terrain features.
float perlin_noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float n00 = dot(grad(hash21(i)), f);
  float n10 = dot(grad(hash21(i + vec2(1.0, 0.0))), f - vec2(1.0, 0.0));
  float n01 = dot(grad(hash21(i + vec2(0.0, 1.0))), f - vec2(0.0, 1.0));
  float n11 = dot(grad(hash21(i + vec2(1.0, 1.0))), f - vec2(1.0, 1.0));

  float x0 = mix(n00, n10, u.x);
  float x1 = mix(n01, n11, u.x);
  return mix(x0, x1, u.y);
}

// 2D simplex noise on a triangular lattice, output range is [-1, 1].
// Slightly cheaper and smoother than Perlin, good for finer detail.
float simplex_noise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0 - sqrt(3.0)) / 6.0
                      0.366025403784439,  // 0.5 * (sqrt(3.0) - 1.0)
                      -0.577350269189626, // -1.0 + 2.0 * C.x
                      0.024390243902439   // 1.0 / 41.0
  );

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  vec3 p = vec3(hash21(i), hash21(i + i1), hash21(i + vec2(1.0, 1.0)));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * p - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x.x + h.x * h.x;
  g.yz = a0.yz * x.yz + h.yz * h.yz;

  return 130.0 * dot(m, g);
}

#endif
