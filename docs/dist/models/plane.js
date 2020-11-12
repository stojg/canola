import {vec2, vec3} from "../../web/gl-matrix.js";
const options = {size: 1, width: 1, height: 1};
const indices = [];
const positions = [];
const normals = [];
const uvs = [];
const width = options.width || options.size || 1;
const height = options.height || options.size || 1;
const halfWidth = width / 2;
const halfHeight = height / 2;
positions.push(vec3.fromValues(-halfWidth, -halfHeight, 0));
normals.push(vec3.fromValues(0, 0, -1));
uvs.push(vec2.fromValues(0, 0));
positions.push(vec3.fromValues(halfWidth, -halfHeight, 0));
normals.push(vec3.fromValues(0, 0, -1));
uvs.push(vec2.fromValues(1, 0));
positions.push(vec3.fromValues(halfWidth, halfHeight, 0));
normals.push(vec3.fromValues(0, 0, -1));
uvs.push(vec2.fromValues(1, 1));
positions.push(vec3.fromValues(-halfWidth, halfHeight, 0));
normals.push(vec3.fromValues(0, 0, -1));
uvs.push(vec2.fromValues(0, 1));
indices.push(0);
indices.push(1);
indices.push(2);
indices.push(0);
indices.push(2);
indices.push(3);
export default {
  positions,
  normals,
  uvs,
  indices
};
//# sourceMappingURL=plane.js.map
