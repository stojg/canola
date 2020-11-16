import normals from "../../web/angle-normals.js";
const cubePosition = [
  [-0.5, 0.5, 0.5],
  [0.5, 0.5, 0.5],
  [0.5, -0.5, 0.5],
  [-0.5, -0.5, 0.5],
  [0.5, 0.5, 0.5],
  [0.5, 0.5, -0.5],
  [0.5, -0.5, -0.5],
  [0.5, -0.5, 0.5],
  [0.5, 0.5, -0.5],
  [-0.5, 0.5, -0.5],
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],
  [-0.5, 0.5, -0.5],
  [-0.5, 0.5, 0.5],
  [-0.5, -0.5, 0.5],
  [-0.5, -0.5, -0.5],
  [-0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5],
  [0.5, 0.5, 0.5],
  [-0.5, 0.5, 0.5],
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],
  [0.5, -0.5, 0.5],
  [-0.5, -0.5, 0.5]
];
const cubePositionA = cubePosition.flatMap((v) => v);
const cubeUv = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1]
];
const cubeElements = [
  [2, 1, 0],
  [2, 0, 3],
  [6, 5, 4],
  [6, 4, 7],
  [10, 9, 8],
  [10, 8, 11],
  [14, 13, 12],
  [14, 12, 15],
  [18, 17, 16],
  [18, 16, 19],
  [20, 21, 22],
  [23, 20, 22]
];
const cubeNormals = normals(cubeElements, cubePosition);
const cubeNormalsA = cubeNormals.flatMap((v) => v);
export const cube = {
  positions: cubePosition,
  positionsA: cubePositionA,
  normals: cubeNormals,
  normalsA: cubeNormalsA,
  uvs: cubeUv,
  indices: cubeElements
};
//# sourceMappingURL=cube.js.map
