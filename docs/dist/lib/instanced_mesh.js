import {Model} from "./model.js";
import deepmerge2 from "../../web/deepmerge.js";
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
    this.models.forEach((l) => {
      a.push(l.bufferData);
    });
    this.buffer({data: a});
  }
}
//# sourceMappingURL=instanced_mesh.js.map
