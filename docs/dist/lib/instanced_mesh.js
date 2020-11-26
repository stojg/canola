import {Model} from "./model.js";
import deepmerge2 from "../../web/deepmerge.js";
import {mat4, vec3} from "../../web/gl-matrix.js";
export class InstancedMesh {
  constructor(regl, mesh, models) {
    this.mesh = mesh;
    this.models = models;
    this.buffer = regl.buffer({data: [], type: "float", length: models.length, usage: "static"});
    this.modelMeshConfig = this.mesh.config(Model.config({}, this.buffer));
    this._updateBuffer();
  }
  config(prev) {
    const inst = deepmerge2(prev, {instances: this.models.length});
    return deepmerge2(inst, this.modelMeshConfig);
  }
  update() {
    this.models.forEach((m) => m.update());
    this._updateBuffer();
  }
  _updateBuffer() {
    const a = [];
    this.models.forEach((model2) => {
      a.push(model2.bufferData);
    });
    this.buffer({data: a});
  }
  sort(fromPosition) {
    this.models.sort((a, b) => {
      const aPos = vec3.create();
      const bPos = vec3.create();
      mat4.getTranslation(aPos, a.model);
      mat4.getTranslation(bPos, b.model);
      return vec3.sqrDist(fromPosition, aPos) - vec3.sqrDist(fromPosition, bPos);
    });
  }
}
//# sourceMappingURL=instanced_mesh.js.map
