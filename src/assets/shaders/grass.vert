#include "./common/math.glsl";
#include "./common/noise.glsl";

uniform float uTime;

uniform int uNoiseType;
uniform float uHeight;
uniform float uFrequency;

out vec3 vWorldPosition;
out vec3 vWorldNormal;
out vec3 vTangent;
out vec3 vBitangent;
out vec2 vUV;
out vec3 vGrassBladeColor;
out float vGrassBladeHeight;

const float WIND_VELOCITY = 0.2;                  // range [0, 1]
const float WIND_STRENGTH = 1.0;                  // range [0, 1]
const float WIND_ANGLE = 0.0;                     // range [0, 2*PI]
const float GRASS_TILE_SIZE = 10.0;               // range [1, inf]
const float GRASS_BLADE_WIDTH = 0.2;              // range (0, 1]
const float GRASS_BLADE_HEIGHT = 1.5;             // range (0, 5]
const float GRASS_BLADE_COLOR_RANDOMNESS = 0.2;   // range [0, 1]
const float GRASS_BLADE_COLOR_DISTRIBUTION = 1.0; // range [0, 1]
const float GRASS_BLADE_BENDING = PI / 8.0;       // range [0, PI/4]
const float GRASS_BLADE_HEIGHT_RANDOMNESS = 0.5;  // range [0, 1]
const vec3 GRASS_BLADE_COLOR_BASE_1 = vec3(0.05, 0.3, 0.02);
const vec3 GRASS_BLADE_COLOR_TIP_1 = vec3(0.4, 0.7, 0.2);
const vec3 GRASS_BLADE_COLOR_BASE_2 = vec3(0.15, 0.35, 0.05);
const vec3 GRASS_BLADE_COLOR_TIP_2 = vec3(0.6, 0.8, 0.3);

float terrainHeight(vec2 xz) {
  vec2 q = xz * uFrequency;
  float n = (uNoiseType == 0) ? perlin_noise(q) : simplex_noise(q);
  return n * uHeight;
}

void main() {
  /* --- Initialization --- */

  float localHeight = position.y; // range is [0,1]
  vec4 localPosition = vec4(position, 1.0);

  // Blades share gl_InstanceID across tiles, so seed the PCG with the tile anchor
  // (the mesh position) or neighbouring tiles would repeat exactly.
  vec2 tileCell = floor(modelMatrix[3].xz / GRASS_TILE_SIZE + 0.5);
  uint tileSeed = uint(hash21(tileCell) * 4294967295.0);
  vec3 instanceHash = hashPCG(tileSeed + uint(gl_InstanceID));

  /* --- Wind Modelling --- */

  float windStrength = WIND_STRENGTH * perlin_noise(uTime + WIND_STRENGTH * instanceHash.xz);
  float windBendingDegree = WIND_VELOCITY * windStrength * perlin_noise(uTime * WIND_VELOCITY * instanceHash.xz);

  vec3 windAxis = vec3(cos(WIND_ANGLE), 0.0, sin(WIND_ANGLE));
  float windBendingAngle = WIND_VELOCITY * PI * windStrength * localHeight; // tips are bent stronger

  /* --- Local Geometry --- */

  // Scale grass blade (height will be scaled below)
  localPosition.x *= GRASS_BLADE_WIDTH;

  // Bend grass blade with cubice Bezier curve.
  float bendingDegree = 0.5 * ((instanceHash.y * 2.0 - 1.0) + windBendingDegree) * GRASS_BLADE_BENDING;
  vec3 p0 = vec3(0.0);
  vec3 p1 = vec3(0.0, 0.33, 0.0);
  vec3 p2 = vec3(0.0, 0.66, 0.0);
  vec3 p3 = vec3(0.0, cos(bendingDegree), sin(bendingDegree));
  vec3 bezier = cubicBezierCurve(p0, p1, p2, p3, localHeight);

  // Vary grass blade height slightly for a more 'realistic' look
  float heightVariation = 1.0 + (0.5 * GRASS_BLADE_HEIGHT_RANDOMNESS * (instanceHash.y * 2.0 - 1.0));
  float height = GRASS_BLADE_HEIGHT * heightVariation;

  localPosition.y = bezier.y * height;
  localPosition.z = bezier.z * height;

  mat4 worldModelMatrix = mat4(1.0);

  // Apply additional bends caused by wind
  worldModelMatrix *= rotate(windAxis, windBendingAngle);

  // Rotate grass blade around Y-axis
  worldModelMatrix *= rotate(vec3(0.0, 1.0, 0.0), 2.0 * PI * instanceHash.y);

  /* --- World Placement --- */

  // Bend and rotate the blade about its root (the local origin).
  vec3 worldPosition = (worldModelMatrix * localPosition).xyz;

  // Shift the root randomly within the tile, anchored in world space by the tile mesh position.
  vec2 rootPosition = modelMatrix[3].xz + 0.5 * GRASS_TILE_SIZE * (instanceHash.xz * 2.0 - 1.0);
  worldPosition.xz += rootPosition;

  // Lift the entire blade based on the terrain height at the root.
  worldPosition.y += terrainHeight(rootPosition);

  // --- Shading Data ---

  // Mix two grass color palettes based on world-space/instance noise
  vec3 colorA = mix(GRASS_BLADE_COLOR_BASE_1, GRASS_BLADE_COLOR_TIP_1, localPosition.y);
  vec3 colorB = mix(GRASS_BLADE_COLOR_BASE_2, GRASS_BLADE_COLOR_TIP_2, localPosition.y);

  float spatialNoise = perlin_noise(worldPosition.xz * GRASS_BLADE_COLOR_DISTRIBUTION);
  float instanceRandomness = instanceHash.y * GRASS_BLADE_COLOR_RANDOMNESS;
  float finalVariation = clamp(spatialNoise + instanceRandomness, 0.0, 1.0);

  vGrassBladeColor = mix(colorA, colorB, smoothstep(0.0, 1.0, finalVariation));
  vGrassBladeHeight = localHeight;

  // The new normal is perpendicular to the curve tangent and the blade width (X-axis)
  vec3 bezierDerivative = cubicBezierCurveDerivative(p0, p1, p2, p3, localHeight);
  vec3 localNormal = normalize(cross(vec3(1.0, 0.0, 0.0), bezierDerivative));

  // TBN Basis: Handle non-uniform scaling using the world normal matrix.
  // The normal matrix provided by Three.js is the viewspace normal matrix,
  // which would lead to wrong results.
  mat3 worldNormalMatrix = transpose(inverse(mat3(worldModelMatrix)));

  // Invert the tangent to align with the positive World X-axis
  vec3 worldNormal = normalize(worldNormalMatrix * localNormal);
  vec3 worldTangent = normalize(mat3(worldModelMatrix) * tangent.xyz);
  vec3 worldBitangent = normalize(cross(worldNormal, worldTangent) * tangent.w);

  vWorldPosition = worldPosition;
  vWorldNormal = worldNormal;
  vTangent = worldTangent;
  vBitangent = worldBitangent;
  vUV = uv;

  gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
}