import calcNormals from "../../web/angle-normals.js";
import deepmerge2 from "../../web/deepmerge.js";
export class Mesh {
  constructor(vertices, indices, normals) {
    this.vertices = [];
    this.indices = [];
    this.normals = [];
    this.vertices = vertices;
    this.indices = indices;
    this.normals = normals || calcNormals(indices, vertices);
  }
  config(conf) {
    return deepmerge2(conf, {
      elements: this.indices,
      attributes: {
        position: this.vertices,
        normal: this.normals
      }
    });
  }
}
//# sourceMappingURL=mesh.js.map
