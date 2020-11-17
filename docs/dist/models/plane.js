import {vec2} from "../../web/gl-matrix.js";
const options = {size: 1, width: 1, height: 1};
const uvs = [];
const width = options.width || options.size || 1;
const height = options.height || options.size || 1;
const halfWidth = width / 2;
const halfHeight = height / 2;
uvs.push(vec2.fromValues(0, 1));
uvs.push(vec2.fromValues(1, 1));
uvs.push(vec2.fromValues(1, 0));
uvs.push(vec2.fromValues(0, 0));
const positions = [
  [-halfWidth, 0, -halfHeight],
  [+halfWidth, 0, -halfHeight],
  [-halfWidth, 0, +halfHeight],
  [+halfWidth, 0, +halfHeight]
];
const normals = [
  [0, 1, 0],
  [0, 1, 0],
  [0, 1, 0],
  [0, 1, 0]
];
const indices = [
  [3, 1, 0],
  [0, 2, 3]
];
export default {
  positions,
  normals,
  uvs,
  indices
};
//# sourceMappingURL=plane.js.map
