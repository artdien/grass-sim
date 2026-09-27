#ifndef MATH_GLSL
#define MATH_GLSL

const float PI = 3.14159265;

// Calculates the position vector of a 3D Cubic Bezier curve at time t
vec3 cubicBezierCurve(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
  float u = 1.0 - t;
  float tt = t * t;
  float uu = u * u;
  float uuu = uu * u;
  float ttt = tt * t;

  // Explicit Bernstein polynomial expansion
  vec3 p = uuu * p0;      // (1-t)^3 * P0
  p += 3.0 * uu * t * p1; // 3 * (1-t)^2 * t * P1
  p += 3.0 * u * tt * p2; // 3 * (1-t) * t^2 * P2
  p += ttt * p3;          // t^3 * P3

  return p;
}

// Calculates the tangent (derivative) vector of a 3D Cubic Bezier curve at time t
vec3 cubicBezierCurveDerivative(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
  float mt = 1.0 - t;

  // Coefficients derived from the derivative formula
  float c0 = 3.0 * mt * mt; // 3 * (1 - t)^2
  float c1 = 6.0 * mt * t;  // 6 * (1 - t) * t
  float c2 = 3.0 * t * t;   // 3 * t^2

  // Calculate and return the tangent vector
  return c0 * (p1 - p0) + c1 * (p2 - p1) + c2 * (p3 - p2);
}

// Creates a matrix for rotating around an arbitrary axis
mat4 rotate(vec3 axis, float angle) {
  axis = normalize(axis);

  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0,
              oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0,
              oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0, 0.0,
              0.0, 0.0, 1.0);
}

#endif
