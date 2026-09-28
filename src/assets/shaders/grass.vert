#include "./common/math.glsl";
#include "./common/noise.glsl";

uniform float uTime;

uniform float uHeight;
uniform float uFrequency;

out vec3 vWorldPosition;
out vec3 vWorldNormal;
out vec3 vTangent;
out vec3 vBitangent;
out vec2 vUV;
out vec3 vGrassBladeColor;
out float vGrassBladeHeight;

uniform float uWindVelocity;                // range [0, 1]
uniform float uWindRandomness;              // range [0, 1]
uniform float uWindAngle;                   // range [0, 2*PI]
uniform float uGrassTileSize;               // range [1, inf]
uniform float uGrassBladeWidth;             // range (0, 1]
uniform float uGrassBladeHeight;            // range (0, 5]
uniform float uGrassBladeBending;           // range [0, PI/4]
uniform float uGrassBladeHeightRandomness;  // range [0, 1]
uniform float uGrassBladeColorRandomness;   // range [0, 1]
uniform float uGrassBladeColorDistribution; // range [0, 1]
uniform vec3 uGrassBladeBaseColor1;
uniform vec3 uGrassBladeTipColor1;
uniform vec3 uGrassBladeBaseColor2;
uniform vec3 uGrassBladeTipColor2;

void main() {
  /* --- Initialization --- */

  float localHeight = position.y; // range is [0,1]
  vec4 localPosition = vec4(position, 1.0);

  // Blades share gl_InstanceID across tiles, so seed the PCG with the tile anchor
  // (the mesh position) or neighbouring tiles would repeat exactly.
  vec2 tileCell = floor(modelMatrix[3].xz / uGrassTileSize + 0.5);
  uint tileSeed = uint(hash21(tileCell) * 4294967295.0);
  vec3 instanceHash = hashPCG(tileSeed + uint(gl_InstanceID));

  // Shift the root randomly within the tile, anchored in world space by the tile mesh position.
  vec2 rootPosition = modelMatrix[3].xz + 0.5 * uGrassTileSize * (instanceHash.xz * 2.0 - 1.0);

  /* --- Wind Modelling --- */

  float windStrength = uWindVelocity * smoothstep(-1.0, 1.0, perlin_noise(uTime + 0.1 * uWindRandomness * rootPosition));
  float windBendingDegree = windStrength * smoothstep(-1.0, 1.0, perlin_noise(uTime * uWindVelocity * rootPosition));

  vec3 windAxis = vec3(cos(uWindAngle), 0.0, sin(uWindAngle));
  float windBendingAngle = uWindVelocity * PI * windStrength * localHeight; // tips are bent stronger

  /* --- Local Geometry --- */

  // Scale grass blade (height will be scaled below)
  localPosition.x *= uGrassBladeWidth;

  // Bend grass blade with cubice Bezier curve.
  float bendingDegree = 0.5 * ((instanceHash.y * 2.0 - 1.0) + windBendingDegree) * uGrassBladeBending;
  vec3 p0 = vec3(0.0);
  vec3 p1 = vec3(0.0, 0.33, 0.0);
  vec3 p2 = vec3(0.0, 0.66, 0.0);
  vec3 p3 = vec3(0.0, cos(bendingDegree), sin(bendingDegree));
  vec3 bezier = cubicBezierCurve(p0, p1, p2, p3, localHeight);

  // Vary grass blade height slightly for a more 'realistic' look
  float heightVariation = 1.0 + (0.5 * uGrassBladeHeightRandomness * (instanceHash.y * 2.0 - 1.0));
  float height = uGrassBladeHeight * heightVariation;

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
  worldPosition.xz += rootPosition;

  // Lift the entire blade based on the terrain height at the root.
  worldPosition.y += terrainHeight(rootPosition, uFrequency, uHeight);

  // --- Shading Data ---

  // Mix two grass color palettes based on world-space/instance noise
  vec3 colorA = mix(uGrassBladeBaseColor1, uGrassBladeTipColor1, localPosition.y);
  vec3 colorB = mix(uGrassBladeBaseColor2, uGrassBladeTipColor2, localPosition.y);

  float spatialNoise = perlin_noise(worldPosition.xz * uGrassBladeColorDistribution);
  float instanceRandomness = instanceHash.y * uGrassBladeColorRandomness;
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